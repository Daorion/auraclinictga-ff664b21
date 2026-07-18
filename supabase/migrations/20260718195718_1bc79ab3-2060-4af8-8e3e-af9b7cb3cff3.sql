
CREATE TABLE public.aurora_trainer_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL CHECK (role IN ('user','assistant','system','tool')),
  content TEXT NOT NULL DEFAULT '',
  parts JSONB,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.aurora_trainer_messages (created_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aurora_trainer_messages TO authenticated;
GRANT ALL ON public.aurora_trainer_messages TO service_role;
ALTER TABLE public.aurora_trainer_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage trainer msgs" ON public.aurora_trainer_messages
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.aurora_directives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'instrucao' CHECK (kind IN ('instrucao','promocao','persona','conhecimento')),
  active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.aurora_directives (active, kind);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aurora_directives TO authenticated;
GRANT ALL ON public.aurora_directives TO service_role;
ALTER TABLE public.aurora_directives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage directives" ON public.aurora_directives
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER touch_aurora_directives BEFORE UPDATE ON public.aurora_directives
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.aurora_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  goal TEXT,
  message_template TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','in_progress','done','cancelled')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aurora_campaigns TO authenticated;
GRANT ALL ON public.aurora_campaigns TO service_role;
ALTER TABLE public.aurora_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage campaigns" ON public.aurora_campaigns
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER touch_aurora_campaigns BEFORE UPDATE ON public.aurora_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.aurora_campaign_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.aurora_campaigns(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  contact_name TEXT,
  phone TEXT,
  suggested_message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','sent','skipped','failed')),
  reason TEXT,
  sent_at TIMESTAMPTZ,
  external_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.aurora_campaign_targets (campaign_id, status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aurora_campaign_targets TO authenticated;
GRANT ALL ON public.aurora_campaign_targets TO service_role;
ALTER TABLE public.aurora_campaign_targets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage campaign targets" ON public.aurora_campaign_targets
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
