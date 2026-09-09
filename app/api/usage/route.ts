import { NextResponse } from 'next/server';
import { getPlan, PLAN_LIMITS } from '../../../lib/plan';

export async function GET(request: Request) {
  // Temporary authenticated-user boundary: production auth will supply the user and plan.
  const plan = getPlan(new URL(request.url).searchParams.get('plan'));
  const limits = PLAN_LIMITS[plan];

  return NextResponse.json({
    plan,
    limits,
    note: 'Usage counters are enforced server-side after authentication and database connection are configured.',
  });
}
