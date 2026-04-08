-- ================================================================
-- SUPABASE DO APP (login/perfil/duelo)
-- Rode este SQL no projeto Supabase principal do app
-- ================================================================

-- 1) user_whatsapp_config com duas colunas de telefone:
--    - whatsapp_phone_raw: exatamente como usuário digitou
--    - whatsapp_phone_normalized: só números (formato usado pelo app)
CREATE TABLE IF NOT EXISTS public.user_whatsapp_config (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  whatsapp_phone          text, -- compat legado
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now()
);

-- Migração segura para quem já tinha tabela antiga
ALTER TABLE public.user_whatsapp_config
  ADD COLUMN IF NOT EXISTS whatsapp_phone_raw text;

ALTER TABLE public.user_whatsapp_config
  ADD COLUMN IF NOT EXISTS whatsapp_phone_normalized text;

-- Backfill da coluna normalizada a partir do legado/raw
UPDATE public.user_whatsapp_config
SET whatsapp_phone_normalized =
  regexp_replace(COALESCE(whatsapp_phone_normalized, whatsapp_phone_raw, whatsapp_phone, ''), '\D', '', 'g')
WHERE whatsapp_phone_normalized IS NULL OR whatsapp_phone_normalized = '';

ALTER TABLE public.user_whatsapp_config
  ALTER COLUMN whatsapp_phone_normalized SET NOT NULL;

ALTER TABLE public.user_whatsapp_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "whatsapp_config_own" ON public.user_whatsapp_config;
CREATE POLICY "whatsapp_config_own" ON public.user_whatsapp_config
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Índice para lookup rápido pelo número normalizado
CREATE INDEX IF NOT EXISTS idx_user_whatsapp_normalized
  ON public.user_whatsapp_config (whatsapp_phone_normalized);

-- 2) Convites de duelo no app (chegam no próprio app)
CREATE TABLE IF NOT EXISTS public.duelo_invites (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  duelo_name    text NOT NULL,
  inviter_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  inviter_email text NOT NULL,
  invitee_email text NOT NULL,
  status        text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE public.duelo_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "duelo_invites_select" ON public.duelo_invites;
DROP POLICY IF EXISTS "duelo_invites_insert" ON public.duelo_invites;
DROP POLICY IF EXISTS "duelo_invites_update" ON public.duelo_invites;

CREATE POLICY "duelo_invites_select" ON public.duelo_invites
  FOR SELECT TO authenticated
  USING (
    lower(invitee_email) = lower((auth.jwt() ->> 'email'))
    OR inviter_id = auth.uid()
  );

CREATE POLICY "duelo_invites_insert" ON public.duelo_invites
  FOR INSERT TO authenticated
  WITH CHECK (inviter_id = auth.uid());

CREATE POLICY "duelo_invites_update" ON public.duelo_invites
  FOR UPDATE TO authenticated
  USING (lower(invitee_email) = lower((auth.jwt() ->> 'email')))
  WITH CHECK (lower(invitee_email) = lower((auth.jwt() ->> 'email')));

-- 3) Realtime para convite chegar no app sem refresh (idempotente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'duelo_invites'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.duelo_invites;
  END IF;
END $$;

-- ================================================================
-- FIM
-- ================================================================