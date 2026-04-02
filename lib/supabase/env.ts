const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || null;
const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() || null;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || null;

function readSupabaseKey() {
  return SUPABASE_PUBLISHABLE_KEY ?? SUPABASE_ANON_KEY;
}

export function hasSupabaseEnv() {
  return Boolean(SUPABASE_URL && readSupabaseKey());
}

export function getSupabaseEnv() {
  const url = SUPABASE_URL;
  const publishableKey = readSupabaseKey();

  if (!url || !publishableKey) {
    throw new Error(
      "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY).",
    );
  }

  return { url, publishableKey };
}
