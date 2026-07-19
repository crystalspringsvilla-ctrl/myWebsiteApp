const { createClient } = require('@supabase/supabase-js');

function createFallbackQuery(errorMessage) {
  return {
    insert() { return this; },
    update() { return this; },
    select() { return this; },
    eq() { return this; },
    in() {
      return Promise.resolve({ data: null, error: { message: errorMessage } });
    },
    single() {
      return Promise.resolve({ data: null, error: { message: errorMessage } });
    },
  };
}

function createFallbackSupabase() {
  const errorMessage = 'Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_KEY to enable bookings.';
  return {
    from() {
      return createFallbackQuery(errorMessage);
    },
  };
}

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.warn('[supabase] SUPABASE_URL / SUPABASE_SERVICE_KEY are not set yet — availability & bookings will run in fallback mode until they are.');
}

// IMPORTANT: this uses the service_role key, which bypasses Row Level Security.
// It must only ever be used on the server, never sent to the browser.
const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY
  ? createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY,
      { auth: { persistSession: false } }
    )
  : createFallbackSupabase();

module.exports = supabase;
