import { NextResponse } from 'next/server';
import { db } from '@/db';
import * as schema from '@/db/schema';

export async function POST() {
  try {
    await db.insert(schema.zones).values([
      { name: 'North Zone' },
      { name: 'East Zone' },
      { name: 'Downtown' }
    ]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
