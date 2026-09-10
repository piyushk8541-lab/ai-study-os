'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState('Checking reset link…');
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const prepare = async () => {
      const code = new URLSearchParams(window.location.search).get('code');
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setStatus('This reset link is invalid or has expired. Please request a new one.');
          return;
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setStatus('This reset link is invalid or has expired. Please request a new one.');
        return;
      }

      setReady(true);
      setStatus('Choose a new password.');
    };

    void prepare();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password.length < 6) {
      setStatus('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setStatus('Passwords do not match.');
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setStatus(error.message);
      setSaving(false);
      return;
    }

    await supabase.auth.signOut();
    router.push('/login?message=Password%20updated%20successfully.%20Please%20login.');
  }

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <Link href="/login" style={{ textDecoration: 'none' }}>← Back to login</Link>
        <h1 style={{ fontSize: 32, marginTop: 32, marginBottom: 8 }}>Set a new password</h1>
        <p style={{ opacity: 0.7, marginBottom: 24 }}>{status}</p>
        {ready && (
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="New password (6+ characters)" minLength={6} required autoComplete="new-password" style={{ padding: 14, borderRadius: 10, border: '1px solid #ccc' }} />
            <input value={confirm} onChange={(e) => setConfirm(e.target.value)} type="password" placeholder="Confirm new password" minLength={6} required autoComplete="new-password" style={{ padding: 14, borderRadius: 10, border: '1px solid #ccc' }} />
            <button type="submit" disabled={saving} style={{ padding: 14, borderRadius: 10, border: 0, cursor: saving ? 'wait' : 'pointer', fontWeight: 700 }}>{saving ? 'Updating…' : 'Update password'}</button>
          </form>
        )}
        <p style={{ marginTop: 20 }}><Link href="/forgot-password">Request a new reset link</Link></p>
      </div>
    </main>
  );
}
