
CREATE OR REPLACE FUNCTION public.sync_appointment_finance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_percent numeric;
  v_commission bigint;
BEGIN
  -- On becoming 'realizado', create finance receivable + commission if not existing
  IF NEW.status = 'realizado' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'realizado') THEN
    IF NEW.price_cents > 0 AND NOT EXISTS (
      SELECT 1 FROM public.finance_entries WHERE appointment_id = NEW.id AND kind = 'receita'
    ) THEN
      INSERT INTO public.finance_entries(kind, source, appointment_id, professional_id, client_id, description, amount_cents, status, paid_at)
      VALUES ('receita','appointment', NEW.id, NEW.professional_id, NEW.client_id,
              'Atendimento: ' || NEW.service_name, NEW.price_cents, 'pendente', NULL);
    END IF;

    v_percent := COALESCE(NEW.commission_percent,
      (SELECT commission_percent FROM public.professionals WHERE id = NEW.professional_id));
    IF v_percent IS NOT NULL AND v_percent > 0 AND NEW.price_cents > 0 AND NOT EXISTS (
      SELECT 1 FROM public.commissions WHERE appointment_id = NEW.id
    ) THEN
      v_commission := ROUND(NEW.price_cents * v_percent / 100.0);
      INSERT INTO public.commissions(appointment_id, professional_id, base_amount_cents, percent, amount_cents, status)
      VALUES (NEW.id, NEW.professional_id, NEW.price_cents, v_percent, v_commission, 'pendente');
    END IF;
  END IF;

  -- On leaving 'realizado', clean auto-created unpaid entries
  IF TG_OP = 'UPDATE' AND OLD.status = 'realizado' AND NEW.status <> 'realizado' THEN
    DELETE FROM public.finance_entries
      WHERE appointment_id = NEW.id AND source = 'appointment' AND status = 'pendente';
    DELETE FROM public.commissions
      WHERE appointment_id = NEW.id AND status = 'pendente';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_appointment_finance ON public.appointments;
CREATE TRIGGER trg_sync_appointment_finance
AFTER INSERT OR UPDATE OF status, price_cents ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.sync_appointment_finance();
