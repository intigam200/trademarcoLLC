-- Reverses 20261016_seo_growth_center.sql.
-- DESTRUCTIVE: drops every article and audit run, and the alt text and
-- traffic-source values recorded since the migration. Export first if needed.

drop index if exists idx_rfqs_landing_referrer;
alter table rfqs drop column if exists utm_campaign;
alter table rfqs drop column if exists utm_medium;
alter table rfqs drop column if exists utm_source;
alter table rfqs drop column if exists landing_page;
alter table rfqs drop column if exists landing_referrer;

alter table products drop column if exists image_alt;

drop table if exists seo_audit_runs;
drop table if exists articles;
