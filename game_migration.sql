-- ═══════════════════════════════════════════════════════════
--  QUIZ SOBRAL — Migração do banco de dados
--  Execute no SQL Editor do Supabase
-- ═══════════════════════════════════════════════════════════

-- 1. Tabela de pontuações
CREATE TABLE IF NOT EXISTS public.game_scores (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score      integer NOT NULL DEFAULT 0,
  correct    integer NOT NULL DEFAULT 0,
  total      integer NOT NULL DEFAULT 0,
  cat        text NOT NULL DEFAULT 'all',  -- 'all' | 'hist' | 'cult' | 'pers' | 'geo'
  played_at  timestamptz NOT NULL DEFAULT now()
);

-- 2. Índices para performance no ranking
CREATE INDEX IF NOT EXISTS idx_game_scores_score    ON public.game_scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_game_scores_user     ON public.game_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_game_scores_played   ON public.game_scores(played_at DESC);

-- 3. Row Level Security
ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;

-- Qualquer usuário autenticado pode inserir sua própria pontuação
CREATE POLICY "Usuário insere própria pontuação"
  ON public.game_scores FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Qualquer um pode ler o ranking (inclusive visitantes)
CREATE POLICY "Leitura pública do ranking"
  ON public.game_scores FOR SELECT
  TO anon, authenticated
  USING (true);

-- ═══════════════════════════════════════════════════════════
-- OPCIONAL: view de melhores pontuações por usuário
-- (útil para rankig "melhor de cada jogador")
-- ═══════════════════════════════════════════════════════════
CREATE OR REPLACE VIEW public.ranking_top AS
SELECT DISTINCT ON (gs.user_id)
  gs.user_id,
  gs.score,
  gs.correct,
  gs.total,
  gs.cat,
  gs.played_at,
  p.username,
  p.avatar_url
FROM public.game_scores gs
LEFT JOIN public.profiles p ON p.id = gs.user_id
ORDER BY gs.user_id, gs.score DESC;

-- View de ranking global (top 50)
CREATE OR REPLACE VIEW public.ranking_global AS
SELECT
  row_number() OVER (ORDER BY score DESC) AS posicao,
  user_id,
  score,
  correct,
  total,
  cat,
  played_at,
  username,
  avatar_url
FROM public.ranking_top
ORDER BY score DESC
LIMIT 50;
