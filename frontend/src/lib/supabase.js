import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function testConnection() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const response = await fetch(`${url}/auth/v1/health`, {
    headers: { apikey: key },
  });

  if (!response.ok) throw new Error(`Supabase returned HTTP ${response.status}`);
  return new Date().toISOString();
}
