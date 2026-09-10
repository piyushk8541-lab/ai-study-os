import Link from 'next/link';
import { requestPasswordReset } from '@/app/auth/actions';

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const params = await searchParams;

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <Link href="/login" style={{ textDecoration: 'none' }}>← Back to login</Link>
        <h1 style={{ fontSize: 32, marginTop: 32, marginBottom: 8 }}>Reset your password</h1>
        <p style={{ opacity: 0.7, marginBottom: 24 }}>Enter your account email and we’ll send you a secure password reset link.</p>
        {params.error && <p style={{ color: '#dc2626', marginBottom: 16 }}>{params.error}</p>}
        {params.message && <p style={{ color: '#16a34a', marginBottom: 16 }}>{params.message}</p>}
        <form action={requestPasswordReset} style={{ display: 'grid', gap: 14 }}>
          <input name="email" type="email" placeholder="Email" required autoComplete="email" style={{ padding: 14, borderRadius: 10, border: '1px solid #ccc' }} />
          <button type="submit" style={{ padding: 14, borderRadius: 10, border: 0, cursor: 'pointer', fontWeight: 700 }}>Send reset link</button>
        </form>
      </div>
    </main>
  );
}
