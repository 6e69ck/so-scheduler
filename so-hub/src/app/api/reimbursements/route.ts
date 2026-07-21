import { NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Generate a Google Access Token for Google Service Account using Node.js built-in crypto.
 * Requires GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY.
 */
async function getGoogleAccessToken(clientEmail: string, privateKey: string): Promise<string> {
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const claimSet = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const base64UrlEncode = (str: string) =>
    Buffer.from(str)
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedClaimSet = base64UrlEncode(JSON.stringify(claimSet));
  const signatureInput = `${encodedHeader}.${encodedClaimSet}`;

  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signatureInput);
  const signature = signer.sign(privateKey, 'base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const jwt = `${signatureInput}.${signature}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!tokenRes.ok) {
    const errorText = await tokenRes.text();
    throw new Error(`Failed to obtain Google access token: ${errorText}`);
  }

  const tokenData = await tokenRes.json();
  return tokenData.access_token;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userName = searchParams.get('user');

    if (!userName || typeof userName !== 'string') {
      return NextResponse.json({ error: 'User name is required' }, { status: 400 });
    }

    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const rawPrivateKey = process.env.GOOGLE_PRIVATE_KEY;
    const sheetId = process.env.GOOGLE_SHEET_ID;

    if (!clientEmail || !rawPrivateKey || !sheetId) {
      console.warn('Google Sheets API environment variables missing');
      return NextResponse.json({ reimbursements: [] });
    }

    const privateKey = rawPrivateKey.replace(/\\n/g, '\n');

    // Get access token via native RS256 JWT
    const accessToken = await getGoogleAccessToken(clientEmail, privateKey);

    // Fetch values from "Reimbursements" sheet
    const rangeParam = encodeURIComponent('Reimbursements!A1:Z500');
    const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${rangeParam}`;
    const sheetsRes = await fetch(sheetsUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!sheetsRes.ok) {
      const errText = await sheetsRes.text();
      console.error('Google Sheets API error:', errText);
      return NextResponse.json({ reimbursements: [] });
    }

    const sheetsData = await sheetsRes.json();
    const rows: string[][] = sheetsData.values;

    if (!rows || rows.length === 0) {
      return NextResponse.json({ reimbursements: [] });
    }

    const dataRows = rows.slice(1);
    const normalizedUser = userName.trim().toLowerCase();

    // Filter rows where Column E (index 4) has "Sent" checked off AND Reimbursee matches current user
    const processedReimbursements = dataRows.filter(row => {
      if (!row || row.length === 0) return false;

      // Check Column E (Index 4) for "Sent" / "TRUE" / "x" / "CHECKED"
      const sentVal = (row[4] || '').toString().trim().toUpperCase();
      const isSent = sentVal === 'TRUE' || sentVal === 'SENT' || sentVal === 'X' || sentVal === 'CHECKED' || sentVal === 'YES';

      if (!isSent) return false;

      // Check if current user is in row (case-insensitive check)
      const matchesUser = row.some(cell => (cell || '').toString().trim().toLowerCase() === normalizedUser);

      return matchesUser;
    }).map((row, idx) => {
      const startDate = (row[0] || '').toString().trim();
      const endDate = (row[1] || '').toString().trim();
      const name = (row[2] || userName).toString().trim();
      const rawAmount = (row[3] || '').toString().trim();

      // Format date range: Col A -> Col B (or just Col A if Col B is empty or identical)
      let dateRange = startDate;
      if (endDate && endDate !== startDate) {
        dateRange = `${startDate} → ${endDate}`;
      }

      // Ensure amount formatting
      let formattedAmount = rawAmount;
      if (formattedAmount && !formattedAmount.startsWith('$')) {
        formattedAmount = `$${formattedAmount}`;
      }

      return {
        id: `reimbursement-${idx}`,
        startDate,
        endDate,
        dateRange,
        name,
        amount: formattedAmount,
        status: 'Sent',
        rawRow: row,
      };
    });

    return NextResponse.json({ reimbursements: processedReimbursements });
  } catch (error) {
    console.error('Error fetching Google Sheets reimbursements:', error);
    return NextResponse.json({ reimbursements: [], error: 'Failed to fetch Google Sheets reimbursements' });
  }
}
