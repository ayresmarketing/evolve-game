-- BLOCO C (SUPABASE DO APP): Realtime dos convites
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'duelo_invites'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'duelo_invites'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.duelo_invites;
  END IF;
END $$;
