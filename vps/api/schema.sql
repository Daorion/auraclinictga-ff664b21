-- Postgres local da VPS (fonte de verdade das trocas com o WhatsApp)
CREATE TABLE IF NOT EXISTS contacts (
  id BIGSERIAL PRIMARY KEY,
  phone TEXT UNIQUE NOT NULL,
  name TEXT,
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS conversations (
  id BIGSERIAL PRIMARY KEY,
  contact_id BIGINT REFERENCES contacts(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'open',
  ai_enabled BOOLEAN DEFAULT true,
  assigned_to TEXT DEFAULT 'aurora',
  last_message_at TIMESTAMPTZ,
  UNIQUE(contact_id, status)
);

CREATE TABLE IF NOT EXISTS messages (
  id BIGSERIAL PRIMARY KEY,
  conversation_id BIGINT REFERENCES conversations(id) ON DELETE CASCADE,
  external_id TEXT UNIQUE,
  direction TEXT CHECK (direction IN ('in','out')),
  author TEXT,
  body TEXT,
  media_url TEXT,
  msg_type TEXT DEFAULT 'text',
  status TEXT DEFAULT 'delivered',
  sent_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_msg_conv ON messages(conversation_id, sent_at DESC);

CREATE TABLE IF NOT EXISTS whatsapp_sessions (
  session_name TEXT PRIMARY KEY,
  status TEXT,
  phone_number TEXT,
  last_status_at TIMESTAMPTZ DEFAULT now(),
  last_error TEXT
);
