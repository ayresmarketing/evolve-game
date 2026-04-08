-- BLOCO A (SUPABASE DO APP): WhatsApp por conta
CREATE TABLE IF NOT EXISTS public.user_whatsapp_config (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  whatsapp_phone          text,
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now()
);

ALTER TABLE public.user_whatsapp_config
  ADD COLUMN IF NOT EXISTS whatsapp_phone_raw text;

ALTER TABLE public.user_whatsapp_config
  ADD COLUMN IF NOT EXISTS whatsapp_phone_normalized text;

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

CREATE INDEX IF NOT EXISTS idx_user_whatsapp_normalized
  ON public.user_whatsapp_config (whatsapp_phone_normalized);
