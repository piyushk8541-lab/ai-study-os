import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Please log in.' }, { status: 401 });

  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('revision_schedule')
    .select('id, subject, topic, source_type, source_id, scheduled_for, interval_days, repetition_count, status, last_reviewed_at')
    .eq('user_id', user.id)
    .eq('status', 'scheduled')
    .order('scheduled_for', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const items = data ?? [];
  return NextResponse.json({
    items,
    due: items.filter((x) => x.scheduled_for <= today),
    upcoming: items.filter((x) => x.scheduled_for > today),
  });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Please log in.' }, { status: 401 });

  const body = await request.json();
  const id = String(body.id ?? '');
  const rating = Number(body.rating);
  if (!id || ![1, 2, 3, 4, 5].includes(rating)) return NextResponse.json({ error: 'Invalid revision rating.' }, { status: 400 });

  const { data: item, error: readError } = await supabase.from('revision_schedule').select('*').eq('id', id).eq('user_id', user.id).maybeSingle();
  if (readError || !item) return NextResponse.json({ error: 'Revision item not found.' }, { status: 404 });

  const current = Number(item.interval_days ?? 1);
  const repetition = Number(item.repetition_count ?? 0);
  let nextInterval = rating <= 2 ? 1 : rating === 3 ? Math.max(2, Math.round(current * 1.5)) : Math.max(3, Math.round(current * (rating === 5 ? 2.5 : 2)));
  nextInterval = Math.min(nextInterval, 180);
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + nextInterval);

  const { data: updated, error } = await supabase.from('revision_schedule').update({
    scheduled_for: nextDate.toISOString().slice(0, 10),
    interval_days: nextInterval,
    repetition_count: repetition + 1,
    status: 'scheduled',
    last_reviewed_at: new Date().toISOString(),
  }).eq('id', id).eq('user_id', user.id).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: updated });
}
