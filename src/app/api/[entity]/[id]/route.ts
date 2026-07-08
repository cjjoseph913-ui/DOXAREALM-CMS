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

function parseDates(body: any) {
  for (const key of Object.keys(body)) {
    if (key.toLowerCase().includes('date') || key === 'timestamp' || key === 'registeredAt' || key === 'uploadedAt') {
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

export async function PUT(request: Request, { params }: { params: Promise<{ entity: string, id: string }> }) {
  try {
    const p = await params;
    const entityName = p.entity;
    const id = p.id;
    if (!entityMap[entityName] || !id) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    let body = await request.json();
    const table = entityMap[entityName];
    body = parseDates(body);
    const updated = await db.update(table).set(body).where(eq(table.id, parseInt(id, 10))).returning() as any[];
    return NextResponse.json(updated[0] || { success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ entity: string, id: string }> }) {
  return PUT(request, { params } as any);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ entity: string, id: string }> }) {
  try {
    const p = await params;
    const entityName = p.entity;
    const id = p.id;
    
    if (!entityMap[entityName] || !id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    
    const table = entityMap[entityName];
    await db.delete(table).where(eq(table.id, parseInt(id, 10)));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
