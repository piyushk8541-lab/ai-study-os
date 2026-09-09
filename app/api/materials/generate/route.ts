import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '@/lib/usage';
import { askStudyAI } from '@/lib/ai';

export const runtime = 'nodejs';

const schema = z.object({ uploadId: z.string().uuid() });

export async function POST(request: Request) {
  const auth = await getAuthenticatedUser();
  if (!auth.user) return NextResponse.json({ error: 'Please log in first.' }, { status: 401 });
  const body = schema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: 'Invalid material id.' }, { status: 400 });

  const { data: upload, error: uploadError } = await auth.supabase.from('uploads').select('id,file_name,extracted_text,processing_status').eq('id', body.data.uploadId).eq('user_id', auth.user.id).single();
  if (uploadError || !upload) return NextResponse.json({ error: 'Material not found.' }, { status: 404 });
  if (!upload.extracted_text) return NextResponse.json({ error: 'This material has no readable text.' }, { status: 422 });

  const source = String(upload.extracted_text).slice(0, 60000);
  const { data: job, error: jobError } = await auth.supabase.from('ai_jobs').insert({ user_id: auth.user.id, job_type: 'study_material_generation', status: 'processing', input: { upload_id: upload.id, file_name: upload.file_name } }).select('id').single();
  if (jobError || !job) return NextResponse.json({ error: 'Could not create generation job.' }, { status: 500 });

  await auth.supabase.from('uploads').update({ processing_status: 'processing', processing_error: null }).eq('id', upload.id).eq('user_id', auth.user.id);

  try {
    const result = await askStudyAI({
      task: 'standard',
      language: 'hinglish',
      question: `Create complete exam-ready study material from the following source. Do not invent facts that are not supported by the source. Preserve formulas accurately.\n\nReturn exactly these sections:\n1. QUICK SUMMARY\n2. CONCEPTS EXPLAINED\n3. IMPORTANT FORMULAS\n4. KEY DEFINITIONS\n5. COMMON MISTAKES\n6. 10 MCQs with answers\n7. 5 NUMERICAL/PRACTICE QUESTIONS\n8. REVISION POINTS\n9. 7-DAY REVISION PLAN\n\nSOURCE:\n${source}`,
    });

    await auth.supabase.from('ai_jobs').update({ status: 'completed', result: { material: result.text }, completed_at: new Date().toISOString() }).eq('id', job.id).eq('user_id', auth.user.id);
    await auth.supabase.from('uploads').update({ processing_status: 'completed' }).eq('id', upload.id).eq('user_id', auth.user.id);
    return NextResponse.json({ jobId: job.id, material: result.text });
  } catch (error) {
    console.error('Material generation failed', error);
    await auth.supabase.from('ai_jobs').update({ status: 'failed', error: 'Generation failed' }).eq('id', job.id).eq('user_id', auth.user.id);
    await auth.supabase.from('uploads').update({ processing_status: 'failed', processing_error: 'AI generation failed' }).eq('id', upload.id).eq('user_id', auth.user.id);
    return NextResponse.json({ error: 'AI generation failed. Please try again.' }, { status: 500 });
  }
}
