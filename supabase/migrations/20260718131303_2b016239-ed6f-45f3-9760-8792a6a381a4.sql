ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS human_takeover_until timestamptz;
CREATE INDEX IF NOT EXISTS conversations_human_takeover_idx ON public.conversations(human_takeover_until);