# Aura VPS — WAHA + API Intermediária + Gemini

Pacote pronto para subir na sua VPS. Ele é a **única ponte** entre o painel Aura Clinic (Lovable) e o WhatsApp/Gemini.

```
Painel Lovable  ──►  Edge Function aura-proxy  ──►  API intermediária (esta VPS)
                                                        ├── WAHA (WhatsApp)
                                                        ├── Redis + BullMQ (fila)
                                                        ├── Worker Gemini (IA)
                                                        └── Postgres (histórico)
                              ▲
                              │  Webhook assinado (HMAC)
                              └───  aura-webhook  ◄──  esta VPS
```

## Fluxo completo (baseado no WAHA)

1. **Cliente manda WhatsApp** → WAHA recebe → envia webhook `POST /waha/events` na API.
2. A API:
   - Normaliza o evento, grava no Postgres local.
   - Enfileira `reply-job` no Redis (BullMQ) se a conversa estiver com Aurora ativa.
   - Dispara `POST /aura/webhook` no Lovable (assinado HMAC) → espelha mensagem no painel em tempo real.
3. **Worker Gemini** pega o job:
   - Busca histórico + contexto do contato + tabela `procedures_pricing` (via API do Lovable).
   - Chama Gemini com system prompt da Aurora + guardrails.
   - Se `ai_settings.mode = automatico` → envia via WAHA e grava outbound.
   - Se `revisar` → cria rascunho no painel, não envia.
4. **Sirlei responde manual pelo painel** → `POST /api/messages` → API envia via WAHA → webhook confirma ACK.

## Subir

Pré-requisitos: VPS Ubuntu 22.04+, Docker + Docker Compose, domínio apontado (ex.: `api.auraclinictga.com.br`), Nginx/Caddy com HTTPS.

```bash
git clone <este-repo> aura-vps && cd aura-vps
cp .env.example .env
# edite .env com secrets fortes
docker compose up -d
docker compose logs -f api
```

Depois no painel Lovable, configure os secrets do backend:

- `AURA_API_URL` = `https://api.auraclinictga.com.br`
- `AURA_API_TOKEN` = mesmo valor de `API_TOKEN` do `.env`
- `WAHA_WEBHOOK_SECRET` = mesmo valor de `WEBHOOK_SIGNING_SECRET` do `.env`

Aí abra `/admin/integracoes` → "Iniciar sessão" → escaneie o QR no WhatsApp da Sirlei.

## Segurança

- Nenhum secret vai pro browser. `GEMINI_API_KEY`, `WAHA_API_KEY`, senha do banco e `JWT_SECRET` ficam só na VPS.
- Webhook do WAHA → API: valida `X-Webhook-Token` interno.
- Webhook da API → Lovable: assina com HMAC-SHA256 usando `WEBHOOK_SIGNING_SECRET`.
- Chamadas do Lovable → API: exigem `Authorization: Bearer $API_TOKEN`.
- Rate limit por IP na API (`@fastify/rate-limit`).
- WAHA nunca fica exposto publicamente — só a API vê ele na rede interna do Docker.

## LGPD

- Endpoint `DELETE /api/contacts/:phone` faz hard delete no Postgres local e sinaliza o Lovable.
- Logs de auditoria replicados na tabela `audit_log` do Lovable via webhook `audit.event`.
