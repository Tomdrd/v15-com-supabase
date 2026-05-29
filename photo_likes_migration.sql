-- ═══════════════════════════════════════════════════════════════════════════
--  FOTOS SOBRAL — Migração de likes por foto do álbum
--  Execute no SQL Editor do Supabase
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.album_photo_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id uuid NOT NULL REFERENCES public.album_photos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_album_photo_likes_photo_user ON public.album_photo_likes(photo_id, user_id);
CREATE INDEX IF NOT EXISTS idx_album_photo_likes_photo ON public.album_photo_likes(photo_id);
CREATE INDEX IF NOT EXISTS idx_album_photo_likes_user ON public.album_photo_likes(user_id);

ALTER TABLE public.album_photo_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuário cria própria curtida de foto" ON public.album_photo_likes;
CREATE POLICY "Usuário cria própria curtida de foto"
  ON public.album_photo_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuário exclui própria curtida de foto" ON public.album_photo_likes;
CREATE POLICY "Usuário exclui própria curtida de foto"
  ON public.album_photo_likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuário atualiza própria curtida de foto" ON public.album_photo_likes;
CREATE POLICY "Usuário atualiza própria curtida de foto"
  ON public.album_photo_likes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuário lê suas próprias curtidas" ON public.album_photo_likes;
CREATE POLICY "Usuário lê suas próprias curtidas"
  ON public.album_photo_likes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Dono da foto lê curtidas da própria foto" ON public.album_photo_likes;
CREATE POLICY "Dono da foto lê curtidas da própria foto"
  ON public.album_photo_likes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.album_photos ap
      WHERE ap.id = photo_id
        AND ap.user_id = auth.uid()
    )
  );

ALTER TABLE public.album_photos ADD COLUMN IF NOT EXISTS photo_path text;
