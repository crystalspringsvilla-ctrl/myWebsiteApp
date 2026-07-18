const { createClient } = require('@supabase/supabase-js');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.warn('[supabase] SUPABASE_URL / SUPABASE_SERVICE_KEY are not set yet — availability & bookings will fail until they are.');
}

// IMPORTANT: this uses the service_role key, which bypasses Row Level Security.
// It must only ever be used on the server, never sent to the browser.
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || '',
  { auth: { persistSession: false } }
);

module.exports = supabase;
