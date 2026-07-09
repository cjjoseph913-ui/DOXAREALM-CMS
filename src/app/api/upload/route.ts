import { NextResponse } from 'next/server';
import { db } from '@/db';
import { documents } from '@/db/schema';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const description = formData.get('description') as string || '';
    const category = formData.get('category') as string || 'General';
    const uploadedBy = formData.get('uploadedBy') as string || '';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${file.type || 'application/octet-stream'};base64,${base64}`;

    const result = await db.insert(documents).values({
      name: file.name,
      size: file.size,
      type: file.type || 'application/octet-stream',
      url: dataUrl,
      fileData: base64,
      description,
      category,
      uploadedBy,
      uploadedAt: new Date()
    }).returning() as any[];

    return NextResponse.json(result[0]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
