import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { password } = await req.json();
    const correctPassword = process.env.ADMIN_PASSWORD || 'Eagle123!';

    if (password === correctPassword) {
      // In a real app, you'd return a JWT or session token.
      // For this simple case, we just return success.
      return NextResponse.json({ success: true, token: 'authenticated_session_v1' });
    } else {
      return NextResponse.json({ success: false, error: 'Invalid password' }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
