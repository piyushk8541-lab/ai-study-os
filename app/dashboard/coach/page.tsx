'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Weakness = { subject: string; topic: string; weakness_score: number; accuracy: number | null; recommended_action: string | null };
type Data = { plan: string; stats: { accuracy: number | null; attempts: number; weakTopics: number; dueRevisions: number }; weaknesses: Weakness[]; profile?: { target_exam?: string; class_level?: string } | null };

export default function Coach() {
  const [data, setData] = useState<Data | null>(null);
  const [analysis, setAnalysis] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    const res = await fetch('/api/coach', { cache: 'no-store' });
    if (res.ok) setData(await res.json());
  }
  useEffect(() => { load(); }, []);

  async function analyze() {
    setBusy(true); setError('');
    try {
      const res = await fetch('/api/coach/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Analysis failed');
      setAnalysis(json.analysis ?? 'No analysis returned.');
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong.'); }
    finally { setBusy(false); }
  }

  return <main className="min-h-screen bg-slate-950 p-4 text-white sm:p-6"><div className="mx-auto max-w-5xl">
    <Link href="/dashboard" className="text-sm text-blue-300">← Dashboard</Link>
    <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-3xl font-bold sm:text-4xl">🧠 Personal Coach</h1><p className="mt-2 text-slate-400">Your AI performance intelligence layer.</p></div><span className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-wide text-slate-300">{data?.plan ?? 'free'} plan</span></div>
    <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Card t="Accuracy" v={data?.stats.accuracy == null ? '—' : `${data.stats.accuracy}%`} s="Across recent exams"/><Card t="Exam attempts" v={String(data?.stats.attempts ?? 0)} s="Recent attempts"/><Card t="Weak topics" v={String(data?.stats.weakTopics ?? 0)} s="Needs attention"/><Card t="Due revisions" v={String(data?.stats.dueRevisions ?? 0)} s="Scheduled for review"/></div>
    <button onClick={analyze} disabled={busy} className="mt-6 w-full rounded-xl bg-blue-400 px-5 py-3 font-bold text-slate-950 disabled:opacity-40">{busy ? 'Analyzing your performance…' : '✨ Analyze My Performance'}</button>
    {error && <p className="mt-3 rounded-xl bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
    <section className="mt-7 rounded-3xl border border-white/10 bg-white/[0.03] p-5"><h2 className="text-xl font-bold">🎯 Weak Areas</h2>{data?.weaknesses.length ? <div className="mt-4 space-y-3">{data.weaknesses.map((w, i) => <div key={`${w.subject}-${w.topic}-${i}`} className="rounded-2xl border border-white/10 p-4"><div className="flex justify-between gap-3"><div><p className="font-semibold">{w.subject} · {w.topic}</p><p className="mt-1 text-xs text-slate-500">Accuracy: {w.accuracy == null ? '—' : `${Math.round(Number(w.accuracy))}%`}</p></div><span className="text-sm text-orange-300">Weakness {Math.round(Number(w.weakness_score))}/100</span></div>{w.recommended_action && <p className="mt-2 text-sm text-slate-300">Next: {w.recommended_action}</p>}</div>)}</div> : <p className="mt-3 text-sm text-slate-500">No weakness data yet. Complete an exam to start personalized tracking.</p>}</section>
    {analysis && <section className="mt-6 rounded-3xl border border-blue-400/20 bg-blue-400/5 p-5"><h2 className="text-xl font-bold">✨ AI Coaching Report</h2><pre className="mt-4 whitespace-pre-wrap font-sans text-sm leading-7 text-slate-200">{analysis}</pre></section>}
  </div></main>;
}
function Card({t,v,s}:{t:string;v:string;s:string}) { return <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><p className="text-sm text-slate-400">{t}</p><p className="mt-2 text-3xl font-bold">{v}</p><p className="mt-2 text-xs text-slate-500">{s}</p></div>; }
