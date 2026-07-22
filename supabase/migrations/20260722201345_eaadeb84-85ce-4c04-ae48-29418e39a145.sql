-- Merge duplicate open conversations per contact, keeping the most recent open conversation.
WITH ranked AS (
  SELECT
    id,
    contact_id,
    ROW_NUMBER() OVER (
      PARTITION BY contact_id
      ORDER BY COALESCE(last_message_at, updated_at, created_at) DESC, created_at DESC, id DESC
    ) AS rn,
    FIRST_VALUE(id) OVER (
      PARTITION BY contact_id
      ORDER BY COALESCE(last_message_at, updated_at, created_at) DESC, created_at DESC, id DESC
    ) AS keep_id
  FROM public.conversations
  WHERE status = 'open'
), moved AS (
  UPDATE public.messages m
  SET conversation_id = r.keep_id
  FROM ranked r
  WHERE m.conversation_id = r.id
    AND r.rn > 1
  RETURNING m.id
)
UPDATE public.conversations c
SET
  status = 'closed',
  ai_enabled = false,
  pending_reply_token = NULL,
  updated_at = now(),
  internal_notes = CONCAT_WS(E'\n', NULLIF(c.internal_notes, ''), 'Conversa duplicada encerrada automaticamente; mensagens movidas para a conversa aberta principal.')
FROM ranked r
WHERE c.id = r.id
  AND r.rn > 1;

-- Refresh the kept open conversations with their latest message snapshot.
WITH latest AS (
  SELECT DISTINCT ON (conversation_id)
    conversation_id,
    created_at,
    body
  FROM public.messages
  ORDER BY conversation_id, created_at DESC
)
UPDATE public.conversations c
SET
  last_message_at = latest.created_at,
  last_message_preview = LEFT(COALESCE(NULLIF(latest.body, ''), '[mensagem]'), 140),
  updated_at = now()
FROM latest
WHERE c.id = latest.conversation_id
  AND c.status = 'open';

-- Hard guard: only one open conversation may exist per contact.
CREATE UNIQUE INDEX IF NOT EXISTS conversations_one_open_per_contact_idx
ON public.conversations (contact_id)
WHERE status = 'open';

-- Fast lookup for contact-level debounce and recent-message checks.
CREATE INDEX IF NOT EXISTS messages_contact_created_at_idx
ON public.messages (contact_id, created_at DESC);

CREATE INDEX IF NOT EXISTS messages_conversation_created_at_idx
ON public.messages (conversation_id, created_at DESC);
