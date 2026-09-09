"use client";

import { useState } from "react";

const modules = [
  ["AI Teacher", "Learn concepts with adaptive explanations, examples, and Socratic questions."],
  ["AI Scanner", "Upload a question, handwritten work, diagram, or formula and get a step-by-step solution."],
  ["Study Material", "Turn PDFs, notes, images, and transcripts into structured learning material."],
  ["Exam Engine", "Generate MCQs, numericals, subjective questions, PYQ-style practice, and mocks."],
  ["Personal Coach", "Find weak topics, track accuracy, and turn performance into a focused study plan."],
  ["Revision Engine", "Automatically schedule what you should revise next based on your performance."],
] as const;

export default function Home() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  async function askTeacher() {
    if (!question.trim()) return;
    setLoading(true);
    setAnswer("");
    try {
      const response = await fetch("/api/teacher/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, language: "hinglish" }),
      });
      const data = await response.json();
      setAnswer(data.answer ?? data.error ?? "Something went wrong.");
    } catch {
      setAnswer("Unable to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(135deg,#07111f 0%,#0b1830 55%,#101b3d 100%)" }}>
      <nav style={{ maxWidth: 1180, margin: "0 auto", padding: "24px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <strong style={{ fontSize: 22 }}>⚡ AI Study OS</strong>
        <div style={{ display: "flex", gap: 18, color: "#b8c5d9", fontSize: 14 }}>
          <span>Teacher</span><span>Scanner</span><span>Exams</span><span>Coach</span>
        </div>
      </nav>

      <section style={{ maxWidth: 1000, margin: "0 auto", padding: "80px 24px 40px", textAlign: "center" }}>
        <div style={{ display: "inline-block", padding: "8px 14px", border: "1px solid #334a72", borderRadius: 999, color: "#a9c4ff", background: "#10203c", fontSize: 13, marginBottom: 20 }}>
          Your AI-powered study partner
        </div>
        <h1 style={{ fontSize: "clamp(42px,7vw,76px)", lineHeight: 1.02, margin: "0 auto 22px", maxWidth: 900 }}>
          Study smarter. <span style={{ color: "#8fb4ff" }}>Know what to do next.</span>
        </h1>
        <p style={{ maxWidth: 720, margin: "0 auto 34px", color: "#aebbd0", fontSize: 18, lineHeight: 1.65 }}>
          Upload anything. Tell AI your exam goal. AI teaches you, tests you, finds your weaknesses, and creates your next study plan.
        </p>

        <div style={{ maxWidth: 760, margin: "0 auto", padding: 8, background: "#0d1b31", border: "1px solid #2b4266", borderRadius: 20 }}>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask your AI Teacher anything… e.g. Explain electrostatics like I'm preparing for JEE."
            rows={4}
            style={{ width: "100%", resize: "none", border: 0, outline: 0, background: "transparent", color: "white", padding: 16, fontSize: 16 }}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", padding: 8 }}>
            <button onClick={askTeacher} disabled={loading} style={{ border: 0, borderRadius: 12, padding: "12px 20px", background: "#7da7ff", color: "#07111f", fontWeight: 700 }}>
              {loading ? "Thinking…" : "Ask AI Teacher →"}
            </button>
          </div>
        </div>

        {answer && (
          <div style={{ maxWidth: 760, margin: "18px auto 0", textAlign: "left", padding: 22, borderRadius: 16, background: "#0d1b31", border: "1px solid #2b4266", whiteSpace: "pre-wrap", lineHeight: 1.65 }}>
            {answer}
          </div>
        )}
      </section>

      <section style={{ maxWidth: 1180, margin: "0 auto", padding: "50px 24px 100px" }}>
        <h2 style={{ textAlign: "center", fontSize: 34, marginBottom: 12 }}>One AI OS for your entire study journey</h2>
        <p style={{ textAlign: "center", color: "#9eacc2", marginBottom: 36 }}>Six connected systems. One learning history.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16 }}>
          {modules.map(([title, description]) => (
            <article key={title} style={{ padding: 24, border: "1px solid #233957", background: "#0c192d", borderRadius: 18 }}>
              <h3 style={{ margin: "0 0 10px", fontSize: 20 }}>{title}</h3>
              <p style={{ color: "#9eacc2", lineHeight: 1.6, margin: 0 }}>{description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
