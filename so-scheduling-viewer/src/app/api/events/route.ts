import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Event from '@/models/Event';

export async function GET() {
  try {
    await dbConnect();
    // Fetch all events sorted by date
    const events = await Event.find({}).sort({ date: 1, startTime: 1 });
    return NextResponse.json(events);
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch events: ' + error.message }, { status: 500 });
  }
}
