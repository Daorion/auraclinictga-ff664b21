ALTER TABLE public.saved_design_tokens
ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'design';

CREATE INDEX IF NOT EXISTS idx_saved_design_tokens_kind_fav_created
ON public.saved_design_tokens (kind, is_favorite DESC, created_at DESC);