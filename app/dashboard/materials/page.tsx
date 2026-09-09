'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Material = { id: string; file_name: string; page_count: number | null; processing_status: string; created_at: string };
type Job = { id: string; input: { upload_id?: string; file_name?: string }; result?: { material?: string }; status: string; created_at: string };

export default function MaterialsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState('');

  async function load() {
    const res = await fetch('/api/materials', { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    setMaterials(data.materials ?? []);
    setJobs(data.jobs ?? []);
  }

  useEffect(() => { load(); }, []);

  async function uploadAndGenerate() {
    if (!file) return;
    setBusy(true); setError(''); setResult('');
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('title', file.name);
      const uploadRes = await fetch('/api/materials/upload', { method: 'POST', body: form });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error ?? 'Upload failed');

      const generateRes = await fetch('/api/materials/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uploadId: uploadData.upload.id }),
      });
      const generateData = await generateRes.json();
      if (!generateRes.ok) throw new Error(generateData.error ?? 'Generation failed');
      setResult(generateData.material ?? 'No material returned.');
      await load();
      setFile(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally { setBusy(false); }
  }

  return (
    <main className="min-h-screen bg-slate-950 p-4 text-white sm:p-6">
      <div className="mx-auto max-w-5xl">
        <Link href="/dashboard" className="text-sm text-blue-300">← Dashboard</Link>
        <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div><h1 className="text-3xl font-bold sm:text-4xl">📚 AI Study Material</h1><p className="mt-2 text-slate-400">Upload a PDF or TXT file and turn it into exam-ready notes, formulas, MCQs and a revision plan.</p></div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">Free: 1 PDF/month · 20 pages/PDF</div>
        </div>

        <section className="mt-7 rounded-3xl border border-white/10 bg-white/[0.04] p-4 sm:p-6">
          <label className="flex min-h-52 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 bg-slate-900 p-6 text-center">
            <span className="text-5xl">📄</span><span className="mt-3 font-semibold">{file ? file.name : 'Choose PDF or TXT'}</span><span className="mt-2 text-xs text-slate-500">Maximum 50 MB · page limit depends on plan</span>
            <input type="file" accept="application/pdf,text/plain,.txt" className="hidden" onChange={e => setFile(e.target.files?.[0] ?? null)} />
          </label>
          <button onClick={uploadAndGenerate} disabled={!file || busy} className="mt-4 w-full rounded-xl bg-blue-400 px-5 py-3 font-bold text-slate-950 disabled:opacity-40">{busy ? 'Generating your study material…' : 'Upload + Generate Study Material'}</button>
          {error && <p className="mt-3 rounded-xl bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
        </section>

        {result && <section className="mt-6 rounded-3xl border border-blue-400/20 bg-blue-400/5 p-5"><h2 className="text-xl font-bold">✨ Generated Material</h2><pre className="mt-4 whitespace-pre-wrap font-sans text-sm leading-7 text-slate-200">{result}</pre></section>}

        <section className="mt-7">
          <h2 className="text-xl font-bold">Your materials</h2>
          <div className="mt-3 space-y-3">{materials.map(m => {
            const job = jobs.find(j => j.input?.upload_id === m.id);
            return <div key={m.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><div className="flex items-center justify-between gap-3"><div><p className="font-semibold">{m.file_name}</p><p className="text-xs text-slate-500">{m.page_count ?? 1} page(s) · {m.processing_status}</p></div><span className="rounded-full bg-white/10 px-3 py-1 text-xs">{job?.status ?? m.processing_status}</span></div>{job?.result?.material && <details className="mt-3"><summary className="cursor-pointer text-sm text-blue-300">View generated material</summary><pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-6 text-slate-300">{job.result.material}</pre></details>}</div>;
          })}</div>
          {materials.length === 0 && <p className="mt-3 text-sm text-slate-500">No study materials yet.</p>}
        </section>
      </div>
    </main>
  );
}
