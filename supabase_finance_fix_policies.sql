-- ================================================================
-- LIFEQUEST — Adicionar policies de DELETE + garantir UPDATE/INSERT
-- Execute no Supabase do BOT (Gastos e Recebimentos)
-- ================================================================

-- Gastos
DROP POLICY IF EXISTS "lifequest_select_gastos"  ON "Gastos";
DROP POLICY IF EXISTS "lifequest_insert_gastos"  ON "Gastos";
DROP POLICY IF EXISTS "lifequest_update_gastos"  ON "Gastos";
DROP POLICY IF EXISTS "lifequest_delete_gastos"  ON "Gastos";

CREATE POLICY "lifequest_select_gastos" ON "Gastos"
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "lifequest_insert_gastos" ON "Gastos"
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "lifequest_update_gastos" ON "Gastos"
  FOR UPDATE TO anon, authenticated USING (true);

CREATE POLICY "lifequest_delete_gastos" ON "Gastos"
  FOR DELETE TO anon, authenticated USING (true);

-- Recebimentos
DROP POLICY IF EXISTS "lifequest_select_recebimentos" ON "Recebimentos";
DROP POLICY IF EXISTS "lifequest_insert_recebimentos" ON "Recebimentos";
DROP POLICY IF EXISTS "lifequest_update_recebimentos" ON "Recebimentos";
DROP POLICY IF EXISTS "lifequest_delete_recebimentos" ON "Recebimentos";

CREATE POLICY "lifequest_select_recebimentos" ON "Recebimentos"
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "lifequest_insert_recebimentos" ON "Recebimentos"
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "lifequest_update_recebimentos" ON "Recebimentos"
  FOR UPDATE TO anon, authenticated USING (true);

CREATE POLICY "lifequest_delete_recebimentos" ON "Recebimentos"
  FOR DELETE TO anon, authenticated USING (true);

-- ================================================================
-- PRONTO! Editar e excluir agora funcionam pelo dashboard.
-- ================================================================
