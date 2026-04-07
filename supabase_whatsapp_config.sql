-- ================================================================
-- LIFEQUEST — Tabela de configuração de WhatsApp por usuário
-- Execute no Supabase do APP (o mesmo que gerencia o login)
-- ================================================================

-- Tabela que salva o número de WhatsApp de cada usuário logado
CREATE TABLE IF NOT EXISTS public.user_whatsapp_config (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  whatsapp_phone text NOT NULL,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.user_whatsapp_config ENABLE ROW LEVEL SECURITY;

-- Cada usuário só vê e edita o próprio registro
CREATE POLICY "whatsapp_config_own" ON public.user_whatsapp_config
  FOR ALL TO authenticated
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ================================================================
-- PRONTO! Agora cada usuário pode salvar seu número pelo app.
-- ================================================================
