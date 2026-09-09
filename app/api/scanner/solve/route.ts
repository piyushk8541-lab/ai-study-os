import { NextResponse } from 'next/server';
import { z } from 'zod';
import { askStudyAI } from '../../../../lib/ai';
import { consumeUsage } from '../../../../lib/usage';

const schema = z.object({
  question: z.string().trim().min(1).max(16000),
  language: z.enum(['english', 'hindi', 'hinglish']).optional(),
});

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: 'AI is not configured yet.' }, { status: 503 });

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Please provide the extracted question text.' }, { status: 400 });

    const usage = await consumeUsage('scan');
    if (!usage.user) return NextResponse.json({ error: 'Please log in to use AI Scanner.' }, { status: 401 });
    if (!usage.allowed) {
      return NextResponse.json({ error: `${usage.periodType === 'daily' ? 'Daily' : 'Monthly'} scan limit reached for your ${usage.plan} plan.`, plan: usage.plan, used: usage.used, limit: usage.limit, remaining: usage.remaining }, { status: 429 });
    }

    const result = await askStudyAI({
      question: `Solve this scanned/typed student question step-by-step. Identify the given data, required result, formula or concept, calculations, and final answer. Question:\n${parsed.data.question}`,
      language: parsed.data.language,
      task: 'standard',
    });

    await usage.supabase.from('usage_events').insert({
      user_id: usage.user.id,
      feature: 'scanner',
      model: process.env.AI_MODEL_STANDARD || 'gpt-5.6-terra',
      units: 1,
    });

    return NextResponse.json({ answer: result.text, usage: { used: usage.used, limit: usage.limit, remaining: usage.remaining } });
  } catch (error) {
    console.error('Scanner error', error);
    return NextResponse.json({ error: 'AI Scanner could not solve the question right now.' }, { status: 500 });
  }
}
