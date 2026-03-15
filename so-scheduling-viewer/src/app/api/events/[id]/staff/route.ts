import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import moment from 'moment';
import Event from '@/models/Event';
import Misc from '@/models/Misc';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { name } = await req.json();
    const { id } = await params;

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const normalizedName = name.trim().toLowerCase();

    // Check allowed team members from DB settings
    const allowedTMDoc = await Misc.findOne({ _id: 'allowedTeamMembers' });
    if (allowedTMDoc && allowedTMDoc.value && Array.isArray(allowedTMDoc.value) && allowedTMDoc.value.length > 0) {
      const allowedList = allowedTMDoc.value.map((n: string) => n.trim().toLowerCase());
      if (!allowedList.includes(normalizedName)) {
        return NextResponse.json({ error: 'You are not in the allowed team members list' }, { status: 403 });
      }
    }

    const event = await Event.findById(id);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (moment.utc(event.date).startOf('day').isBefore(moment.utc().startOf('day'))) {
      return NextResponse.json({ error: 'Cannot modify a past show' }, { status: 403 });
    }

    // Add name if not already present
    if (!event.staff.includes(normalizedName)) {
      event.staff.push(normalizedName);
      await event.save();
    } else {
      return NextResponse.json({ error: 'Name already added to this show' }, { status: 400 });
    }

    return NextResponse.json(event);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
