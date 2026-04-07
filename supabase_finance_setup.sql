-- ================================================================
-- LIFEQUEST FINANCE INTEGRATION — Execute no Supabase SQL Editor
-- ================================================================

-- 1. Converter categoria_gasto de enum para text
--    (permite qualquer string de categoria vinda do app)
ALTER TABLE "Gastos" ALTER COLUMN categoria_gasto TYPE text USING categoria_gasto::text;

-- 2. Habilitar Row Level Security
ALTER TABLE "Gastos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Recebimentos" ENABLE ROW LEVEL SECURITY;

-- 3. Criar policies (apenas as que ainda não existem)
--    Somente SELECT, INSERT e UPDATE — sem DELETE
CREATE POLICY IF NOT EXISTS "lifequest_select_gastos" ON "Gastos"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY IF NOT EXISTS "lifequest_insert_gastos" ON "Gastos"
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "lifequest_update_gastos" ON "Gastos"
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY IF NOT EXISTS "lifequest_select_recebimentos" ON "Recebimentos"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY IF NOT EXISTS "lifequest_insert_recebimentos" ON "Recebimentos"
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "lifequest_update_recebimentos" ON "Recebimentos"
  FOR UPDATE TO authenticated USING (true);

-- 4. Habilitar Realtime para as duas tabelas
ALTER PUBLICATION supabase_realtime ADD TABLE "Gastos";
ALTER PUBLICATION supabase_realtime ADD TABLE "Recebimentos";

-- ================================================================
-- PRONTO! Volte ao app e configure o número de WhatsApp.
-- ================================================================
