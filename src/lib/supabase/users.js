import { supabase } from "./client";

// Every row here corresponds to a Supabase Auth account you created
// yourself (see supabase/schema.sql's handle_new_auth_user trigger) — there
// is no public sign-up route, so this list is inherently "all staff".
export async function listUsers() {
  const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
