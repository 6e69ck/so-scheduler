import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Misc from '@/models/Misc';
import { isAuthenticated, unauthorizedResponse } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    if (!await isAuthenticated(req)) return unauthorizedResponse();

    await dbConnect();
    
    const adminPasswordDoc = await Misc.findOne({ _id: 'adminPassword' });
    const salesAssociatesDoc = await Misc.findOne({ _id: 'salesAssociates' });
    const allowedTeamMembersDoc = await Misc.findOne({ _id: 'allowedTeamMembers' });

    return NextResponse.json({
      adminPassword: adminPasswordDoc?.value || process.env.ADMIN_PASSWORD || 'Eagle123!',
      salesAssociates: salesAssociatesDoc?.value || (process.env.NEXT_PUBLIC_SALES_ASSOCIATES || '').split(',').map((s: string) => s.trim()).filter(Boolean),
      allowedTeamMembers: allowedTeamMembersDoc?.value || []
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    if (!await isAuthenticated(req)) return unauthorizedResponse();

    await dbConnect();
    const { adminPassword, salesAssociates, allowedTeamMembers } = await req.json();

    if (adminPassword !== undefined) {
      await Misc.findOneAndUpdate(
        { _id: 'adminPassword' },
        { value: adminPassword, type: 'config' },
        { upsert: true }
      );
    }

    if (salesAssociates !== undefined) {
      await Misc.findOneAndUpdate(
        { _id: 'salesAssociates' },
        { value: salesAssociates, type: 'config' },
        { upsert: true }
      );
    }

    if (allowedTeamMembers !== undefined) {
      await Misc.findOneAndUpdate(
        { _id: 'allowedTeamMembers' },
        { value: allowedTeamMembers, type: 'config' },
        { upsert: true }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
