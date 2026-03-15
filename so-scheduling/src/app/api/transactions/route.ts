import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import { isAuthenticated, unauthorizedResponse } from '@/lib/auth';

export async function GET(req: Request) {
  if (!(await isAuthenticated(req))) return unauthorizedResponse();
  try {
    await dbConnect();
    const transactions = await Transaction.find({}).sort({ date: -1 });
    return NextResponse.json(transactions);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!(await isAuthenticated(req))) return unauthorizedResponse();

  try {
    await dbConnect();
    const body = await req.json();

    if (body.eventId) {
      const Event = (await import('@/models/Event')).default;
      const event = await Event.findById(body.eventId);
      if (event && event.linkedId) {
        body.eventId = event.linkedId;
      }
    }

    const newTransaction = await Transaction.create(body);
    return NextResponse.json(newTransaction, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
