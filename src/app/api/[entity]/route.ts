import { NextResponse } from 'next/server';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq } from 'drizzle-orm';

const entityMap: Record<string, any> = {
  'members': schema.members,
  'visitors': schema.visitors,
  'converts': schema.converts,
  'churches': schema.churches,
  'zones': schema.zones,
  'cell-groups': schema.cellGroups,
  'attendance-logs': schema.attendanceLogs,
  'sunday-ledgers': schema.attendanceLogs,
  'communication-logs': schema.communicationLogs,
  'region-notices': schema.regionNotices,
  'audit-logs': schema.auditLogs,
  'stewardship-settings': schema.stewardshipSettings,
  'documents': schema.documents,
};

const dateFields = ['date','timestamp','createdAt','uploadedAt','waterBaptismDate','holySpiritBaptismDate','conversionDate','membershipDate','establishmentDate'];

function parseDates(body: any) {
  for (const key of Object.keys(body)) {
    if (dateFields.includes(key) || key.toLowerCase().includes('date') || key.toLowerCase().includes('timestamp')) {
      const val = body[key];
      if (typeof val === 'string' && val) {
        const d = new Date(val);
        if (!isNaN(d.getTime())) body[key] = d;
      }
      if (val === '' || val === undefined) body[key] = null;
    }
  }
  return body;
}

export async function GET(request: Request, { params }: { params: Promise<{ entity: string }> }) {
  try {
    const p = await params;
    const entityName = p.entity;
    if (!entityMap[entityName]) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const table = entityMap[entityName];
    if (entityName === 'stewardship-settings') {
      const data = await db.select().from(table).limit(1);
      return NextResponse.json(data[0] || null);
    }
    const data = await db.select().from(table);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ entity: string }> }) {
  try {
    const p = await params;
    const entityName = p.entity;
    if (!entityMap[entityName]) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    let body = await request.json();
    const table = entityMap[entityName];
    if (entityName === 'stewardship-settings') {
      const existing = await db.select().from(table).limit(1);
      if (existing.length > 0) {
        const updated = await db.update(table).set({ ...body, updatedAt: new Date() }).where(eq(table.id, existing[0].id)).returning();
        return NextResponse.json((updated as any[])[0]);
      }
    }
    body = parseDates(body);
    const data = await db.insert(table).values(body).returning() as any[];
    return NextResponse.json(data[0]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
