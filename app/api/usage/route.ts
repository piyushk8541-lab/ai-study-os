import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../lib/usage';
import { PLAN_LIMITS } from '../../../lib/plan';

export async function GET() {
  const { supabase, user, plan } = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase.rpc('get_usage', {
    p_user_id: user.id,
    p_plan: plan,
  });
  if (error) {
    console.error('Usage read error', error);
    return NextResponse.json({ error: 'Unable to load usage.' }, { status: 500 });
  }

  const limits = PLAN_LIMITS[plan];
  return NextResponse.json({ plan, limits, usage: data ?? [] });
}
