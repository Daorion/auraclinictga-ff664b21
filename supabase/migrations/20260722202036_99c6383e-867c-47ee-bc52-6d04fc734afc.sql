
CREATE TABLE public.contact_insights (
  contact_id uuid PRIMARY KEY REFERENCES public.contacts(id) ON DELETE CASCADE,
  stage text,
  interest text,
  objections text[] DEFAULT '{}'::text[],
  next_action text,
  opportunity_score int CHECK (opportunity_score BETWEEN 0 AND 100),
  summary text,
  alerts text[] DEFAULT '{}'::text[],
  last_message_at timestamptz,
  last_analyzed_at timestamptz NOT NULL DEFAULT now(),
  message_count_at_analysis int DEFAULT 0,
  raw jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_insights TO authenticated;
GRANT ALL ON public.contact_insights TO service_role;

ALTER TABLE public.contact_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage contact_insights"
  ON public.contact_insights FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_contact_insights_touch
  BEFORE UPDATE ON public.contact_insights
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX contact_insights_score_idx ON public.contact_insights (opportunity_score DESC NULLS LAST);
CREATE INDEX contact_insights_stage_idx ON public.contact_insights (stage);
CREATE INDEX contact_insights_last_analyzed_idx ON public.contact_insights (last_analyzed_at DESC);
