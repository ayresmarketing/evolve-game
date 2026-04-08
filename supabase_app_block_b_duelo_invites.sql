-- BLOCO B (SUPABASE DO APP): Convites de duelo
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
