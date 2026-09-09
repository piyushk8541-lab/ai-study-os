import Link from 'next/link';
import { signup } from '@/app/auth/actions';

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <Link href="/" style={{ textDecoration: 'none' }}>← AI Study OS</Link>
        <h1 style={{ fontSize: 32, marginTop: 32, marginBottom: 8 }}>Create your account</h1>
        <p style={{ opacity: 0.7, marginBottom: 24 }}>Start learning with your personal AI Study OS.</p>
        {params.error && <p style={{ color: '#dc2626', marginBottom: 16 }}>{params.error}</p>}
        <form action={signup} style={{ display: 'grid', gap: 14 }}>
          <input name="name" type="text" placeholder="Your name" autoComplete="name" style={{ padding: 14, borderRadius: 10, border: '1px solid #ccc' }} />
          <input name="email" type="email" placeholder="Email" required autoComplete="email" style={{ padding: 14, borderRadius: 10, border: '1px solid #ccc' }} />
          <input name="password" type="password" placeholder="Password (6+ characters)" required minLength={6} autoComplete="new-password" style={{ padding: 14, borderRadius: 10, border: '1px solid #ccc' }} />
          <button type="submit" style={{ padding: 14, borderRadius: 10, border: 0, cursor: 'pointer', fontWeight: 700 }}>Create account</button>
        </form>
        <p style={{ marginTop: 20 }}>Already have an account? <Link href="/login">Login</Link></p>
      </div>
    </main>
  );
}
