import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '@/lib/usage';

const schema = z.object({
  examId: z.string().uuid(),
  answers: z.array(z.object({ questionId: z.string().uuid(), answer: z.string().max(5000).optional() })).max(100),
  timeTakenSeconds: z.number().int().min(0).max(86400).optional(),
});

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Invalid submission.' }, { status: 400 });
    const auth = await getAuthenticatedUser();
    if (!auth.user) return NextResponse.json({ error: 'Please log in.' }, { status: 401 });

    const { data: exam } = await auth.supabase.from('exams').select('id, subject, topic, user_id').eq('id', parsed.data.examId).eq('user_id', auth.user.id).single();
    if (!exam) return NextResponse.json({ error: 'Exam not found.' }, { status: 404 });
    const { data: questions } = await auth.supabase.from('exam_questions').select('id, correct_answer, marks').eq('exam_id', exam.id).order('position');
    if (!questions?.length) return NextResponse.json({ error: 'No questions found.' }, { status: 400 });

    const answerMap = new Map(parsed.data.answers.map(a => [a.questionId, (a.answer ?? '').trim()]));
    let score = 0;
    let totalMarks = 0;
    let correctCount = 0;
    let attemptedCount = 0;
    const answerRows: Array<{ question_id: string; answer: string; is_correct: boolean; marks_awarded: number }> = [];

    for (const q of questions) {
      const answer = answerMap.get(q.id) ?? '';
      const isCorrect = answer.length > 0 && answer.toLowerCase() === String(q.correct_answer).trim().toLowerCase();
      const marks = Number(q.marks ?? 1);
      totalMarks += marks;
      if (answer) attemptedCount++;
      if (isCorrect) { correctCount++; score += marks; }
      answerRows.push({ question_id: q.id, answer, is_correct: isCorrect, marks_awarded: isCorrect ? marks : 0 });
    }

    const accuracy = attemptedCount ? (correctCount / attemptedCount) * 100 : 0;
    const { data: attempt, error: attemptError } = await auth.supabase.from('exam_attempts').insert({ exam_id: exam.id, user_id: auth.user.id, score, total_marks: totalMarks, accuracy, correct_count: correctCount, attempted_count: attemptedCount, time_taken_seconds: parsed.data.timeTakenSeconds ?? null }).select('id').single();
    if (attemptError || !attempt) throw attemptError ?? new Error('Could not save attempt.');

    const rows = answerRows.map(r => ({ ...r, attempt_id: attempt.id }));
    const { error: answersError } = await auth.supabase.from('exam_answers').insert(rows);
    if (answersError) throw answersError;

    const topic = exam.topic || exam.subject;
    const weaknessScore = Math.max(0, Math.min(100, 100 - accuracy));
    const status = accuracy >= 80 ? 'improving' : 'active';
    const { data: existing } = await auth.supabase.from('weaknesses').select('id, attempts_count').eq('user_id', auth.user.id).eq('subject', exam.subject).eq('topic', topic).maybeSingle();
    if (existing) {
      await auth.supabase.from('weaknesses').update({ weakness_score: weaknessScore, accuracy, attempts_count: Number(existing.attempts_count ?? 0) + 1, status, reason: `Exam accuracy: ${accuracy.toFixed(1)}%`, recommended_action: accuracy < 60 ? 'Revise concepts and solve easy questions first.' : accuracy < 80 ? 'Practice mixed questions and review mistakes.' : 'Maintain with spaced revision and harder questions.', last_analyzed_at: new Date().toISOString() }).eq('id', existing.id).eq('user_id', auth.user.id);
    } else {
      await auth.supabase.from('weaknesses').insert({ user_id: auth.user.id, subject: exam.subject, topic, weakness_score: weaknessScore, accuracy, attempts_count: 1, status, reason: `Exam accuracy: ${accuracy.toFixed(1)}%`, recommended_action: accuracy < 60 ? 'Revise concepts and solve easy questions first.' : accuracy < 80 ? 'Practice mixed questions and review mistakes.' : 'Maintain with spaced revision and harder questions.', last_analyzed_at: new Date().toISOString() });
    }

    const interval = accuracy < 60 ? 1 : accuracy < 80 ? 3 : 7;
    const scheduled = new Date(); scheduled.setDate(scheduled.getDate() + interval);
    await auth.supabase.from('revision_schedule').insert({ user_id: auth.user.id, subject: exam.subject, topic, source_type: 'exam', source_id: exam.id, scheduled_for: scheduled.toISOString().slice(0, 10), interval_days: interval, repetition_count: 0, status: 'scheduled' });

    return NextResponse.json({ attemptId: attempt.id, score, totalMarks, accuracy: Number(accuracy.toFixed(2)), correctCount, attemptedCount });
  } catch (error) {
    console.error('Exam submit error', error);
    return NextResponse.json({ error: 'Could not submit exam.' }, { status: 500 });
  }
}
