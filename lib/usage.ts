import { createClient } from '@/lib/supabase/server';
import { getPlan, type Plan } from '@/lib/plan';

export type UsageFeature = 'question' | 'scan' | 'pdf';

export async function getAuthenticatedUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { supabase, user: null, plan: 'free' as Plan };

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('user_id', user.id)
    .in('status', ['active', 'trialing'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return { supabase, user, plan: getPlan(subscription?.plan) };
}

export async function consumeUsage(feature: UsageFeature) {
  const auth = await getAuthenticatedUser();
  if (!auth.user) {
    return { ...auth, allowed: false, used: 0, limit: 0, remaining: 0, periodType: 'daily' };
  }

  const { data, error } = await auth.supabase.rpc('consume_usage', {
    p_user_id: auth.user.id,
    p_feature: feature,
    p_plan: auth.plan,
  });

  if (error || !data?.[0]) {
    console.error('Usage guard error', error);
    return { ...auth, allowed: false, used: 0, limit: 0, remaining: 0, periodType: 'daily' };
  }

  const row = data[0];
  return {
    ...auth,
    allowed: Boolean(row.allowed),
    used: Number(row.used ?? 0),
    limit: Number(row.limit_value ?? 0),
    remaining: Number(row.remaining ?? 0),
    periodType: String(row.period_type),
  };
}
