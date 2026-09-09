import { NextResponse } from 'next/server';
import { z } from 'zod';
import { askStudyAI } from '@/lib/ai';
import { getAuthenticatedUser } from '@/lib/usage';

const schema = z.object({
  subject: z.string().trim().max(100).optional(),
  targetExam: z.string().trim().max(100).optional(),
});

export async function POST(request: Request) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth.user) return NextResponse.json({ error: 'Please log in to use Personal Coach.' }, { status: 401 });
    const parsed = schema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid coach request.' }, { status: 400 });

    const [{ data: profile }, { data: weaknesses }, { data: attempts }, { data: revisions }] = await Promise.all([
      auth.supabase.from('profiles').select('class_level,target_exam,target_exam_date,preferred_language').eq('id', auth.user.id).maybeSingle(),
      auth.supabase.from('weaknesses').select('subject,topic,weakness_score,accuracy,attempts_count,reason,recommended_action,status').eq('user_id', auth.user.id).order('weakness_score', { ascending: false }).limit(20),
      auth.supabase.from('exam_attempts').select('score,total_marks,accuracy,created_at,exam_id').eq('user_id', auth.user.id).order('created_at', { ascending: false }).limit(20),
      auth.supabase.from('revision_schedule').select('subject,topic,scheduled_for,status').eq('user_id', auth.user.id).order('scheduled_for', { ascending: true }).limit(20),
    ]);

    const context = JSON.stringify({ profile, subject: parsed.data.subject, targetExam: parsed.data.targetExam, weaknesses: weaknesses ?? [], attempts: attempts ?? [], revisions: revisions ?? [] });
    const result = await askStudyAI({
      task: 'standard',
      language: profile?.preferred_language ?? 'hinglish',
      question: `Analyze this student's learning data and return a practical coaching report. Do not invent scores or facts. Data: ${context}\n\nReturn exactly these sections: Overall Performance, Strong Areas, Weak Areas, Why These Are Weak, Next 3 Priorities, Today's Study Target, 7-Day Action Plan, Revision Advice. Keep recommendations specific to the available data.`,
    });

    return NextResponse.json({ analysis: result.text, stats: { attempts: attempts?.length ?? 0, weaknesses: weaknesses?.length ?? 0 } });
  } catch (error) {
    console.error('Coach analyze error', error);
    return NextResponse.json({ error: 'Personal Coach could not analyze your data right now.' }, { status: 500 });
  }
}
