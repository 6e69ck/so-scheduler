import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Event from '@/models/Event';
import Invoice from '@/models/Invoice';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { eventId, type } = await req.json();

    if (!eventId || !type) {
      return NextResponse.json({ error: 'Missing eventId or type' }, { status: 400 });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Generate a unique hash
    const hash = crypto.randomBytes(16).toString('hex');

    const newInvoice = await Invoice.create({
      hash,
      eventId,
      type,
      snapshot: event.toObject(),
    });

    return NextResponse.json({ hash: newInvoice.hash }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');
    const type = searchParams.get('type');

    if (!eventId || !type) {
      return NextResponse.json({ error: 'Missing eventId or type' }, { status: 400 });
    }

    // Find the most recent invoice for this event and type
    const invoice = await Invoice.findOne({ eventId, type }).sort({ createdAt: -1 });
    
    if (!invoice) {
      return NextResponse.json({ hash: null });
    }

    return NextResponse.json({ hash: invoice.hash });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
