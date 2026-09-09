import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser, consumeUsage } from '@/lib/usage';
import { uploadStudyMaterial } from '@/lib/storage';
import { PLAN_LIMITS } from '@/lib/plan';

export const runtime = 'nodejs';
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const allowedTypes = new Set(['application/pdf', 'text/plain']);
const nameSchema = z.string().trim().min(1).max(200);

async function extractPdfText(file: File) {
  const { PDFParse } = await import('pdf-parse');
  const buffer = Buffer.from(await file.arrayBuffer());
  const parser = new PDFParse({ data: buffer });
  try {
    const parsed = await parser.getText();
    return { text: parsed.text?.trim() ?? '', pages: Number(parsed.total ?? 0) };
  } finally {
    await parser.destroy();
  }
}

export async function POST(request: Request) {
  const auth = await getAuthenticatedUser();
  if (!auth.user) return NextResponse.json({ error: 'Please log in first.' }, { status: 401 });
  const form = await request.formData();
  const rawFile = form.get('file');
  if (!(rawFile instanceof File)) return NextResponse.json({ error: 'Choose a file.' }, { status: 400 });
  if (!allowedTypes.has(rawFile.type)) return NextResponse.json({ error: 'For Study Material, upload a PDF or TXT file. Use AI Scanner for images.' }, { status: 400 });
  if (rawFile.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'Maximum file size is 50 MB.' }, { status: 400 });
  const title = nameSchema.safeParse(String(form.get('title') ?? rawFile.name));
  if (!title.success) return NextResponse.json({ error: 'Invalid title.' }, { status: 400 });

  let extractedText = '';
  let pageCount = 1;
  try {
    if (rawFile.type === 'application/pdf') {
      const parsed = await extractPdfText(rawFile);
      extractedText = parsed.text;
      pageCount = parsed.pages;
      if (pageCount > PLAN_LIMITS[auth.plan].maxPdfPages) return NextResponse.json({ error: `This file exceeds your ${PLAN_LIMITS[auth.plan].maxPdfPages}-page limit.` }, { status: 403 });
    } else {
      extractedText = (await rawFile.text()).trim();
      if (!extractedText) return NextResponse.json({ error: 'The text file is empty.' }, { status: 422 });
    }
  } catch (error) {
    console.error('Material extraction failed', error);
    return NextResponse.json({ error: 'Could not read this file. Try a normal text PDF.' }, { status: 422 });
  }

  const quota = await consumeUsage('pdf');
  if (!quota.allowed) return NextResponse.json({ error: `PDF limit reached (${quota.used}/${quota.limit}) for your ${auth.plan} plan.` }, { status: 429 });

  let storagePath = '';
  try {
    storagePath = await uploadStudyMaterial(auth.user.id, rawFile);
    const { data: upload, error } = await auth.supabase.from('uploads').insert({ user_id: auth.user.id, file_name: rawFile.name, mime_type: rawFile.type, storage_key: storagePath, file_size_bytes: rawFile.size, page_count: pageCount, processing_status: 'completed', extracted_text: extractedText }).select('id,file_name,mime_type,file_size_bytes,page_count,processing_status,created_at').single();
    if (error) throw error;
    return NextResponse.json({ upload, extracted: true, usage: quota });
  } catch (error) {
    console.error('Material upload failed', error);
    if (storagePath) await auth.supabase.storage.from('study-materials').remove([storagePath]);
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 });
  }
}
