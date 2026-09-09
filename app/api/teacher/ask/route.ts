import { NextResponse } from "next/server";
import { z } from "zod";
import { askStudyAI } from "../../../../../../lib/ai";
import { consumeUsage } from "../../../../../../lib/usage";

const schema = z.object({
  question: z.string().trim().min(1).max(12000),
  language: z.enum(["english", "hindi", "hinglish"]).optional(),
});

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "AI is not configured yet." }, { status: 503 });
    }

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Please provide a valid question." }, { status: 400 });

    const usage = await consumeUsage("question");
    if (!usage.user) return NextResponse.json({ error: "Please log in to use AI Teacher." }, { status: 401 });
    if (!usage.allowed) {
      return NextResponse.json({ error: `Daily question limit reached for your ${usage.plan} plan.`, plan: usage.plan, used: usage.used, limit: usage.limit, remaining: usage.remaining }, { status: 429 });
    }

    const result = await askStudyAI({ question: parsed.data.question, language: parsed.data.language, task: "simple" });

    await usage.supabase.from('usage_events').insert({
      user_id: usage.user.id,
      feature: 'teacher',
      model: process.env.AI_MODEL_CHEAP || 'gpt-5.6-luna',
      units: 1,
    });

    return NextResponse.json({ answer: result.text, usage: { used: usage.used, limit: usage.limit, remaining: usage.remaining } });
  } catch (error) {
    console.error("AI Teacher error", error);
    return NextResponse.json({ error: "AI Teacher could not answer right now." }, { status: 500 });
  }
}
