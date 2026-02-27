import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Event from '@/models/Event';
import { isAuthenticated, unauthorizedResponse } from '@/lib/auth';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthenticated(req)) return unauthorizedResponse();

  try {
    await dbConnect();
    const id = (await params).id;
    const body = await req.json();
    const updatedEvent = await Event.findByIdAndUpdate(id, body, { new: true, runValidators: true });
    
    if (!updatedEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    
    return NextResponse.json(updatedEvent);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthenticated(req)) return unauthorizedResponse();

  try {
    await dbConnect();
    const id = (await params).id;
    const deletedEvent = await Event.findByIdAndDelete(id);
    
    if (!deletedEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 400 });
  }
}
