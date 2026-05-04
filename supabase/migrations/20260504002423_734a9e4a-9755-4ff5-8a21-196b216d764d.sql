CREATE TABLE public.saved_design_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID,
  name TEXT NOT NULL,
  tokens JSONB NOT NULL,
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_design_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "design_tokens_admin_all"
ON public.saved_design_tokens
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_saved_design_tokens_fav ON public.saved_design_tokens(is_favorite, created_at DESC);

CREATE TRIGGER trg_saved_design_tokens_updated
BEFORE UPDATE ON public.saved_design_tokens
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();