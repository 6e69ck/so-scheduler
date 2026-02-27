import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'Terms.md');
    const content = await fs.readFile(filePath, 'utf-8');
    return NextResponse.json({ content });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to read Terms.md' }, { status: 500 });
  }
}
