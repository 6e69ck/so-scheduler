import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import moment from 'moment';
import Event from '@/models/Event';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { name } = await req.json();
    const { id } = await params;

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const event = await Event.findById(id);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (moment.utc(event.date).startOf('day').isBefore(moment.utc().startOf('day'))) {
      return NextResponse.json({ error: 'Cannot modify a past show' }, { status: 403 });
    }

    // Add name if not already present
    if (!event.staff.includes(name.trim())) {
      event.staff.push(name.trim());
      await event.save();
    } else {
      return NextResponse.json({ error: 'Name already added to this show' }, { status: 400 });
    }

    return NextResponse.json(event);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
