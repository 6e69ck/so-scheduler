import { NextResponse } from 'next/server';

export function isAuthenticated(req: Request) {
  const authHeader = req.headers.get('Authorization');
  // In this app's simple logic, the token is 'authenticated_session_v1'
  return authHeader === 'authenticated_session_v1';
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
