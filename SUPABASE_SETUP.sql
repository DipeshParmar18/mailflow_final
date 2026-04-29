-- ============================================================
-- MailFlow — Supabase Database Setup
-- Run this ONCE in your Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Paste → Run
-- ============================================================

-- 1. Contacts Table
create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  website text,
  phone text,
  created_at timestamptz default now()
);

-- 2. Campaigns Table
create table if not exists campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subject text not null,
  body text not null,
  status text default 'draft',
  total integer default 0,
  sent_count integer default 0,
  failed_count integer default 0,
  created_at timestamptz default now()
);

-- 3. Email Logs Table (for tracking)
create table if not exists email_logs (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references campaigns(id),
  contact_id uuid references contacts(id),
  email text not null,
  status text default 'sent', -- sent | opened | clicked | failed
  opened_at timestamptz,
  clicked_at timestamptz,
  created_at timestamptz default now()
);

-- 4. Settings Table (stores Brevo key, sender info, etc.)
create table if not exists settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value text,
  updated_at timestamptz default now()
);

-- 5. Enable Row Level Security (RLS) but allow all for now
-- You can add auth later - for now, open access for your personal use

alter table contacts enable row level security;
alter table campaigns enable row level security;
alter table email_logs enable row level security;
alter table settings enable row level security;

-- Allow all operations (since this is your personal tool)
create policy "allow all contacts" on contacts for all using (true) with check (true);
create policy "allow all campaigns" on campaigns for all using (true) with check (true);
create policy "allow all email_logs" on email_logs for all using (true) with check (true);
create policy "allow all settings" on settings for all using (true) with check (true);

-- Done! All tables created successfully.
