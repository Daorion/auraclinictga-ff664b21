
# Sistema de Administração — Aura Clinic

Sistema interno completo em `/admin`, com base preparada para expansões futuras (salas, WhatsApp, IA de atendimento).

## Módulos da Fase 1

### 1. Clientes (CRM)
- Cadastro: nome, telefone/WhatsApp, e-mail, nascimento, CPF, endereço, observações, tags
- Histórico de atendimentos automático (linkado à agenda)
- Ficha de anamnese em texto livre + upload de fotos (bucket `client-photos`)
- Busca por nome/telefone
- Contador de visitas e ticket médio

### 2. Agenda & Atendimentos
- Calendário semanal e diário, com filtro por profissional
- Marcação: cliente + profissional + serviço + data/hora + sala (opcional já, para preparar módulo futuro) + valor + observação
- Status: agendado, confirmado, realizado, faltou, cancelado
- Bloqueio automático de conflito (mesmo profissional/horário)
- Ao marcar como "realizado", gera lançamento financeiro automaticamente

### 3. Financeiro Intermediário
- **Caixa diário**: entradas e saídas por dia, saldo, fechamento
- **Contas a receber**: gerado dos atendimentos realizados; status pago/pendente; formas de pagamento (dinheiro, pix, débito, crédito à vista, crédito parcelado)
- **Contas a pagar**: cadastro manual (aluguel, insumos, salários), com vencimento e recorrência simples
- **Comissões por profissional**: percentual configurável por profissional (ou por serviço); relatório do período
- **Relatórios**: faturamento por período, por profissional, por serviço, por forma de pagamento

## Controle de Acesso

Dois papéis via `user_roles` (já existente): `admin` e `profissional` (novo valor no enum).

- **Admin**: acesso total a tudo
- **Profissional**: vê apenas própria agenda, próprios clientes atendidos, próprias comissões. Sem acesso a caixa/contas a pagar/relatórios gerais.

Cada usuário `profissional` fica ligado a um registro na tabela `professionals` via `user_id`.

## Estrutura de Dados (fase 1 + base para futuro)

```text
clients            → dados pessoais + observações
client_notes       → anamnese/evolução (múltiplas entradas com data)
client_photos      → antes/depois (storage)

professionals      → migra src/data/profissionais.ts para o banco
                     + user_id (fk auth.users), commission_percent, active
service_catalog    → refina services atual: add price_cents, duration_minutes
professional_services → n:n (quem faz o quê, com preço/comissão específicos opcionais)

rooms              → id, nome, ativo   (base pro módulo salas futuro)

appointments       → client_id, professional_id, service_id, room_id?,
                     start_at, end_at, status, price_cents, notes
appointment_history → log de mudanças de status (auditoria)

payment_methods    → dinheiro, pix, débito, crédito…
finance_entries    → tipo(receita/despesa), origem(appointment/manual),
                     appointment_id?, category_id, amount_cents, paid_at,
                     due_at, status, method_id, installments
finance_categories → plano de contas simples
commissions        → appointment_id, professional_id, percent, amount_cents,
                     status(pendente/pago), paid_at

cash_sessions      → abertura/fechamento de caixa diário
```

Todas com RLS: admin acesso total; profissional só enxerga linhas onde `professional_id` = seu registro (via `has_role` + função `is_own_professional`). Todas com GRANT explícito para `authenticated` e `service_role`.

## Base para o Futuro (sem construir agora, só preparado)

- **Salas**: tabela `rooms` já criada + campo `room_id` em `appointments`; UI de gestão entra na fase 2.
- **WhatsApp**: campo `whatsapp_phone` no cliente + tabela `messages` (client_id, direction, body, sent_at, external_id) já modelada para receber Twilio/WhatsApp Business depois; edge function `whatsapp-webhook` fica como stub.
- **IA de atendimento**: tabela `ai_conversations` + `ai_messages` com role/content, ligadas ao cliente; edge function `ai-agent` como stub usando Lovable AI Gateway; base pronta para agendar via chat.
- **Portal do cliente / auto-agendamento**: schema já suporta (basta expor rotas públicas depois).

## UI

Painel `/admin` atual é reaproveitado. Novos itens no menu:
- Dashboard (KPIs: agendamentos do dia, faturamento do mês, próximos aniversariantes)
- Agenda (calendário)
- Clientes
- Atendimentos (lista)
- Financeiro (caixa, receber, pagar, comissões, relatórios)
- Profissionais (migra o roster estático para o banco)
- Serviços (mantém, refinado com preço e duração)
- Configurações (formas de pagamento, categorias, salas)

Design mantém a identidade Marsala + Cormorant/Inter, glassmorphism sutil no painel.

## Entrega em ondas dentro da Fase 1

Para não travar tudo em uma migration gigante, sugiro esta ordem:

1. **Migration 1** — schema completo (todas as tabelas acima) + RLS + GRANT + enum `profissional`
2. **Onda A** — Clientes (CRUD + notas + fotos)
3. **Onda B** — Profissionais no banco + Serviços refinados + vínculo user↔profissional
4. **Onda C** — Agenda (calendário + CRUD + conflitos)
5. **Onda D** — Financeiro (caixa, receber gerado da agenda, pagar, comissões, relatórios)
6. **Onda E** — Dashboard consolidado

Cada onda entra em uma mensagem separada, verificável no preview antes da próxima.

## Detalhes Técnicos

- Valores monetários em `bigint` (centavos) para evitar erro de float
- `updated_at` com trigger `touch_updated_at` já existente
- Calendário: `react-big-calendar` ou implementação custom leve com date-fns (já no projeto)
- Fotos de clientes: novo bucket privado `client-photos` com policy por admin/profissional dono
- Relatórios: queries agregadas + gráficos com `recharts` (já disponível)
- Sem preços expostos no site público (regra da casa mantida) — preços vivem só no admin

## Confirmações antes de começar

1. Migração dos dados estáticos: OK levar as profissionais atuais (`src/data/profissionais.ts`) para a tabela `professionals` na Onda B? A página pública continua funcionando lendo do banco.
2. Cada profissional terá login próprio? Se sim, na Onda B eu crio um fluxo do admin para "convidar profissional" (cria user + role + vincula).
3. Começo pela **Migration 1 + Onda A (Clientes)** nesta próxima mensagem?
