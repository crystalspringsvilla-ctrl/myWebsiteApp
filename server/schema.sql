-- ============================================================
-- Crystal Springs Villa — Supabase schema
-- Run this once in Supabase: Project -> SQL Editor -> New query -> paste -> Run
--
-- Manual date blocking is handled by your Google Calendar (any event on it
-- blocks those dates) — see server/lib/googleCalendar.js — so this schema
-- only needs to track actual booking requests.
-- ============================================================

create extension if not exists "pgcrypto";

create table if not exists coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  discount_type text not null default 'fixed',
  discount_value numeric not null default 0,
  is_active boolean not null default true,
  min_amount numeric not null default 0,
  max_discount numeric,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  guest_name text not null,
  phone text not null,
  email text,
  checkin date not null,
  checkout date not null,
  guests int not null default 6,
  want_food boolean not null default false,
  bbq_kg numeric not null default 0,
  notes text,

  nights int not null,
  base_amount numeric not null,
  extra_guest_amount numeric not null default 0,
  food_amount numeric not null default 0,
  bbq_amount numeric not null default 0,
  original_total_amount numeric,
  discount_amount numeric not null default 0,
  coupon_code text,
  coupon_discount_type text,
  coupon_discount_value numeric,
  total_amount numeric not null,

  status text not null default 'pending',  -- pending -> paid -> failed / cancelled
  razorpay_order_id text,
  razorpay_payment_id text,

  created_at timestamptz not null default now()
);

create index if not exists idx_bookings_dates on bookings (checkin, checkout);
create index if not exists idx_bookings_status on bookings (status);
create unique index if not exists idx_bookings_order_id on bookings (razorpay_order_id) where razorpay_order_id is not null;
create index if not exists idx_coupons_code on coupons (code);

alter table bookings enable row level security;
alter table coupons enable row level security;

-- If you already have a `bookings` table without coupon columns, run these
-- ALTER statements in Supabase SQL editor to add them safely.
alter table bookings add column original_total_amount numeric;
alter table bookings add column discount_amount numeric not null default 0;
alter table bookings add column coupon_code text;
alter table bookings add column coupon_discount_type text;
alter table bookings add column coupon_discount_value numeric;
