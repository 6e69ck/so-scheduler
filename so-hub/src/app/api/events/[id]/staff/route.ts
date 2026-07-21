import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Event from '@/models/Event';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { name } = await request.json();

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    await dbConnect();
    const event = await Event.findById(id);

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const normalizedName = name.trim().toLowerCase();
    
    if (event.staff.some(s => s.trim().toLowerCase() === normalizedName)) {
      return NextResponse.json({ error: 'Staff member already added' }, { status: 400 });
    }

    event.staff.push(normalizedName);
    await event.save();

    return NextResponse.json(event);
  } catch (error) {
    console.error('Error adding staff:', error);
    return NextResponse.json({ error: 'Failed to add staff' }, { status: 500 });
  }
}
