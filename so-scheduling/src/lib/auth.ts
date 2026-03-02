import { NextResponse } from 'next/server';
import { jwtVerify, SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret_dont_use_in_prod');

export async function createToken(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);
}

export async function isAuthenticated(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return false;

  try {
    const { payload } = await jwtVerify(authHeader, JWT_SECRET);
    return !!payload;
  } catch (err) {
    return false;
  }
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
