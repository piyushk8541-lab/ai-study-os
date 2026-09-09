export type Plan = 'free' | 'student' | 'pro' | 'premium';

export const PLAN_LIMITS: Record<Plan, {
  questionsPerDay: number;
  scansPerDay?: number;
  scansPerMonth?: number;
  pdfsPerMonth: number;
  maxPdfPages: number;
  advancedMocks: boolean;
  voiceTutor: boolean;
}> = {
  free: { questionsPerDay: 10, scansPerDay: 3, pdfsPerMonth: 1, maxPdfPages: 20, advancedMocks: false, voiceTutor: false },
  student: { questionsPerDay: 100, scansPerMonth: 30, pdfsPerMonth: 10, maxPdfPages: 100, advancedMocks: false, voiceTutor: false },
  pro: { questionsPerDay: 500, scansPerMonth: 30, pdfsPerMonth: 50, maxPdfPages: 300, advancedMocks: true, voiceTutor: true },
  premium: { questionsPerDay: 1000, scansPerMonth: 100, pdfsPerMonth: 100, maxPdfPages: 500, advancedMocks: true, voiceTutor: true },
};

export function getPlan(value?: string | null): Plan {
  return value === 'student' || value === 'pro' || value === 'premium' ? value : 'free';
}
