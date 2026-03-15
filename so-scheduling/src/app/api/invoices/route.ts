import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Invoice from '@/models/Invoice';
import Event from '@/models/Event';
import crypto from 'crypto';
import { isAuthenticated, unauthorizedResponse } from '@/lib/auth';

function generateShortHash() {
  return crypto.randomBytes(3).toString('hex').slice(0, 5).toUpperCase();
}

export async function POST(req: Request) {
  if (!(await isAuthenticated(req))) return unauthorizedResponse();

  try {
    await dbConnect();
    const body = await req.json();
    const { eventId, type, customLineItems, customTotal, details } = body;

    let snapshot = {};

    if (eventId) {
      const event = await Event.findById(eventId);
      if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
      snapshot = event.toObject();

      // For linked events, combine all show names
      const parentId = event.linkedId || event._id;
      const linkedEvents = await Event.find({
        $or: [{ _id: parentId }, { linkedId: parentId }]
      }).sort({ date: 1 });
      if (linkedEvents.length > 1) {
        (snapshot as any).show = linkedEvents.map((e: any) => e.show).join(', ');
      }
    } else if (details) {
      // Ad-hoc invoice without an event
      snapshot = {
        ...details,
        eventNumber: 0, // Mark as ad-hoc
      };
    } else {
      return NextResponse.json({ error: 'Missing eventId or details' }, { status: 400 });
    }

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
      eventId: eventId || null,
      type: type || 'custom',
      snapshot,
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

    // List all invoices requires authentication
    if (!(await isAuthenticated(req))) return unauthorizedResponse();

    const invoices = await Invoice.find({}).sort({ createdAt: -1 });
    return NextResponse.json(invoices);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
