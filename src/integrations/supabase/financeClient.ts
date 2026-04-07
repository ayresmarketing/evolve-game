import { createClient } from '@supabase/supabase-js';

// Supabase client for the WhatsApp financial database
// Env vars override the defaults if set
const FINANCE_URL =
  import.meta.env.VITE_FINANCE_SUPABASE_URL ||
  'https://qlipgighvdzxsllzghgl.supabase.co';

const FINANCE_KEY =
  import.meta.env.VITE_FINANCE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaXBnaWdodmR6eHNsbHpnaGdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3NDg0NzksImV4cCI6MjA2NTMyNDQ3OX0.vwRkW6XX7-VBeLhYqRcUNl15oLqMpW0lZtZa9x_YSkA';

export const financeConfigured = true;
export const financeClient = createClient(FINANCE_URL, FINANCE_KEY);
