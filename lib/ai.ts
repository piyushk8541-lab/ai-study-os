import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";

export type AITask = "simple" | "standard" | "strong";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

function modelFor(task: AITask) {
  const modelId =
    task === "strong"
      ? process.env.AI_MODEL_STRONG || "gemini-2.5-pro"
      : task === "standard"
        ? process.env.AI_MODEL_STANDARD || "gemini-2.5-flash"
        : process.env.AI_MODEL_CHEAP || "gemini-2.5-flash-lite";

  return google(modelId);
}

export async function askStudyAI(input: {
  question: string;
  language?: "english" | "hindi" | "hinglish";
  task?: AITask;
}) {
  const language = input.language ?? "hinglish";
  const task = input.task ?? "simple";

  return generateText({
    model: modelFor(task),
    system: `You are AI Study OS, a patient expert teacher for school and competitive-exam students. Respond in ${language}. Explain accurately and step-by-step. Adapt difficulty to the student's level. Do not invent facts, formulas, or answers. If the question is ambiguous, clearly state the assumption you are using. For mathematics and physics, show the reasoning and final answer clearly.`,
    prompt: input.question,
  });
}
