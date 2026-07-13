
-- PROFESSIONALS (first, so helper function can reference it)
CREATE TABLE public.professionals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  title text,
  bio text,
  photo_url text,
  whatsapp_phone text,
  email text,
  commission_percent numeric(5,2) NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.professionals TO authenticated;
GRANT SELECT ON public.professionals TO anon;
GRANT ALL ON public.professionals TO service_role;
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "professionals_public_read" ON public.professionals FOR SELECT TO anon, authenticated USING (active = true OR has_role(auth.uid(), 'admin'));
CREATE POLICY "professionals_admin_all" ON public.professionals FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "professionals_own_update" ON public.professionals FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER touch_professionals BEFORE UPDATE ON public.professionals FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.is_own_professional(_professional_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.professionals WHERE id = _professional_id AND user_id = auth.uid())
$$;

ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS price_cents bigint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS duration_minutes integer DEFAULT 60;

CREATE TABLE public.professional_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  price_cents bigint,
  commission_percent numeric(5,2),
  duration_minutes integer,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (professional_id, service_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.professional_services TO authenticated;
GRANT SELECT ON public.professional_services TO anon;
GRANT ALL ON public.professional_services TO service_role;
ALTER TABLE public.professional_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prof_services_read_all" ON public.professional_services FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "prof_services_admin_all" ON public.professional_services FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE TRIGGER touch_prof_services BEFORE UPDATE ON public.professional_services FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rooms TO authenticated;
GRANT ALL ON public.rooms TO service_role;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rooms_auth_read" ON public.rooms FOR SELECT TO authenticated USING (true);
CREATE POLICY "rooms_admin_write" ON public.rooms FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE TRIGGER touch_rooms BEFORE UPDATE ON public.rooms FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  whatsapp_phone text,
  email text,
  birth_date date,
  cpf text,
  address text,
  city text,
  state text,
  notes text,
  tags text[] DEFAULT '{}',
  active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_clients_name ON public.clients USING gin(to_tsvector('portuguese', name));
CREATE INDEX idx_clients_phone ON public.clients(phone);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated;
GRANT ALL ON public.clients TO service_role;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clients_admin_all" ON public.clients FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE TRIGGER touch_clients BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.client_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  professional_id uuid REFERENCES public.professionals(id) ON DELETE SET NULL,
  note_type text NOT NULL DEFAULT 'evolucao',
  content text NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_notes TO authenticated;
GRANT ALL ON public.client_notes TO service_role;
ALTER TABLE public.client_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "client_notes_admin_all" ON public.client_notes FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "client_notes_prof_own" ON public.client_notes FOR ALL TO authenticated
  USING (professional_id IS NOT NULL AND public.is_own_professional(professional_id))
  WITH CHECK (professional_id IS NOT NULL AND public.is_own_professional(professional_id));
CREATE TRIGGER touch_client_notes BEFORE UPDATE ON public.client_notes FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.client_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  professional_id uuid REFERENCES public.professionals(id) ON DELETE SET NULL,
  photo_url text NOT NULL,
  storage_path text,
  label text,
  taken_at date DEFAULT CURRENT_DATE,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_photos TO authenticated;
GRANT ALL ON public.client_photos TO service_role;
ALTER TABLE public.client_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "client_photos_admin_all" ON public.client_photos FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "client_photos_prof_own" ON public.client_photos FOR ALL TO authenticated
  USING (professional_id IS NOT NULL AND public.is_own_professional(professional_id))
  WITH CHECK (professional_id IS NOT NULL AND public.is_own_professional(professional_id));
CREATE TRIGGER touch_client_photos BEFORE UPDATE ON public.client_photos FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE RESTRICT,
  service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  service_name text NOT NULL,
  room_id uuid REFERENCES public.rooms(id) ON DELETE SET NULL,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'agendado',
  price_cents bigint NOT NULL DEFAULT 0,
  commission_percent numeric(5,2),
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_at > start_at)
);
CREATE INDEX idx_appointments_start ON public.appointments(start_at);
CREATE INDEX idx_appointments_professional ON public.appointments(professional_id, start_at);
CREATE INDEX idx_appointments_client ON public.appointments(client_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "appointments_admin_all" ON public.appointments FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "appointments_prof_read_own" ON public.appointments FOR SELECT TO authenticated USING (public.is_own_professional(professional_id));
CREATE POLICY "appointments_prof_update_own" ON public.appointments FOR UPDATE TO authenticated USING (public.is_own_professional(professional_id)) WITH CHECK (public.is_own_professional(professional_id));
CREATE TRIGGER touch_appointments BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- policy: professional sees clients who have an appointment with him
CREATE POLICY "clients_prof_read_own" ON public.clients FOR SELECT TO authenticated USING (
  has_role(auth.uid(), 'profissional') AND EXISTS (
    SELECT 1 FROM public.appointments a
    JOIN public.professionals p ON p.id = a.professional_id
    WHERE a.client_id = clients.id AND p.user_id = auth.uid()
  )
);

CREATE OR REPLACE FUNCTION public.check_appointment_conflict()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IN ('cancelado','faltou') THEN RETURN NEW; END IF;
  IF EXISTS (
    SELECT 1 FROM public.appointments
    WHERE professional_id = NEW.professional_id AND id <> NEW.id
      AND status NOT IN ('cancelado','faltou')
      AND tstzrange(start_at, end_at, '[)') && tstzrange(NEW.start_at, NEW.end_at, '[)')
  ) THEN RAISE EXCEPTION 'Conflito de horário: já existe atendimento para esta profissional neste intervalo';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_appointment_conflict BEFORE INSERT OR UPDATE OF start_at, end_at, professional_id, status ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.check_appointment_conflict();

CREATE TABLE public.appointment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  from_status text,
  to_status text NOT NULL,
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_at timestamptz NOT NULL DEFAULT now(),
  note text
);
GRANT SELECT, INSERT ON public.appointment_history TO authenticated;
GRANT ALL ON public.appointment_history TO service_role;
ALTER TABLE public.appointment_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "appt_history_admin_read" ON public.appointment_history FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "appt_history_insert_auth" ON public.appointment_history FOR INSERT TO authenticated WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.log_appointment_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.appointment_history(appointment_id, from_status, to_status, changed_by)
    VALUES (NEW.id, CASE WHEN TG_OP='INSERT' THEN NULL ELSE OLD.status END, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_log_appt_status AFTER INSERT OR UPDATE OF status ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.log_appointment_status_change();

CREATE TABLE public.payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_methods TO authenticated;
GRANT ALL ON public.payment_methods TO service_role;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pm_auth_read" ON public.payment_methods FOR SELECT TO authenticated USING (true);
CREATE POLICY "pm_admin_write" ON public.payment_methods FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE TRIGGER touch_pm BEFORE UPDATE ON public.payment_methods FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.payment_methods(name, slug, display_order) VALUES
  ('Dinheiro','dinheiro',1),('Pix','pix',2),('Débito','debito',3),
  ('Crédito à vista','credito-avista',4),('Crédito parcelado','credito-parcelado',5);

CREATE TABLE public.finance_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  kind text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (name, kind)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.finance_categories TO authenticated;
GRANT ALL ON public.finance_categories TO service_role;
ALTER TABLE public.finance_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fc_auth_read" ON public.finance_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "fc_admin_write" ON public.finance_categories FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE TRIGGER touch_fc BEFORE UPDATE ON public.finance_categories FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.finance_categories(name, kind) VALUES
  ('Atendimento','receita'),('Venda de produto','receita'),('Outras receitas','receita'),
  ('Aluguel','despesa'),('Insumos','despesa'),('Salários','despesa'),
  ('Comissões','despesa'),('Marketing','despesa'),('Impostos','despesa'),('Outras despesas','despesa');

CREATE TABLE public.cash_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opened_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  opening_amount_cents bigint NOT NULL DEFAULT 0,
  closing_amount_cents bigint,
  notes text,
  opened_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  closed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cash_sessions TO authenticated;
GRANT ALL ON public.cash_sessions TO service_role;
ALTER TABLE public.cash_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cash_admin_all" ON public.cash_sessions FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE TRIGGER touch_cash BEFORE UPDATE ON public.cash_sessions FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.finance_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  source text NOT NULL DEFAULT 'manual',
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  category_id uuid REFERENCES public.finance_categories(id) ON DELETE SET NULL,
  payment_method_id uuid REFERENCES public.payment_methods(id) ON DELETE SET NULL,
  cash_session_id uuid REFERENCES public.cash_sessions(id) ON DELETE SET NULL,
  professional_id uuid REFERENCES public.professionals(id) ON DELETE SET NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  description text NOT NULL,
  amount_cents bigint NOT NULL,
  status text NOT NULL DEFAULT 'pendente',
  due_at date,
  paid_at timestamptz,
  installments integer NOT NULL DEFAULT 1,
  installment_number integer NOT NULL DEFAULT 1,
  recurrence text,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_fe_due ON public.finance_entries(due_at);
CREATE INDEX idx_fe_paid ON public.finance_entries(paid_at);
CREATE INDEX idx_fe_kind_status ON public.finance_entries(kind, status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.finance_entries TO authenticated;
GRANT ALL ON public.finance_entries TO service_role;
ALTER TABLE public.finance_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fe_admin_all" ON public.finance_entries FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "fe_prof_read_own" ON public.finance_entries FOR SELECT TO authenticated USING (professional_id IS NOT NULL AND public.is_own_professional(professional_id));
CREATE TRIGGER touch_fe BEFORE UPDATE ON public.finance_entries FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE RESTRICT,
  base_amount_cents bigint NOT NULL,
  percent numeric(5,2) NOT NULL,
  amount_cents bigint NOT NULL,
  status text NOT NULL DEFAULT 'pendente',
  paid_at timestamptz,
  finance_entry_id uuid REFERENCES public.finance_entries(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_comm_prof ON public.commissions(professional_id, status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.commissions TO authenticated;
GRANT ALL ON public.commissions TO service_role;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comm_admin_all" ON public.commissions FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "comm_prof_read_own" ON public.commissions FOR SELECT TO authenticated USING (public.is_own_professional(professional_id));
CREATE TRIGGER touch_comm BEFORE UPDATE ON public.commissions FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  channel text NOT NULL DEFAULT 'whatsapp',
  direction text NOT NULL,
  body text,
  media_url text,
  external_id text,
  status text,
  sent_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_messages_client ON public.messages(client_id, sent_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages_admin_all" ON public.messages FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE TRIGGER touch_messages BEFORE UPDATE ON public.messages FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  channel text NOT NULL DEFAULT 'whatsapp',
  title text,
  status text NOT NULL DEFAULT 'ativa',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_conversations TO authenticated;
GRANT ALL ON public.ai_conversations TO service_role;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_conv_admin_all" ON public.ai_conversations FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE TRIGGER touch_ai_conv BEFORE UPDATE ON public.ai_conversations FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  role text NOT NULL,
  content text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ai_messages_conv ON public.ai_messages(conversation_id, created_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_messages TO authenticated;
GRANT ALL ON public.ai_messages TO service_role;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_msg_admin_all" ON public.ai_messages FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
