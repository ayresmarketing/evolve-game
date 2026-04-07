-- ================================================================
-- LIFEQUEST FINANCE INTEGRATION — Execute no Supabase SQL Editor
-- ================================================================

-- 1. Converter categoria_gasto de enum para text
--    (permite qualquer string de categoria vinda do app)
ALTER TABLE "Gastos" ALTER COLUMN categoria_gasto TYPE text USING categoria_gasto::text;

-- 2. Habilitar Row Level Security
ALTER TABLE "Gastos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Recebimentos" ENABLE ROW LEVEL SECURITY;

-- 3. Remover policies antigas (se existirem)
DROP POLICY IF EXISTS "lifequest_select_gastos"      ON "Gastos";
DROP POLICY IF EXISTS "lifequest_insert_gastos"      ON "Gastos";
DROP POLICY IF EXISTS "lifequest_update_gastos"      ON "Gastos";
DROP POLICY IF EXISTS "lifequest_delete_gastos"      ON "Gastos";
DROP POLICY IF EXISTS "lifequest_select_recebimentos" ON "Recebimentos";
DROP POLICY IF EXISTS "lifequest_insert_recebimentos" ON "Recebimentos";
DROP POLICY IF EXISTS "lifequest_update_recebimentos" ON "Recebimentos";
DROP POLICY IF EXISTS "lifequest_delete_recebimentos" ON "Recebimentos";

-- 4. Criar policies — qualquer usuário autenticado pode ler/escrever
--    O filtro por whatsapp é feito pelo app nas queries
CREATE POLICY "lifequest_select_gastos" ON "Gastos"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "lifequest_insert_gastos" ON "Gastos"
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "lifequest_update_gastos" ON "Gastos"
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "lifequest_delete_gastos" ON "Gastos"
  FOR DELETE TO authenticated USING (true);

CREATE POLICY "lifequest_select_recebimentos" ON "Recebimentos"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "lifequest_insert_recebimentos" ON "Recebimentos"
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "lifequest_update_recebimentos" ON "Recebimentos"
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "lifequest_delete_recebimentos" ON "Recebimentos"
  FOR DELETE TO authenticated USING (true);

-- 5. Habilitar Realtime para as duas tabelas
ALTER PUBLICATION supabase_realtime ADD TABLE "Gastos";
ALTER PUBLICATION supabase_realtime ADD TABLE "Recebimentos";

-- ================================================================
-- PRONTO! Volte ao app e configure o número de WhatsApp.
-- ================================================================
