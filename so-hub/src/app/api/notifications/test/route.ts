import { NextResponse } from 'next/server';
import webpush from '@/lib/push';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { subscription } = body;

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: 'Subscription is required' }, { status: 400 });
    }

    const payload = JSON.stringify({
      title: 'Soaring Eagles Hub',
      body: '🎉 Push notifications are working! You will now receive alerts whenever a new show is published.',
      icon: '/logo.jpg',
      url: '/?tab=open',
      tag: 'test-notification',
    });

    await webpush.sendNotification(subscription, payload);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error sending test notification:', error);
    return NextResponse.json({ error: error.message || 'Failed to send test notification' }, { status: 500 });
  }
}
