import { createClient } from '@supabase/supabase-js';

// Second Supabase client — points to the WhatsApp financial database
// Add these two variables to your .env file:
//   VITE_FINANCE_SUPABASE_URL=https://xxxx.supabase.co
//   VITE_FINANCE_SUPABASE_ANON_KEY=eyJ...

const FINANCE_URL = import.meta.env.VITE_FINANCE_SUPABASE_URL;
const FINANCE_KEY = import.meta.env.VITE_FINANCE_SUPABASE_ANON_KEY;

export const financeConfigured = !!(FINANCE_URL && FINANCE_KEY);

export const financeClient = financeConfigured
  ? createClient(FINANCE_URL, FINANCE_KEY)
  : null;
