import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { logout } from '@/app/auth/actions';
import { getPlan, PLAN_LIMITS } from '@/lib/plan';

const tools = [
  { href: '/dashboard/teacher', icon: '🎓', title: 'AI Teacher', text: 'Ask doubts and learn step-by-step.' },
  { href: '/dashboard/scanner', icon: '📷', title: 'AI Scanner', text: 'Solve questions from images.' },
  { href: '/dashboard/materials', icon: '📚', title: 'Study Material', text: 'Turn notes and PDFs into learning.' },
  { href: '/dashboard/exams', icon: '📝', title: 'Exam Engine', text: 'Generate practice and mock tests.' },
  { href: '/dashboard/coach', icon: '🧠', title: 'Personal Coach', text: 'Find weaknesses and improve.' },
  { href: '/dashboard/revision', icon: '🔁', title: 'Revision', text: 'Know what to revise next.' },
];

export default async function Dashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: subscription } = await supabase.from('subscriptions').select('plan').eq('user_id', user.id).in('status', ['active', 'trialing']).order('created_at', { ascending: false }).limit(1).maybeSingle();
  const plan = getPlan(subscription?.plan);
  const { data: usage } = await supabase.rpc('get_usage', { p_user_id: user.id, p_plan: plan });
  const questionUsage = usage?.find((item: { feature: string }) => item.feature === 'question');
  const scanUsage = usage?.find((item: { feature: string }) => item.feature === 'scan');
  const name = user.user_metadata?.name || user.email?.split('@')[0] || 'Student';

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-950/90 px-5 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link href="/" className="text-xl font-bold">⚡ AI Study OS</Link>
          <div className="flex items-center gap-3"><span className="hidden text-sm text-slate-400 sm:block">{user.email}</span><form action={logout}><button className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/5">Logout</button></form></div>
        </div>
      </header>
      <section className="mx-auto max-w-6xl px-5 py-10">
        <div className="mb-8 rounded-3xl border border-blue-400/20 bg-gradient-to-br from-blue-500/10 to-violet-500/10 p-7">
          <p className="mb-2 text-sm font-medium text-blue-300">STUDENT DASHBOARD</p>
          <h1 className="text-3xl font-bold md:text-5xl">Welcome, {name}.</h1>
          <p className="mt-3 max-w-2xl text-slate-400">Your study command center for learning, practice, analysis and revision.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{tools.map((tool) => <Link key={tool.href} href={tool.href} className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:-translate-y-1 hover:border-blue-400/40 hover:bg-white/[0.06]"><div className="mb-4 text-3xl">{tool.icon}</div><h2 className="text-xl font-semibold">{tool.title}</h2><p className="mt-2 text-sm leading-6 text-slate-400">{tool.text}</p><span className="mt-5 inline-block text-sm font-medium text-blue-300">Open tool →</span></Link>)}</div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><p className="text-sm text-slate-400">Questions today</p><p className="mt-2 text-3xl font-bold">{questionUsage?.used ?? 0} / {questionUsage?.limit ?? PLAN_LIMITS[plan].questionsPerDay}</p></div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><p className="text-sm text-slate-400">Scans {plan === 'free' ? 'today' : 'this month'}</p><p className="mt-2 text-3xl font-bold">{scanUsage?.used ?? 0} / {scanUsage?.limit ?? (plan === 'free' ? 3 : PLAN_LIMITS[plan].scansPerMonth)}</p></div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><p className="text-sm text-slate-400">Current plan</p><p className="mt-2 text-3xl font-bold capitalize">{plan}</p></div>
        </div>
      </section>
    </main>
  );
}
