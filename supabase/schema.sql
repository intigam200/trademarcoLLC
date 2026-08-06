-- ============================================================================
-- Trademarco Global — Supabase schema
--
-- Run this once in your Supabase project's SQL Editor (Dashboard > SQL Editor
-- > New query), on a fresh project. Safe to re-run — every statement is
-- idempotent (IF NOT EXISTS / OR REPLACE / ON CONFLICT DO NOTHING).
--
-- After this, optionally run seed.sql to pre-populate manufacturers and
-- categories with the content already live on the site today, and
-- storage.sql to create the product-images/datasheets buckets.
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- Shared trigger: keeps updated_at current on every UPDATE.
-- ----------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;


-- ============================================================================
-- manufacturers
-- ============================================================================
create table if not exists manufacturers (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,
  name             text not null,
  description      text,
  website          text,
  logo_url         text,
  logo_dark        boolean not null default false, -- true if the logo needs a dark chip background (e.g. a white-only mark)
  seo_title        text,
  seo_description  text,
  status           text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_manufacturers_slug   on manufacturers (slug);
create index if not exists idx_manufacturers_status on manufacturers (status);

drop trigger if exists trg_manufacturers_updated_at on manufacturers;
create trigger trg_manufacturers_updated_at
  before update on manufacturers
  for each row execute function set_updated_at();


-- ============================================================================
-- categories
-- ============================================================================
create table if not exists categories (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique,
  name              text not null,
  description       text,
  full_description  text,
  image_url         text,
  types             text[] not null default '{}', -- subcategory labels shown in the Products explorer
  parent_id         uuid references categories (id) on delete set null,
  seo_title         text,
  seo_description   text,
  status            text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_categories_slug   on categories (slug);
create index if not exists idx_categories_parent on categories (parent_id);
create index if not exists idx_categories_status on categories (status);

drop trigger if exists trg_categories_updated_at on categories;
create trigger trg_categories_updated_at
  before update on categories
  for each row execute function set_updated_at();


-- ============================================================================
-- products
-- ============================================================================
create table if not exists products (
  id                        uuid primary key default gen_random_uuid(),
  slug                      text not null, -- unique per manufacturer, not globally (see unique() below)
  part_number               text not null,
  manufacturer_id           uuid not null references manufacturers (id) on delete restrict,
  category_id               uuid not null references categories (id) on delete restrict,
  series                    text,
  product_name              text not null,
  short_description         text not null,
  long_description          text,
  applications              text[] not null default '{}',
  industries                text[] not null default '{}',
  alternative_part_numbers  text[] not null default '{}',
  rfq_available             boolean not null default true,
  image_url                 text, -- product-images bucket
  datasheet_url             text, -- datasheets bucket
  price                     numeric,
  size                      text,
  rating                    text, -- e.g. pressure/temperature class ("Class 150", "PN16") — free text, not a numeric review score
  type                      text,
  seo_title                 text,
  seo_description           text,
  status                    text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),

  unique (manufacturer_id, slug)
);

-- Adds price/size/rating/type to a products table created before these
-- columns existed (create table if not exists above is a no-op on an
-- already-deployed table, so already-live projects need this too).
alter table products add column if not exists price numeric;
alter table products add column if not exists size text;
alter table products add column if not exists rating text;
alter table products add column if not exists type text;

create index if not exists idx_products_manufacturer on products (manufacturer_id);
create index if not exists idx_products_category     on products (category_id);
create index if not exists idx_products_status       on products (status);
create index if not exists idx_products_part_number  on products (part_number);
create index if not exists idx_products_search on products using gin (
  to_tsvector('english', part_number || ' ' || product_name || ' ' || coalesce(short_description, ''))
);

drop trigger if exists trg_products_updated_at on products;
create trigger trg_products_updated_at
  before update on products
  for each row execute function set_updated_at();


-- ============================================================================
-- product_related — many-to-many "related products" (proper FK-backed join
-- table, rather than a plain array of ids, so relations stay referentially
-- valid: deleting a product automatically drops its relation rows).
-- ============================================================================
create table if not exists product_related (
  product_id         uuid not null references products (id) on delete cascade,
  related_product_id uuid not null references products (id) on delete cascade,
  created_at         timestamptz not null default now(),

  primary key (product_id, related_product_id),
  check (product_id <> related_product_id)
);

create index if not exists idx_product_related_product on product_related (product_id);


-- ============================================================================
-- rfqs
-- ============================================================================
create table if not exists rfqs (
  id                uuid primary key default gen_random_uuid(),
  request_number    int, -- sequence position within request_id's year, e.g. 1 for RFQ-2026-000001
  request_id        text unique, -- human-readable id shown to customers/staff, e.g. "RFQ-2026-000001"
  company           text, -- optional: the public contact form doesn't require a company name
  contact_name      text not null,
  email             text not null,
  phone             text,
  country           text,
  product_id        uuid references products (id) on delete set null,
  product_text      text, -- free-text product description, used when not tied to a catalog product
  -- Denormalized snapshot of the product/manufacturer at submission time —
  -- kept even if the underlying product is later edited or deleted, so an
  -- RFQ's admin record and notification emails always reflect what the
  -- customer actually saw and asked about.
  manufacturer_name text,
  product_name      text,
  part_number       text,
  page_url          text, -- the page the RFQ was submitted from
  message           text,
  status            text not null default 'unread' check (status in ('unread', 'in_progress', 'quoted', 'closed')),
  notes             text, -- internal admin-only notes, never shown to the customer
  ip_address        text,
  user_agent        text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Migrations for rfqs tables created before the columns/statuses above
-- existed (create table if not exists is a no-op on an already-deployed
-- table, so already-live projects need this too).
alter table rfqs add column if not exists manufacturer_name text;
alter table rfqs add column if not exists product_name text;
alter table rfqs add column if not exists part_number text;
alter table rfqs add column if not exists page_url text;
alter table rfqs add column if not exists notes text;
alter table rfqs add column if not exists ip_address text;
alter table rfqs add column if not exists user_agent text;
alter table rfqs add column if not exists request_number int;
alter table rfqs add column if not exists request_id text;
create unique index if not exists idx_rfqs_request_id on rfqs (request_id);

update rfqs set status = 'unread' where status = 'new';

alter table rfqs drop constraint if exists rfqs_status_check;
alter table rfqs add constraint rfqs_status_check
  check (status in ('unread', 'in_progress', 'quoted', 'closed'));

alter table rfqs alter column status set default 'unread';

create index if not exists idx_rfqs_status     on rfqs (status);
create index if not exists idx_rfqs_product    on rfqs (product_id);
create index if not exists idx_rfqs_created_at on rfqs (created_at desc);

drop trigger if exists trg_rfqs_updated_at on rfqs;
create trigger trg_rfqs_updated_at
  before update on rfqs
  for each row execute function set_updated_at();

-- Per-year atomic counter backing human-readable request IDs (RFQ-2026-000001,
-- RFQ-2026-000002, ...). A plain "select max(request_number)+1" would race
-- under concurrent inserts; the upsert below is atomic under Postgres's
-- row-level locking, so two simultaneous RFQ submissions can never collide
-- on the same number.
create table if not exists rfq_counters (
  year        int primary key,
  next_value  int not null default 1
);

create or replace function assign_rfq_request_id()
returns trigger as $$
declare
  yr  int := extract(year from now())::int;
  seq int;
begin
  insert into rfq_counters (year, next_value) values (yr, 2)
  on conflict (year) do update set next_value = rfq_counters.next_value + 1
  returning next_value - 1 into seq;

  new.request_number := seq;
  new.request_id := 'RFQ-' || yr || '-' || lpad(seq::text, 6, '0');
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_rfqs_request_id on rfqs;
create trigger trg_rfqs_request_id
  before insert on rfqs
  for each row
  when (new.request_id is null)
  execute function assign_rfq_request_id();


-- ============================================================================
-- users — admin/staff profiles, 1:1 with Supabase Auth (auth.users).
-- There is no public sign-up route anywhere in the app, so every row here
-- corresponds to a staff account you created yourself (see README steps).
-- ============================================================================
create table if not exists users (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  full_name   text,
  role        text not null default 'admin' check (role in ('admin', 'staff')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_users_role on users (role);

drop trigger if exists trg_users_updated_at on users;
create trigger trg_users_updated_at
  before update on users
  for each row execute function set_updated_at();

-- Auto-create the matching public.users row whenever a new account appears
-- in Supabase Auth (i.e. whenever you create an admin user from the
-- Dashboard or via the Auth API).
create or replace function handle_new_auth_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();


-- ============================================================================
-- Row Level Security
--
-- Model: anonymous (public website) visitors may only READ active/published
-- rows. RFQ submissions are written server-side via the service role key
-- (see api/rfq.js), not by the anon client, so there is no public INSERT
-- policy on rfqs. Any authenticated user may do anything to catalog/RFQ
-- data — since this app has no public sign-up route, the only accounts
-- that can ever authenticate are the admins you create yourself.
-- ============================================================================
alter table manufacturers   enable row level security;
alter table categories      enable row level security;
alter table products        enable row level security;
alter table product_related enable row level security;
alter table rfqs            enable row level security;
alter table rfq_counters    enable row level security;
alter table users           enable row level security;

-- rfq_counters is only ever touched by the request-id trigger, invoked as
-- part of a service-role insert into rfqs (see api/rfq.js) — the service
-- role bypasses RLS entirely, so no policy is needed or added here. RLS is
-- still enabled so no other role can read or write it.

drop policy if exists "Public can read active manufacturers" on manufacturers;
create policy "Public can read active manufacturers"
  on manufacturers for select
  using (status = 'active');

drop policy if exists "Admins can manage manufacturers" on manufacturers;
create policy "Admins can manage manufacturers"
  on manufacturers for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "Public can read active categories" on categories;
create policy "Public can read active categories"
  on categories for select
  using (status = 'active');

drop policy if exists "Admins can manage categories" on categories;
create policy "Admins can manage categories"
  on categories for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "Public can read published products" on products;
create policy "Public can read published products"
  on products for select
  using (status = 'published');

drop policy if exists "Admins can manage products" on products;
create policy "Admins can manage products"
  on products for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "Public can read product relations" on product_related;
create policy "Public can read product relations"
  on product_related for select
  using (true); -- just id pairs, no sensitive data; the products themselves are still gated above

drop policy if exists "Admins can manage product relations" on product_related;
create policy "Admins can manage product relations"
  on product_related for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- RFQ inserts no longer go through the anon client directly — they're
-- written server-side (api/rfq.js, using the service role key, which
-- bypasses RLS) after validation, sanitization and spam-check pass. This
-- policy is intentionally dropped so the exposed anon key can never be used
-- to write directly to rfqs, forcing every submission through that
-- validated endpoint.
drop policy if exists "Anyone can submit an RFQ" on rfqs;

drop policy if exists "Admins can manage rfqs" on rfqs;
create policy "Admins can manage rfqs"
  on rfqs for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Any authenticated admin can see the staff list (there's no public sign-up,
-- so every authenticated account is inherently a staff member).
drop policy if exists "Admins can view all users" on users;
create policy "Admins can view all users"
  on users for select
  using (auth.role() = 'authenticated');
