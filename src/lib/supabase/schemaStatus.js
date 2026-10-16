// Recognises the errors PostgREST returns when a table or column from
// supabase/migrations/20261016_seo_growth_center.sql doesn't exist yet, so the
// UI can show "migration needed" instead of a raw error.
//   PGRST205  table not in schema cache      PGRST204  unknown column (write)
//   42P01     undefined table                42703     undefined column (read)
const MISSING_SCHEMA = new Set(["PGRST205", "PGRST204", "42P01", "42703"]);

export function isMissingSchema(error) {
  return !!error && MISSING_SCHEMA.has(error.code);
}

export const MIGRATION_FILE = "supabase/migrations/20261016_seo_growth_center.sql";
