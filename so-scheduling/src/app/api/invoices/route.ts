import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Invoice from '@/models/Invoice';
import Event from '@/models/Event';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { eventId, type, customLineItems, customTotal } = body;

    const event = await Event.findById(eventId);
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

    const hash = crypto.randomBytes(16).toString('hex');
    
    const invoice = await Invoice.create({
      hash,
      eventId,
      type,
      snapshot: event.toObject(),
      customLineItems,
      customTotal
    });

    return NextResponse.json(invoice);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const hash = searchParams.get('hash');
    
    if (hash) {
      const invoice = await Invoice.findOne({ hash });
      return NextResponse.json(invoice);
    }

    const invoices = await Invoice.find({}).sort({ createdAt: -1 });
    return NextResponse.json(invoices);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
