-- ═══════════════════════════════════════════════════════════════════════════
--  FOTOS SOBRAL — Migração do banco de dados
--  Execute no SQL Editor do Supabase
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Tabela de fotos verificadas por usuário para pontos turísticos
CREATE TABLE IF NOT EXISTS public.album_photos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  spot_id     uuid NOT NULL,
  photo_url   text NOT NULL,
  photo_lat   numeric(10,7) NOT NULL,
  photo_lng   numeric(10,7) NOT NULL,
  status      text NOT NULL DEFAULT 'verified',
  verified_at timestamptz NOT NULL DEFAULT now(),
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 2. Índice único para evitar duplicação de foto por usuário/spot
CREATE UNIQUE INDEX IF NOT EXISTS idx_album_photos_user_spot ON public.album_photos(user_id, spot_id);

-- 3. Índices de busca
CREATE INDEX IF NOT EXISTS idx_album_photos_user ON public.album_photos(user_id);
CREATE INDEX IF NOT EXISTS idx_album_photos_spot ON public.album_photos(spot_id);

-- 4. Row Level Security
ALTER TABLE public.album_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário cria própria foto"
  ON public.album_photos FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuário atualiza própria foto"
  ON public.album_photos FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuário lê suas próprias fotos"
  ON public.album_photos FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Usuário exclui sua própria foto"
  ON public.album_photos FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 5. Permitir leitura pública apenas de fotos aprovadas
CREATE POLICY "Leitura pública de fotos verificadas"
  ON public.album_photos FOR SELECT
  TO anon
  USING (status = 'verified');

-- 6. Opcional: view de fotos do usuário com informações do ponto turístico
CREATE OR REPLACE VIEW public.view_album_photos AS
SELECT
  ap.id,
  ap.user_id,
  ap.spot_id,
  ap.photo_url,
  ap.photo_lat,
  ap.photo_lng,
  ap.status,
  ap.verified_at,
  ap.created_at,
  s.name AS spot_name,
  s.cat AS spot_cat,
  s.photo AS spot_photo
FROM public.album_photos ap
LEFT JOIN public.spots s ON s.id = ap.spot_id;
