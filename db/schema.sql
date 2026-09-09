-- AI Study OS production data model (PostgreSQL / Supabase)
create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  preferred_language text not null default 'hinglish',
  education_level text,
  class_level text,
  target_exam text,
  target_exam_date date,
  timezone text not null default 'Asia/Kolkata',
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free','student','pro','premium')),
  provider text check (provider in ('razorpay','stripe')),
  provider_customer_id text,
  provider_subscription_id text,
  status text not null default 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

create table if not exists usage_limits (
  plan text primary key check (plan in ('free','student','pro','premium')),
  questions_per_day integer not null,
  scans_per_day integer,
  scans_per_month integer,
  pdfs_per_month integer not null,
  max_pdf_pages integer not null,
  max_tokens_per_request integer not null,
  premium_model_allowed boolean not null default false,
  advanced_mocks_allowed boolean not null default false,
  voice_tutor_allowed boolean not null default false
);

insert into usage_limits values
('free',10,3,null,1,20,4000,false,false,false),
('student',100,null,30,10,100,8000,false,false,false),
('pro',500,null,30,50,300,16000,true,true,true),
('premium',1000,null,100,100,500,24000,true,true,true)
on conflict (plan) do update set
questions_per_day=excluded.questions_per_day,
scans_per_day=excluded.scans_per_day,
scans_per_month=excluded.scans_per_month,
pdfs_per_month=excluded.pdfs_per_month;

create table if not exists usage_counters (
  user_id uuid not null references users(id) on delete cascade,
  period_type text not null check (period_type in ('daily','monthly')),
  period_start date not null,
  questions_used integer not null default 0,
  scans_used integer not null default 0,
  pdfs_used integer not null default 0,
  primary key (user_id, period_type, period_start)
);

create table if not exists usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  feature text not null,
  model text,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  estimated_cost_usd numeric(12,6) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists uploads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  file_name text not null,
  mime_type text not null,
  storage_key text not null,
  file_size_bytes bigint not null,
  page_count integer,
  processing_status text not null default 'queued',
  processing_error text,
  extracted_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ai_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  job_type text not null,
  status text not null default 'queued' check (status in ('queued','processing','completed','failed','cancelled')),
  input jsonb not null default '{}'::jsonb,
  result jsonb,
  error text,
  attempts integer not null default 0,
  max_attempts integer not null default 3,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);

create index if not exists usage_events_user_created_idx on usage_events(user_id, created_at desc);
create index if not exists uploads_user_created_idx on uploads(user_id, created_at desc);
create index if not exists ai_jobs_status_created_idx on ai_jobs(status, created_at);
