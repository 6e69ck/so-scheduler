import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import PushSubscription from '@/models/PushSubscription';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint is required' }, { status: 400 });
    }

    await dbConnect();
    await PushSubscription.deleteOne({ endpoint });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error removing push subscription:', error);
    return NextResponse.json({ error: error.message || 'Failed to remove subscription' }, { status: 500 });
  }
}
