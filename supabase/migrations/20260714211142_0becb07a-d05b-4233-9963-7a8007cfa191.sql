
-- ============= CONTACTS =============
CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL UNIQUE,
  name TEXT,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  origin TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  landing_page TEXT,
  consent_marketing BOOLEAN NOT NULL DEFAULT false,
  consent_at TIMESTAMPTZ,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contacts TO authenticated;
GRANT ALL ON public.contacts TO service_role;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin full access contacts" ON public.contacts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER touch_contacts BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============= CONVERSATIONS =============
CREATE TYPE public.conv_stage AS ENUM (
  'novo_contato','em_qualificacao','interessado','aguardando_resposta',
  'solicitou_horario','agendado','confirmado','em_atendimento',
  'cliente_recorrente','encerrado'
);
CREATE TYPE public.conv_assignee AS ENUM ('aurora','sirlei');

CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  stage conv_stage NOT NULL DEFAULT 'novo_contato',
  assigned_to conv_assignee NOT NULL DEFAULT 'aurora',
  assigned_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ai_enabled BOOLEAN NOT NULL DEFAULT true,
  interest TEXT,
  internal_notes TEXT,
  unread_count INT NOT NULL DEFAULT 0,
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  external_session TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX conversations_contact_idx ON public.conversations(contact_id);
CREATE INDEX conversations_last_msg_idx ON public.conversations(last_message_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin full access conversations" ON public.conversations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER touch_conversations BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============= MESSAGES (extend) =============
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS author TEXT NOT NULL DEFAULT 'system',
  ADD COLUMN IF NOT EXISTS author_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS msg_type TEXT NOT NULL DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS is_draft BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS error TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS messages_external_id_uidx
  ON public.messages(external_id) WHERE external_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS messages_conversation_idx
  ON public.messages(conversation_id, created_at);

-- ============= PROCEDURES PRICING =============
CREATE TABLE public.procedures_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  pricing_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  display_order INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.procedures_pricing TO authenticated;
GRANT ALL ON public.procedures_pricing TO service_role;
ALTER TABLE public.procedures_pricing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin full access procedures_pricing" ON public.procedures_pricing FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER touch_procedures_pricing BEFORE UPDATE ON public.procedures_pricing
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Seed pricing
INSERT INTO public.procedures_pricing (slug, name, pricing_json, display_order) VALUES
('massagem_relaxante','Massagem Relaxante',
  '[{"label":"Novo cliente","price_cents":18000},{"label":"Cliente recorrente","price_cents":15000},{"label":"Pacote 3-9 sessões (por sessão)","price_cents":10000},{"label":"Acima de 9 sessões (por sessão)","price_cents":9000}]'::jsonb, 1),
('drenagem_linfatica','Drenagem Linfática',
  '[{"label":"Sessão avulsa","price_cents":13000},{"label":"Pacote 4 sessões","price_cents":40000}]'::jsonb, 2),
('limpeza_de_pele','Limpeza de Pele',
  '[{"label":"Novo cliente","price_cents":18000},{"label":"Cliente recorrente","price_cents":15000}]'::jsonb, 3),
('eletroterapia','Eletroterapia',
  '[{"label":"Mensal (16 sessões, 2x/semana)","price_cents":45000}]'::jsonb, 4),
('drenomodeladora','Drenomodeladora',
  '[{"label":"Pacote 4 sessões","price_cents":40000}]'::jsonb, 5),
('combo_eletro_dreno','Combo Eletroterapia + Drenomodeladora',
  '[{"label":"Mensal (protocolo após avaliação)","price_cents":65000}]'::jsonb, 6);

-- ============= AI SETTINGS =============
CREATE TABLE public.ai_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'revisar' CHECK (mode IN ('automatico','revisar','desativado')),
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_settings TO authenticated;
GRANT ALL ON public.ai_settings TO service_role;
ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin full access ai_settings" ON public.ai_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER touch_ai_settings BEFORE UPDATE ON public.ai_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.ai_settings (action_key, label, mode) VALUES
('whatsapp_auto_reply','Resposta automática no WhatsApp','revisar'),
('conversation_summary','Resumo automático de conversas','automatico'),
('stage_classification','Classificação de etapa comercial','automatico'),
('next_action_suggestion','Sugestão de próxima ação','automatico'),
('followup_generation','Geração de follow-ups','revisar'),
('reply_suggestion','Sugestão de resposta para a Sirlei','automatico');

-- ============= WHATSAPP SESSIONS =============
CREATE TABLE public.whatsapp_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_name TEXT NOT NULL UNIQUE DEFAULT 'default',
  status TEXT NOT NULL DEFAULT 'disconnected',
  phone_number TEXT,
  last_qr_at TIMESTAMPTZ,
  last_status_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_error TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_sessions TO authenticated;
GRANT ALL ON public.whatsapp_sessions TO service_role;
ALTER TABLE public.whatsapp_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin full access whatsapp_sessions" ON public.whatsapp_sessions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER touch_whatsapp_sessions BEFORE UPDATE ON public.whatsapp_sessions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.whatsapp_sessions (session_name, status) VALUES ('default','disconnected');

-- ============= AUDIT LOG =============
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email TEXT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX audit_log_created_idx ON public.audit_log(created_at DESC);
GRANT SELECT, INSERT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin read audit_log" ON public.audit_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "authenticated insert audit_log" ON public.audit_log FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = actor_user_id OR public.has_role(auth.uid(),'admin'));

-- ============= REALTIME =============
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER TABLE public.conversations REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
