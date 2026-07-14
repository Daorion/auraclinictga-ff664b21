# Plano — Aura Clinic: Central de Atendimento + Aurora IA

## Situação atual (após análise)

O projeto já tem:
- Site público completo (Marsala/Cormorant/Inter) — **preservado 100%**
- Painel `/admin` com auth real (Supabase), roles `admin`/`profissional`
- Módulos: Dashboard, Agenda, Clientes, Profissionais, Financeiro, Serviços, Estúdio de Artes
- Tabelas base já existentes: `clients`, `appointments`, `services`, `professionals`, `messages`, `ai_conversations`, `ai_messages` (usadas parcialmente)

Portanto **não vamos reconstruir** — vamos **expandir** o admin e criar a ponte com a API intermediária + WAHA + Gemini.

## Arquitetura (sem chaves no frontend)

```text
[Site + Painel Lovable]  ⇄  [Edge Functions Lovable Cloud]  ⇄  [API intermediária VPS]
                                                                    ├─ WAHA (Docker)
                                                                    ├─ PostgreSQL
                                                                    ├─ Redis + fila
                                                                    └─ Gemini
```

- Frontend chama **apenas** Edge Functions (`aura-proxy`, `aura-webhook`).
- Edge Functions guardam `AURA_API_URL`, `AURA_API_TOKEN`, `WAHA_WEBHOOK_SECRET` como secrets do Cloud.
- **Nenhuma** credencial de WAHA/Gemini/JWT aparece no bundle.
- Conversas/mensagens ficam espelhadas no Postgres do Cloud (para o painel ler em tempo real via Realtime) e a fonte de verdade das trocas com WhatsApp fica na VPS.

## Etapas de entrega

### Etapa 1 — Fundação (esta rodada)
1. **Schema**: expandir `messages`, `ai_conversations` e adicionar:
   - `conversations` (thread por contato: status, etapa, responsável Aurora/Sirlei, unread_count, last_message_at)
   - `contacts` (telefone único, vínculo opcional com `clients`, origem/UTM)
   - `ai_settings` (modo global e por ação: automático / revisão / desativado)
   - `audit_log` (quem, o quê, quando)
   - `procedures_pricing` (base oficial editável — massagem, drenagem, limpeza, eletroterapia, drenomodeladora, combo)
   - `whatsapp_sessions` (status, número conectado, last_qr_at)
   - RLS + GRANT em todas
2. **Edge Functions** (stubs com contrato pronto, chamam `AURA_API_URL` quando disponível, retornam erro claro quando não):
   - `aura-proxy` — repassa `GET /conversations`, `PATCH /conversations/:id`, `POST /messages`, `POST /ai/reply`, `GET /whatsapp/status`, `POST /whatsapp/start`, `GET /whatsapp/qr`
   - `aura-webhook` — recebe eventos do WAHA (via API intermediária), valida `WEBHOOK_SECRET`, idempotência por `external_id`, insere em `messages` + atualiza `conversations`
3. **Camada de serviço no frontend**: `src/lib/auraApi.ts` — ponto único, nenhum componente chama Supabase functions diretamente.
4. **Secrets** (pedir ao usuário quando ele tiver a VPS pronta): `AURA_API_URL`, `AURA_API_TOKEN`, `WAHA_WEBHOOK_SECRET`. Sem eles, o painel mostra estado "API intermediária não configurada" — nada de mock apresentado como real.
5. **Seed** da tabela `procedures_pricing` com os valores oficiais informados.

### Etapa 2 — Caixa de entrada (Atendimentos)
- Página `/admin/atendimentos`: lista de conversas + painel de mensagens (Realtime), busca, filtros por etapa/responsável, unread, indicador Aurora/Sirlei.
- Ações: enviar resposta manual, "Preparar resposta com IA", "Assumir conversa" (pausa Aurora nesta thread), "Devolver para Aurora".
- Anotações internas, interesse, origem, etapa comercial.

### Etapa 3 — Aurora (IA)
- Página `/admin/aurora`: prompt/persona (bloqueado, editável só com senha admin), modos por ação (automático / revisão / desativado), base de conhecimento = `procedures_pricing` + FAQs.
- Guardrails do system prompt (não diagnostica, não inventa preço/horário, transfere em casos sensíveis).
- Endpoint `aura-proxy → /ai/reply` envia histórico + contexto do contato + preços atuais do banco.

### Etapa 4 — WhatsApp (WAHA)
- Página `/admin/integracoes`: status da sessão, botão "Conectar", exibição de QR (polling), reiniciar sessão, número conectado, erros legíveis.
- Toda comunicação via `aura-proxy`.

### Etapa 5 — Visão Geral + IA transversal
- Dashboard novo com KPIs pedidos (conversas do dia, resposta média, Aurora vs Sirlei, top procedimentos, status WAHA/API/IA).
- Resumos automáticos, classificação de etapa, sugestão de próxima ação, follow-ups — chamados sob demanda via `/ai/*`.

### Etapa 6 — Agenda + Site + Auditoria + LGPD
- Aurora consulta disponibilidade real (usa `appointments`), nunca confirma sem checar.
- Formulários do site gravam origem/UTM em `contacts`.
- Página `/admin/auditoria` lê `audit_log`.
- Consentimento LGPD + exclusão/anonimização de contato.

## Detalhes técnicos

- **Realtime**: `ALTER PUBLICATION supabase_realtime ADD TABLE messages, conversations` para atualizar caixa de entrada ao vivo.
- **Idempotência**: `messages.external_id UNIQUE` — webhook nunca duplica.
- **Pausar Aurora por thread**: `conversations.ai_enabled boolean` + `assigned_to` (`aurora`/`sirlei`); worker da VPS respeita esse flag antes de responder.
- **Rate limit**: por IP na Edge Function do webhook + validação de assinatura HMAC.
- **Modo de IA**: `ai_settings.mode` em `automatico | revisar | desativado`, checado a cada ação; ações em "revisar" viram rascunhos na conversa.
- **Sem mock em produção**: quando `AURA_API_URL` não estiver configurada, cada tela mostra banner "Aguardando configuração da API intermediária" — nunca dados falsos.
- **Preços**: só no admin, tabela editável; Aurora recebe via contexto, nunca hardcoded no prompt.
- **Segredos**: `AURA_API_URL`, `AURA_API_TOKEN`, `WAHA_WEBHOOK_SECRET`, `GEMINI_API_KEY` (opcional — só se você quiser rodar IA também dentro do Cloud como fallback). Adicionados via ferramenta segura, nunca no `.env` do Vite.

## O que **não** muda

Site público, identidade visual, textos, SEO, formulários visuais, rotas `/servicos*`, `/profissionais`, módulos admin já existentes (Clientes, Profissionais, Financeiro, Estúdio) — todos preservados. Novos itens entram como abas adicionais no menu do admin.

## Pergunta antes de começar a Etapa 1

Para você aprovar o plano com clareza:

1. **A VPS + API intermediária + WAHA já existem**, ou preciso entregar o painel funcionando com as Edge Functions prontas para plugar assim que você subir a VPS? (define se peço os secrets agora ou na Etapa 4)
2. Confirmo que a IA (Gemini) sempre vai ser chamada **pela VPS** (nunca pela Edge Function)? Se sim, o Lovable só chama `aura-proxy → /ai/reply` — a chave Gemini nunca passa por aqui.
3. Posso começar já pela **Etapa 1 (schema + edge functions + camada de serviço + seed de preços)** na próxima mensagem?
