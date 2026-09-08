import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Event from '@/models/Event';
import PushSubscription from '@/models/PushSubscription';
import webpush from '@/lib/push';
import moment from 'moment';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await dbConnect();

    const event = await Event.findById(id);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Mark event as published
    event.isPublished = true;
    event.publishedAt = new Date();
    await event.save();

    // Fetch all active push subscriptions
    const subscriptions = await PushSubscription.find({});

    const formattedDate = moment.utc(event.date).format('ddd, MMM D, YYYY');
    const payload = JSON.stringify({
      title: `🥋 New Show: ${event.show}`,
      body: `${formattedDate} @ ${event.startTime} | Needs ${event.neededPeople || 'Performers'} | ${event.location || 'Venue TBA'}`,
      icon: '/logo.jpg',
      url: '/?tab=open',
      eventId: event._id.toString(),
      tag: `show-${event._id.toString()}`,
    });

    let sentCount = 0;
    const expiredEndpoints: string[] = [];

    // Send push notification to all subscribers in parallel
    await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          const pushConfig = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.keys.p256dh,
              auth: sub.keys.auth,
            },
          };
          await webpush.sendNotification(pushConfig, payload);
          sentCount++;
        } catch (err: any) {
          // If subscription has expired or unsubscribed, queue for removal
          if (err.statusCode === 404 || err.statusCode === 410) {
            expiredEndpoints.push(sub.endpoint);
          } else {
            console.error(`Error sending push to ${sub.userName} (${sub.endpoint}):`, err.message);
          }
        }
      })
    );

    // Clean up dead/expired endpoints from database
    if (expiredEndpoints.length > 0) {
      await PushSubscription.deleteMany({ endpoint: { $in: expiredEndpoints } });
    }

    return NextResponse.json({
      success: true,
      sentCount,
      totalSubscribers: subscriptions.length,
      publishedAt: event.publishedAt,
    });
  } catch (error: any) {
    console.error('Error publishing event and sending notifications:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to publish event' },
      { status: 500 }
    );
  }
}
