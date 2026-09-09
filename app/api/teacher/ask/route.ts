import { NextResponse } from "next/server";
import { z } from "zod";
import { askStudyAI } from "../../../../../../lib/ai";

const schema = z.object({
  question: z.string().trim().min(1).max(12000),
  language: z.enum(["english", "hindi", "hinglish"]).optional(),
});

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "AI is not configured yet. Add OPENAI_API_KEY in the server environment." },
        { status: 503 },
      );
    }

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Please provide a valid question." }, { status: 400 });
    }

    const result = await askStudyAI({
      question: parsed.data.question,
      language: parsed.data.language,
      task: "simple",
    });

    return NextResponse.json({ answer: result.text });
  } catch (error) {
    console.error("AI Teacher error", error);
    return NextResponse.json({ error: "AI Teacher could not answer right now." }, { status: 500 });
  }
}
