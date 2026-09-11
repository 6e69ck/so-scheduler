import { NextResponse } from 'next/server';
import crypto from 'crypto';

const DEFAULT_SHEET_ID = '1o-g-OeMKTjXgJBC0iAcP0i5IqclX-zhaLGrTT0Kf0gY';
const DEFAULT_GID = '1220447153';

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

/**
 * Parse CSV text into 2D string array.
 */
function parseCsv(csvText: string): string[][] {
  const rows: string[][] = [];
  const lines = csvText.split(/\r?\n/);
  for (const line of lines) {
    if (!line.trim()) continue;
    const row: string[] = [];
    let inQuotes = false;
    let cur = '';
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === ',' && !inQuotes) {
        row.push(cur.trim());
        cur = '';
      } else {
        cur += c;
      }
    }
    row.push(cur.trim());
    rows.push(row);
  }
  return rows;
}

/**
 * Fetch rows from Google Sheets either via API (if service account keys configured)
 * or via public CSV export.
 */
async function fetchSheetRows(sheetId: string): Promise<string[][]> {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const rawPrivateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (clientEmail && rawPrivateKey) {
    try {
      const privateKey = rawPrivateKey.replace(/\\n/g, '\n');
      const accessToken = await getGoogleAccessToken(clientEmail, privateKey);
      const rangeParam = encodeURIComponent('Reimbursements!A1:Z500');
      const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${rangeParam}`;
      const sheetsRes = await fetch(sheetsUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (sheetsRes.ok) {
        const sheetsData = await sheetsRes.json();
        if (sheetsData.values && sheetsData.values.length > 0) {
          return sheetsData.values;
        }
      }
    } catch (err) {
      console.warn('Service account sheet fetch failed, trying direct sheet export:', err);
    }
  }

  // Fetch via public Google Sheets CSV export using GID or sheet name
  try {
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${DEFAULT_GID}`;
    const csvRes = await fetch(csvUrl, { cache: 'no-store' });
    if (csvRes.ok) {
      const csvText = await csvRes.text();
      const rows = parseCsv(csvText);
      if (rows.length > 0) return rows;
    }
  } catch (err) {
    console.warn('GID CSV fetch failed, trying sheet name:', err);
  }

  try {
    const namedCsvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=Reimbursements`;
    const namedRes = await fetch(namedCsvUrl, { cache: 'no-store' });
    if (namedRes.ok) {
      const csvText = await namedRes.text();
      return parseCsv(csvText);
    }
  } catch (err) {
    console.error('All Google Sheets fetch methods failed:', err);
  }

  return [];
}

/**
 * Robust case-insensitive matching for Reimbursee names:
 * Handles exact case-insensitive matches, trailing numbers/notes (e.g. "Rachel 6" vs "Rachel"),
 * and delimited lists (e.g. "Nick / Eagle", "Nick, Eagle").
 */
function matchReimbursee(reimburseeCell: string, targetUser: string): boolean {
  const normCell = (reimburseeCell || '').toString().trim().toLowerCase().replace(/\s+/g, ' ');
  const normUser = (targetUser || '').toString().trim().toLowerCase().replace(/\s+/g, ' ');

  if (!normCell || !normUser) return false;
  if (normCell === normUser) return true;

  // Check base name without trailing numbers/identifiers (e.g. "Rachel 6" matching "Rachel")
  const cellBase = normCell.replace(/[\s\d_#\-]+$/, '');
  const userBase = normUser.replace(/[\s\d_#\-]+$/, '');
  if (cellBase && (cellBase === normUser || normCell === userBase || cellBase === userBase)) {
    return true;
  }

  // Check delimited entries (e.g., "Nick, Eagle", "Nick / Eagle", "Nick & Eagle")
  const tokens = normCell.split(/[,/&]+/).map(t => t.trim());
  return tokens.some(t => {
    if (t === normUser) return true;
    const tBase = t.replace(/[\s\d_#\-]+$/, '');
    return tBase === normUser || (userBase && tBase === userBase);
  });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userName = searchParams.get('user');

    if (!userName || typeof userName !== 'string') {
      return NextResponse.json({ error: 'User name is required' }, { status: 400 });
    }

    const sheetId = process.env.GOOGLE_SHEET_ID || DEFAULT_SHEET_ID;
    const rows = await fetchSheetRows(sheetId);

    if (!rows || rows.length === 0) {
      return NextResponse.json({ reimbursements: [] });
    }

    const dataRows = rows.slice(1);
    const normalizedUser = userName.trim().toLowerCase().replace(/\s+/g, ' ');

    // Filter rows where Column E (Index 4: Sent) is TRUE and Column C (Index 2: Reimbursee) matches current user
    const processedReimbursements = dataRows.filter(row => {
      if (!row || row.length === 0) return false;

      // Check Column E (Index 4) for "Sent" / "TRUE" / "x" / "CHECKED" / "YES"
      const sentVal = (row[4] || '').toString().trim().toUpperCase();
      const isSent = sentVal === 'TRUE' || sentVal === 'SENT' || sentVal === 'X' || sentVal === 'CHECKED' || sentVal === 'YES';

      if (!isSent) return false;

      // Check Column C (Index 2: Reimbursee) specifically (case-insensitive)
      const reimbursee = (row[2] || '').toString().trim();
      return matchReimbursee(reimbursee, normalizedUser);
    }).map((row, idx) => {
      const startDate = (row[0] || '').toString().trim();
      const endDate = (row[1] || '').toString().trim();
      const name = (row[2] || userName).toString().trim();
      const rawAmount = (row[3] || '').toString().trim();
      const reimbursedBy = (row[5] || '').toString().trim();

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
        reimbursedBy: reimbursedBy || undefined,
        rawRow: row,
      };
    });

    return NextResponse.json({ reimbursements: processedReimbursements });
  } catch (error) {
    console.error('Error fetching Google Sheets reimbursements:', error);
    return NextResponse.json({ reimbursements: [], error: 'Failed to fetch Google Sheets reimbursements' });
  }
}
