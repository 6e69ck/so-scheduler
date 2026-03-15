import { NextResponse } from 'next/server';
import { createToken } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Misc from '@/models/Misc';

export async function POST(req: Request) {
  try {
    const { password } = await req.json();
    await dbConnect();
    
    const adminPasswordDoc = await Misc.findOne({ _id: 'adminPassword' });
    const correctPassword = adminPasswordDoc?.value || process.env.ADMIN_PASSWORD || 'Eagle123!';

    if (password === correctPassword) {
      const token = await createToken({ role: 'admin' });
      return NextResponse.json({ success: true, token });
    } else {
      return NextResponse.json({ success: false, error: 'Invalid password' }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
