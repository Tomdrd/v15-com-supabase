-- ═══════════════════════════════════════════════════════════════════════
--  SOBRAL CULTURAL — Amizades / Solicitações de Amizade
--  Execute este script no Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT no_self_request CHECK (sender_id <> receiver_id),
  CONSTRAINT unique_friend_request UNIQUE (sender_id, receiver_id)
);

CREATE INDEX IF NOT EXISTS idx_friend_requests_sender ON public.friend_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver ON public.friend_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON public.friend_requests(status);

ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "friend_requests_select" ON public.friend_requests
  FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
  );

CREATE POLICY "friend_requests_insert" ON public.friend_requests
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
  );

DROP POLICY IF EXISTS "friend_requests_update" ON public.friend_requests;
CREATE POLICY "friend_requests_update" ON public.friend_requests
  FOR UPDATE USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
  ) WITH CHECK (
    (
      auth.uid() = sender_id
      AND status = 'pending'
    )
    OR
    (
      auth.uid() = receiver_id
      AND status IN ('pending', 'accepted', 'rejected')
    )
  );

DROP POLICY IF EXISTS "friend_requests_delete" ON public.friend_requests;
CREATE POLICY "friend_requests_delete" ON public.friend_requests
  FOR DELETE USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
  );
