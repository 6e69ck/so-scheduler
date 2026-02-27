import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Invoice from '@/models/Invoice';
import Event from '@/models/Event';
import crypto from 'crypto';

function generateShortHash() {
  return crypto.randomBytes(3).toString('hex').slice(0, 5).toUpperCase();
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { eventId, type, customLineItems, customTotal } = body;

    const event = await Event.findById(eventId);
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

    const hash = crypto.randomBytes(16).toString('hex');
    
    // Generate unique shortHash
    let shortHash = generateShortHash();
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      const existing = await Invoice.findOne({ shortHash });
      if (!existing) {
        isUnique = true;
      } else {
        shortHash = generateShortHash();
        attempts++;
      }
    }

    const invoice = await Invoice.create({
      hash,
      shortHash,
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
