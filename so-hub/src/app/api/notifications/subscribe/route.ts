import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import PushSubscription from '@/models/PushSubscription';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { subscription, userName } = body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json({ error: 'Invalid subscription object' }, { status: 400 });
    }

    await dbConnect();

    const userAgent = request.headers.get('user-agent') || '';

    const saved = await PushSubscription.findOneAndUpdate(
      { endpoint: subscription.endpoint },
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
        userName: (userName || '').trim().toLowerCase(),
        userAgent,
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, id: saved._id });
  } catch (error: any) {
    console.error('Error saving push subscription:', error);
    return NextResponse.json({ error: error.message || 'Failed to save subscription' }, { status: 500 });
  }
}
