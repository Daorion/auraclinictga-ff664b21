ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS needs_review boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS review_reason text,
  ADD COLUMN IF NOT EXISTS review_requested_at timestamptz;
CREATE INDEX IF NOT EXISTS idx_conversations_needs_review ON public.conversations(needs_review) WHERE needs_review = true;