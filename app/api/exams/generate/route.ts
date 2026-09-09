import { NextResponse } from 'next/server';
import { z } from 'zod';
import { askStudyAI } from '@/lib/ai';
import { consumeUsage, getAuthenticatedUser } from '@/lib/usage';

const schema = z.object({
  title: z.string().trim().min(2).max(120),
  subject: z.string().trim().min(1).max(80),
  topic: z.string().trim().max(120).optional(),
  examType: z.enum(['mcq', 'numerical', 'subjective', 'assertion_reason', 'pyq_style', 'full_mock']),
  difficulty: z.enum(['easy', 'medium', 'hard', 'mixed']).default('mixed'),
  questionCount: z.number().int().min(1).max(30),
  durationMinutes: z.number().int().min(1).max(180).default(30),
});

function cleanJson(text: string) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  return fenced ? fenced[1] : text.trim();
}

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Invalid exam settings.' }, { status: 400 });

    const auth = await getAuthenticatedUser();
    if (!auth.user) return NextResponse.json({ error: 'Please log in to create an exam.' }, { status: 401 });

    const advanced = ['assertion_reason', 'pyq_style', 'full_mock'].includes(parsed.data.examType);
    if (advanced && !auth.plan.includes('pro') && auth.plan !== 'premium') {
      return NextResponse.json({ error: 'Advanced mocks are available on Pro and Premium plans.' }, { status: 403 });
    }

    const usage = await consumeUsage('question');
    if (!usage.allowed) return NextResponse.json({ error: `Daily AI question limit reached for your ${usage.plan} plan.`, remaining: usage.remaining }, { status: 429 });

    const { data: exam, error: examError } = await auth.supabase.from('exams').insert({
      user_id: auth.user.id,
      title: parsed.data.title,
      subject: parsed.data.subject,
      topic: parsed.data.topic || null,
      exam_type: parsed.data.examType,
      difficulty: parsed.data.difficulty,
      question_count: parsed.data.questionCount,
      duration_minutes: parsed.data.durationMinutes,
      advanced,
    }).select('id').single();
    if (examError || !exam) throw examError ?? new Error('Could not create exam.');

    const prompt = `Create exactly ${parsed.data.questionCount} ${parsed.data.examType} questions for ${parsed.data.subject}${parsed.data.topic ? `, topic: ${parsed.data.topic}` : ''}. Difficulty: ${parsed.data.difficulty}. Make them suitable for Indian school/JEE-style exam preparation. Return ONLY valid JSON with this shape: {"questions":[{"question":"...","options":["A","B","C","D"],"correctAnswer":"...","explanation":"...","marks":1}]}. For numerical or subjective questions, options may be []. correctAnswer must be concise and unambiguous. Do not include markdown.`;
    const result = await askStudyAI({ question: prompt, language: 'hinglish', task: advanced ? 'strong' : 'standard' });
    const parsedJson = JSON.parse(cleanJson(result.text)) as { questions?: Array<{ question?: string; options?: string[]; correctAnswer?: string; explanation?: string; marks?: number }> };
    const questions = parsedJson.questions ?? [];
    if (questions.length !== parsed.data.questionCount) throw new Error('AI returned an invalid question set.');

    const rows = questions.map((q, index) => ({
      exam_id: exam.id,
      position: index + 1,
      question_type: parsed.data.examType,
      question: String(q.question ?? ''),
      options: q.options ?? [],
      correct_answer: String(q.correctAnswer ?? ''),
      explanation: String(q.explanation ?? ''),
      marks: Number(q.marks ?? 1),
    }));
    const { error: questionError } = await auth.supabase.from('exam_questions').insert(rows);
    if (questionError) throw questionError;

    await auth.supabase.from('usage_events').insert({ user_id: auth.user.id, feature: 'exam_generation', model: process.env.AI_MODEL_STANDARD || 'gpt-5.6-terra', units: parsed.data.questionCount });
    return NextResponse.json({ examId: exam.id, questions: rows.map(({ correct_answer, ...q }) => ({ ...q, correctAnswer: correct_answer })) });
  } catch (error) {
    console.error('Exam generation error', error);
    return NextResponse.json({ error: 'Exam generation failed. Please try again.' }, { status: 500 });
  }
}
