-- ═══════════════════════════════════════════════════════════════
--  SOBRAL CULTURAL — Chat por Proximidade (Migration)
--  Execute este script no Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Adicionar campos de localização à tabela profiles ────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS lat          DOUBLE PRECISION;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS lng          DOUBLE PRECISION;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location_active      BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location_updated_at  TIMESTAMPTZ;

-- ── 2. Tabela de conversas (1-a-1 privado) ──────────────────────
CREATE TABLE IF NOT EXISTS chat_conversations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user2_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_text TEXT,
  CONSTRAINT no_self_chat     CHECK (user1_id <> user2_id)
);

-- Garante que não exista duplicata de par (A,B) e (B,A)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_chat_pair
  ON chat_conversations (
    LEAST(user1_id, user2_id),
    GREATEST(user1_id, user2_id)
  );

-- ── 3. Tabela de mensagens ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  text            TEXT NOT NULL CHECK (char_length(text) > 0 AND char_length(text) <= 1000),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  read_at         TIMESTAMPTZ
);

-- Índice para buscas por conversa ordenadas por data
CREATE INDEX IF NOT EXISTS idx_chat_messages_conv_date
  ON chat_messages(conversation_id, created_at);

-- ── 4. RLS — chat_conversations ─────────────────────────────────
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;

-- Um usuário vê apenas conversas em que participa
CREATE POLICY "conv_select" ON chat_conversations
  FOR SELECT USING (
    auth.uid() = user1_id OR auth.uid() = user2_id
  );

-- Qualquer membro autenticado pode criar uma conversa (com outro usuário)
CREATE POLICY "conv_insert" ON chat_conversations
  FOR INSERT WITH CHECK (
    auth.uid() = user1_id OR auth.uid() = user2_id
  );

-- Apenas participantes podem atualizar (last_message_at, last_message_text)
CREATE POLICY "conv_update" ON chat_conversations
  FOR UPDATE USING (
    auth.uid() = user1_id OR auth.uid() = user2_id
  );

-- ── 5. RLS — chat_messages ───────────────────────────────────────
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Só vê mensagens de conversas em que participa
CREATE POLICY "msg_select" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_conversations c
      WHERE c.id = conversation_id
        AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
  );

-- Função de rate limit: máximo 20 mensagens por minuto por usuário
CREATE OR REPLACE FUNCTION check_msg_rate_limit()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT COUNT(*) < 20
    FROM chat_messages
    WHERE sender_id = auth.uid()
      AND created_at > NOW() - INTERVAL '1 minute'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Só envia mensagens em conversas que participa + rate limit
DROP POLICY IF EXISTS "msg_insert" ON chat_messages;
CREATE POLICY "msg_insert" ON chat_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM chat_conversations c
      WHERE c.id = conversation_id
        AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
    AND check_msg_rate_limit()
  );

-- ── 6. RLS — profiles (localização) ────────────────────────────
-- Permite que usuários autenticados vejam lat/lng de quem tem location_active = true
-- (já deve existir a policy de SELECT; esta complementa apenas se necessário)
-- Se a sua tabela profiles já tem RLS aberta para SELECT, pule este bloco.

-- DROP POLICY IF EXISTS "profiles_location_select" ON profiles;
-- CREATE POLICY "profiles_location_select" ON profiles
--   FOR SELECT USING (location_active = true OR auth.uid() = id);

-- Permite que o próprio usuário atualize sua localização
DROP POLICY IF EXISTS "profiles_update_location" ON profiles;
CREATE POLICY "profiles_update_location" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ── 7. Habilitar Realtime nas tabelas de chat ───────────────────
-- Execute no Supabase Dashboard → Database → Replication → Tables
-- Ou via SQL (requer extensão pg_publication):
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_conversations;

-- ── 8. Auto-delete: mensagens expiram em 24 horas ───────────────
-- Função que apaga mensagens com mais de 24h e conversas vazias
CREATE OR REPLACE FUNCTION cleanup_expired_messages()
RETURNS void AS $$
BEGIN
  -- Deleta mensagens com mais de 24 horas
  DELETE FROM chat_messages
  WHERE created_at < NOW() - INTERVAL '24 hours';

  -- Deleta conversas que ficaram sem mensagens e sem atividade há 24h
  DELETE FROM chat_conversations
  WHERE last_message_at < NOW() - INTERVAL '24 hours'
    AND NOT EXISTS (
      SELECT 1 FROM chat_messages m WHERE m.conversation_id = chat_conversations.id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Habilita pg_cron (disponível no Supabase Pro+)
-- Se não tiver pg_cron, rode manualmente ou via Edge Function agendada
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Agenda limpeza a cada hora
SELECT cron.schedule(
  'cleanup-chat-24h',       -- nome do job
  '0 * * * *',              -- a cada hora cheia
  'SELECT cleanup_expired_messages()'
);

-- ── 9. Sistema de Denúncia e Bloqueio ────────────────────────────

-- Tabela de Bloqueios
CREATE TABLE IF NOT EXISTS chat_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

ALTER TABLE chat_blocks ENABLE ROW LEVEL SECURITY;

-- Usuário vê apenas quem ele bloqueou ou quem o bloqueou (para ocultar na UI)
CREATE POLICY "blocks_select" ON chat_blocks
  FOR SELECT USING (
    auth.uid() = blocker_id OR auth.uid() = blocked_id
  );

-- O usuário só pode inserir um bloqueio onde ele é o blocker
CREATE POLICY "blocks_insert" ON chat_blocks
  FOR INSERT WITH CHECK (auth.uid() = blocker_id);

-- O usuário pode desfazer seus próprios bloqueios
CREATE POLICY "blocks_delete" ON chat_blocks
  FOR DELETE USING (auth.uid() = blocker_id);


-- Tabela de Denúncias
CREATE TABLE IF NOT EXISTS chat_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reported_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE chat_reports ENABLE ROW LEVEL SECURITY;

-- Qualquer membro pode criar uma denúncia em seu próprio nome
CREATE POLICY "reports_insert" ON chat_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Opcional: Apenas admin vê todas as denúncias, ou o próprio denunciante vê as suas
CREATE POLICY "reports_select" ON chat_reports
  FOR SELECT USING (auth.uid() = reporter_id);
