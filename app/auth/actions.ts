'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

function getAppUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://ai-study-os-iota.vercel.app'
  ).replace(/\/$/, '');
}

export async function login(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) redirect('/login?error=Email%20and%20password%20are%20required');

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);

  redirect('/dashboard');
}

export async function signup(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const name = String(formData.get('name') ?? '').trim();

  if (!email || password.length < 6) {
    redirect('/signup?error=Use%20a%20valid%20email%20and%20a%20password%20of%20at%20least%206%20characters');
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
      emailRedirectTo: `${getAppUrl()}/login`,
    },
  });

  if (error) redirect(`/signup?error=${encodeURIComponent(error.message)}`);

  if (data.session) redirect('/dashboard');
  redirect('/login?message=Check%20your%20email%20to%20confirm%20your%20account');
}

export async function requestPasswordReset(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get('email') ?? '').trim();

  if (!email) redirect('/forgot-password?error=Enter%20your%20email%20address');

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${getAppUrl()}/update-password`,
  });

  if (error) redirect(`/forgot-password?error=${encodeURIComponent(error.message)}`);

  redirect('/forgot-password?message=Check%20your%20email%20for%20the%20password%20reset%20link');
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
