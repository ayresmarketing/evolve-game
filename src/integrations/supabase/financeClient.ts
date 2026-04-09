import { createClient } from '@supabase/supabase-js';
import { FINANCE_SUPABASE_URL, FINANCE_SUPABASE_ANON_KEY } from '@/config/supabase';

// Cliente para o Supabase do bot financeiro (dados de Gastos/Recebimentos)
export const financeClient = createClient(FINANCE_SUPABASE_URL, FINANCE_SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});
