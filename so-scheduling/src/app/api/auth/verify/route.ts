import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';

export async function GET(req: Request) {
  if (await isAuthenticated(req)) {
    return NextResponse.json({ valid: true });
  }
  return NextResponse.json({ valid: false }, { status: 401 });
}
