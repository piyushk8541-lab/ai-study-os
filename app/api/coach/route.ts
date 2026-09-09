import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/usage';

export async function GET() {
  const auth = await getAuthenticatedUser();
  if (!auth.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [{ data: profile }, { data: weaknesses }, { data: attempts }, { data: revisions }] = await Promise.all([
    auth.supabase.from('profiles').select('class_level,target_exam,target_exam_date,preferred_language').eq('id', auth.user.id).maybeSingle(),
    auth.supabase.from('weaknesses').select('subject,topic,weakness_score,accuracy,attempts_count,reason,recommended_action,status').eq('user_id', auth.user.id).order('weakness_score', { ascending: false }).limit(10),
    auth.supabase.from('exam_attempts').select('score,total_marks,accuracy,created_at').eq('user_id', auth.user.id).order('created_at', { ascending: false }).limit(10),
    auth.supabase.from('revision_schedule').select('subject,topic,scheduled_for,status').eq('user_id', auth.user.id).order('scheduled_for', { ascending: true }).limit(10),
  ]);

  const scores = (attempts ?? []).map((a: { accuracy?: number | null }) => Number(a.accuracy ?? 0)).filter(Number.isFinite);
  const accuracy = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
  const due = (revisions ?? []).filter((r: { scheduled_for: string; status: string }) => r.status === 'scheduled' && r.scheduled_for <= new Date().toISOString().slice(0, 10));

  return NextResponse.json({ profile, plan: auth.plan, stats: { accuracy, attempts: attempts?.length ?? 0, weakTopics: weaknesses?.length ?? 0, dueRevisions: due.length }, weaknesses: weaknesses ?? [], attempts: attempts ?? [], revisions: revisions ?? [] });
}
