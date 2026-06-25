// Supabase client using the service role key.
// Service role key bypasses Row Level Security (RLS) — safe for backend use only.
// Never expose this key to the frontend.

const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

module.exports = supabase;
