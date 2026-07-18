
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS push_name text,
  ADD COLUMN IF NOT EXISTS profile_picture_url text,
  ADD COLUMN IF NOT EXISTS wa_id text;

-- Limpa poluição: eventos de sistema (notification_template) que caíram como conversa sem nome/telefone real
DELETE FROM public.messages
  WHERE metadata->'raw'->>'type' = 'notification_template'
     OR (metadata->'raw'->>'from') LIKE '%@lid';

DELETE FROM public.conversations c
  WHERE NOT EXISTS (SELECT 1 FROM public.messages m WHERE m.conversation_id = c.id);

DELETE FROM public.contacts co
  WHERE NOT EXISTS (SELECT 1 FROM public.conversations c WHERE c.contact_id = co.id)
    AND co.client_id IS NULL
    AND co.origin = 'whatsapp';
