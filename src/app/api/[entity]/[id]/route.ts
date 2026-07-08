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
  'audit-logs': schema.auditLogs,
  'stewardship-settings': schema.stewardshipSettings,
  'documents': schema.documents,
};

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
