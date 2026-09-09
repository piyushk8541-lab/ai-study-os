"use client";

import Link from "next/link";

const tools = [
  { href: "/dashboard/teacher", icon: "🎓", title: "AI Teacher", text: "Ask doubts and learn step-by-step." },
  { href: "/dashboard/scanner", icon: "📷", title: "AI Scanner", text: "Solve questions from images." },
  { href: "/dashboard/materials", icon: "📚", title: "Study Material", text: "Turn notes and PDFs into learning." },
  { href: "/dashboard/exams", icon: "📝", title: "Exam Engine", text: "Generate practice and mock tests." },
  { href: "/dashboard/coach", icon: "🧠", title: "Personal Coach", text: "Find weaknesses and improve." },
  { href: "/dashboard/revision", icon: "🔁", title: "Revision", text: "Know what to revise next." },
];

export default function Dashboard() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-950/90 px-5 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="text-xl font-bold">⚡ AI Study OS</Link>
          <Link href="/" className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/5">Home</Link>
        </div>
      </header>
      <section className="mx-auto max-w-6xl px-5 py-10">
        <div className="mb-8 rounded-3xl border border-blue-400/20 bg-gradient-to-br from-blue-500/10 to-violet-500/10 p-7">
          <p className="mb-2 text-sm font-medium text-blue-300">STUDENT DASHBOARD</p>
          <h1 className="text-3xl font-bold md:text-5xl">Your study command center.</h1>
          <p className="mt-3 max-w-2xl text-slate-400">Learn, practice, analyze and revise from one connected AI workspace.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <Link key={tool.href} href={tool.href} className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:-translate-y-1 hover:border-blue-400/40 hover:bg-white/[0.06]">
              <div className="mb-4 text-3xl">{tool.icon}</div>
              <h2 className="text-xl font-semibold">{tool.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">{tool.text}</p>
              <span className="mt-5 inline-block text-sm font-medium text-blue-300">Open tool →</span>
            </Link>
          ))}
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><p className="text-sm text-slate-400">Questions today</p><p className="mt-2 text-3xl font-bold">0 / 10</p></div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><p className="text-sm text-slate-400">Scans</p><p className="mt-2 text-3xl font-bold">0 / 3</p></div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><p className="text-sm text-slate-400">Current plan</p><p className="mt-2 text-3xl font-bold">Free</p></div>
        </div>
      </section>
    </main>
  );
}
