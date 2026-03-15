import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Event from '@/models/Event';
import { isAuthenticated, unauthorizedResponse } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthenticated(req))) return unauthorizedResponse();
  try {
    await dbConnect();
    const id = (await params).id;
    const event = await Event.findById(id);
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    return NextResponse.json(event);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthenticated(req))) return unauthorizedResponse();

  try {
    await dbConnect();
    const id = (await params).id;
    const body = await req.json();

    // Check if we are linking for the first time
    const existingEvent = await Event.findById(id);
    if (!existingEvent) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

    if (body.linkedId && body.linkedId !== existingEvent.linkedId) {
      // Check for transactions
      const Transaction = (await import('@/models/Transaction')).default;
      const tCount = await Transaction.countDocuments({ eventId: id });
      if (tCount > 0) {
        return NextResponse.json({ error: 'Cannot link show that already has transactions' }, { status: 400 });
      }

      // Inherit parent details if linking
      const parentEvent = await Event.findById(body.linkedId);
      if (parentEvent) {
        body.eventNumber = parentEvent.eventNumber;
        body.clientName = parentEvent.clientName;
        body.companyName = parentEvent.companyName;
        body.clientPhone = parentEvent.clientPhone;
        body.clientEmail = parentEvent.clientEmail;
        body.totalPrice = parentEvent.totalPrice;
        body.salesAssoc = parentEvent.salesAssoc;
      }
    }

    const updatedEvent = await Event.findByIdAndUpdate(id, body, { new: true, runValidators: true });

    if (!updatedEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Cascade updates to all linked shows if shared fields were updated
    const parentId = updatedEvent.linkedId || updatedEvent._id;
    const sharedFields = {
      clientName: updatedEvent.clientName,
      companyName: updatedEvent.companyName,
      clientPhone: updatedEvent.clientPhone,
      clientEmail: updatedEvent.clientEmail,
      totalPrice: updatedEvent.totalPrice,
      salesAssoc: updatedEvent.salesAssoc,
      eventNumber: updatedEvent.eventNumber
    };

    // Update parent and all children
    await Event.updateMany(
      { $or: [{ _id: parentId }, { linkedId: parentId }] },
      { $set: sharedFields }
    );

    return NextResponse.json(updatedEvent);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthenticated(req))) return unauthorizedResponse();

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
