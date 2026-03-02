import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Event from '@/models/Event';
import Counter from '@/models/Counter';
import { isAuthenticated, unauthorizedResponse } from '@/lib/auth';

export async function GET(req: Request) {
  if (!(await isAuthenticated(req))) return unauthorizedResponse();
  try {
    await dbConnect();
    const events = await Event.find({}).sort({ date: 1, startTime: 1 });
    return NextResponse.json(events);
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch events: ' + error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!(await isAuthenticated(req))) return unauthorizedResponse();

  try {
    await dbConnect();
    const body = await req.json();
    
    // Auto-increment eventNumber
    const counter = await Counter.findByIdAndUpdate(
      { _id: 'eventNumber' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    body.eventNumber = counter.seq;
    
    const newEvent = await Event.create(body);
    return NextResponse.json(newEvent, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
