-- SUPABASE DO APP: OTP via SMS para validacao de telefone no signup

CREATE TABLE IF NOT EXISTS public.phone_verification_codes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_e164   text NOT NULL,
  code         text NOT NULL,
  expires_at   timestamptz NOT NULL,
  consumed_at  timestamptz,
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_phone_codes_phone_created
  ON public.phone_verification_codes (phone_e164, created_at DESC);
