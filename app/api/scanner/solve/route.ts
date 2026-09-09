import { NextResponse } from 'next/server';
import { z } from 'zod';
import { askStudyAI } from '../../../../lib/ai';

const schema = z.object({
  question: z.string().trim().min(1).max(16000),
  language: z.enum(['english', 'hindi', 'hinglish']).optional(),
});

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'AI is not configured yet.' }, { status: 503 });
    }

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Please provide the extracted question text.' }, { status: 400 });
    }

    const result = await askStudyAI({
      question: `Solve this scanned/typed student question step-by-step. Identify the given data, required result, formula or concept, calculations, and final answer. Question:\n${parsed.data.question}`,
      language: parsed.data.language,
      task: 'standard',
    });

    return NextResponse.json({ answer: result.text });
  } catch (error) {
    console.error('Scanner error', error);
    return NextResponse.json({ error: 'AI Scanner could not solve the question right now.' }, { status: 500 });
  }
}
