import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Transaction from '@/models/Transaction';

export async function GET(req: Request) {
  try {
    await dbConnect();
    const transactions = await Transaction.find({}).sort({ date: -1 });
    return NextResponse.json(transactions);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const newTransaction = await Transaction.create(body);
    return NextResponse.json(newTransaction, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
