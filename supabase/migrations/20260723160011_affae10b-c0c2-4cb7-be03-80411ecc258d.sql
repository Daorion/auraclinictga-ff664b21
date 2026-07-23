
CREATE TABLE IF NOT EXISTS public.ai_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt_tokens INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  contact_id UUID NULL,
  conversation_id UUID NULL,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_log_created_at ON public.ai_usage_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_log_function ON public.ai_usage_log(function_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_log_model ON public.ai_usage_log(model, created_at DESC);

GRANT SELECT ON public.ai_usage_log TO authenticated;
GRANT ALL ON public.ai_usage_log TO service_role;

ALTER TABLE public.ai_usage_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view AI usage log"
ON public.ai_usage_log
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
