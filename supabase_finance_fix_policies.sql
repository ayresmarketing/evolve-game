-- ================================================================
-- LIFEQUEST — Correção das policies do Supabase do WhatsApp bot
-- Execute no Supabase do BOT (Gastos e Recebimentos)
-- ================================================================
-- O app acessa este banco como "anon" (projeto diferente do login),
-- então as policies precisam permitir o role anon também.

-- Gastos
DROP POLICY IF EXISTS "lifequest_select_gastos" ON "Gastos";
DROP POLICY IF EXISTS "lifequest_insert_gastos" ON "Gastos";
DROP POLICY IF EXISTS "lifequest_update_gastos" ON "Gastos";

CREATE POLICY "lifequest_select_gastos" ON "Gastos"
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "lifequest_insert_gastos" ON "Gastos"
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "lifequest_update_gastos" ON "Gastos"
  FOR UPDATE TO anon, authenticated USING (true);

-- Recebimentos
DROP POLICY IF EXISTS "lifequest_select_recebimentos" ON "Recebimentos";
DROP POLICY IF EXISTS "lifequest_insert_recebimentos" ON "Recebimentos";
DROP POLICY IF EXISTS "lifequest_update_recebimentos" ON "Recebimentos";

CREATE POLICY "lifequest_select_recebimentos" ON "Recebimentos"
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "lifequest_insert_recebimentos" ON "Recebimentos"
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "lifequest_update_recebimentos" ON "Recebimentos"
  FOR UPDATE TO anon, authenticated USING (true);

-- ================================================================
-- PRONTO! Os dados agora aparecem no dashboard.
-- ================================================================
