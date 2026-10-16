-- ============================================================================
-- SEO Growth Center — schema additions
--
-- Run once in Supabase (Dashboard > SQL Editor > New query). Idempotent: safe
-- to re-run. Additive only — no existing column, row or policy is changed or
-- removed. Reverse with 20261016_seo_growth_center_down.sql.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- articles — the site had no blog/article storage. Body is Markdown, rendered
-- by src/lib/markdown.js (escaped, allow-listed output) on the site and in
-- api/render.js for crawlers.
-- ----------------------------------------------------------------------------
create table if not exists articles (
  id                   uuid primary key default gen_random_uuid(),
  slug                 text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title                text not null,
  meta_title           text,
  meta_description     text,
  excerpt              text,
  body_md              text not null default '',
  hero_image_url       text,
  hero_image_alt       text,
  primary_query        text,
  search_intent        text check (search_intent in ('informational', 'commercial', 'transactional')),
  audience             text,
  content_type         text,
  manufacturer_id      uuid references manufacturers (id) on delete set null,
  category_id          uuid references categories (id) on delete set null,
  related_product_ids  uuid[] not null default '{}',
  brief                jsonb not null default '{}'::jsonb, -- the content brief the draft was created from
  sources              jsonb not null default '[]'::jsonb, -- [{ url, title, note }] recorded for fact review
  review               jsonb not null default '{}'::jsonb, -- human checklist sign-offs: { checkId: { by, at } }
  status               text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at         timestamptz,
  author_id            uuid references users (id) on delete set null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists idx_articles_status       on articles (status);
create index if not exists idx_articles_published_at on articles (published_at desc);
create index if not exists idx_articles_manufacturer on articles (manufacturer_id);
create index if not exists idx_articles_category     on articles (category_id);

drop trigger if exists trg_articles_updated_at on articles;
create trigger trg_articles_updated_at
  before update on articles
  for each row execute function set_updated_at();

alter table articles enable row level security;

drop policy if exists "Public can read published articles" on articles;
create policy "Public can read published articles"
  on articles for select
  using (status = 'published');

drop policy if exists "Admins can manage articles" on articles;
create policy "Admins can manage articles"
  on articles for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ----------------------------------------------------------------------------
-- seo_audit_runs — results of the Technical Audit, kept so issues can be
-- compared run to run. Admin-only; never readable by the public site.
-- ----------------------------------------------------------------------------
create table if not exists seo_audit_runs (
  id             uuid primary key default gen_random_uuid(),
  started_at     timestamptz not null default now(),
  finished_at    timestamptz,
  pages_checked  int not null default 0,
  summary        jsonb not null default '{}'::jsonb, -- { checkId: { state, affected } }
  findings       jsonb not null default '[]'::jsonb, -- [{ check, url, detail }]
  triggered_by   uuid references users (id) on delete set null
);

create index if not exists idx_seo_audit_runs_started on seo_audit_runs (started_at desc);

alter table seo_audit_runs enable row level security;

drop policy if exists "Admins can manage audit runs" on seo_audit_runs;
create policy "Admins can manage audit runs"
  on seo_audit_runs for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ----------------------------------------------------------------------------
-- products.image_alt — descriptive alt text for the product photo. Until it
-- is set the site keeps using the product name, as it does today.
-- ----------------------------------------------------------------------------
alter table products add column if not exists image_alt text;

-- ----------------------------------------------------------------------------
-- rfqs — first-touch traffic source of the visit an RFQ came from, captured
-- by the browser (src/lib/trafficSource.js) and stored by api/rfq.js. Lets the
-- SEO Growth Center count RFQs from visits that arrived from a search engine.
-- Only the referring host is kept, never the full referrer URL.
-- ----------------------------------------------------------------------------
alter table rfqs add column if not exists landing_referrer text;
alter table rfqs add column if not exists landing_page     text;
alter table rfqs add column if not exists utm_source       text;
alter table rfqs add column if not exists utm_medium       text;
alter table rfqs add column if not exists utm_campaign     text;

create index if not exists idx_rfqs_landing_referrer on rfqs (landing_referrer);
