import Link from 'next/link';
import { login } from '@/app/auth/actions';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const params = await searchParams;

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <Link href="/" style={{ textDecoration: 'none' }}>← AI Study OS</Link>
        <h1 style={{ fontSize: 32, marginTop: 32, marginBottom: 8 }}>Welcome back</h1>
        <p style={{ opacity: 0.7, marginBottom: 24 }}>Login to continue your AI-powered study journey.</p>
        {params.error && <p style={{ color: '#dc2626', marginBottom: 16 }}>{params.error}</p>}
        {params.message && <p style={{ color: '#16a34a', marginBottom: 16 }}>{params.message}</p>}
        <form action={login} style={{ display: 'grid', gap: 14 }}>
          <input name="email" type="email" placeholder="Email" required autoComplete="email" style={{ padding: 14, borderRadius: 10, border: '1px solid #ccc' }} />
          <input name="password" type="password" placeholder="Password" required autoComplete="current-password" style={{ padding: 14, borderRadius: 10, border: '1px solid #ccc' }} />
          <button type="submit" style={{ padding: 14, borderRadius: 10, border: 0, cursor: 'pointer', fontWeight: 700 }}>Login</button>
        </form>
        <p style={{ marginTop: 14 }}><Link href="/forgot-password">Forgot password?</Link></p>
        <p style={{ marginTop: 20 }}>New here? <Link href="/signup">Create an account</Link></p>
      </div>
    </main>
  );
}
