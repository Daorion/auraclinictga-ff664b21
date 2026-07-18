# 🚀 Guia rápido — Aura VPS (WAHA já instalado)

Você já tem o **WAHA rodando** na VPS. Falta subir **API + Worker Gemini + Postgres + Redis** ao lado dele. Este guia entrega tudo pronto.

## 📋 Antes de começar, tenha em mãos

- IP ou acesso SSH da VPS (root ou sudo)
- **Domínio apontado** para o IP da VPS. Ex.: `api.auraclinictga.com.br` (crie um registro A no seu DNS → IP da VPS)
- **WAHA_API_KEY** (a que você definiu na instalação do WAHA — a partir de agora **não cole mais no chat**, use só na VPS)
- **URL local do WAHA** na VPS (geralmente `http://127.0.0.1:3000` ou o nome do container)
- **GEMINI_API_KEY** — pegue grátis em https://aistudio.google.com/apikey

> ⚠️ Se você já colou o `WAHA_API_KEY` ou senha do dashboard no chat comigo antes, **gere novos** no painel do WAHA e use os novos. Valores expostos em chat devem ser considerados comprometidos.

---

## 1️⃣ Conecte no SSH da VPS

```bash
ssh root@SEU_IP_DA_VPS
```

## 2️⃣ Baixe o stack

```bash
cd /opt
git clone https://github.com/SEU-USUARIO/SEU-REPO.git aura-src
# OU (se preferir sem git) copie a pasta vps/ deste projeto Lovable para /opt/aura-src/vps
cd aura-src/vps
```

> Se você não tem o repo em git ainda, me avise que te passo os arquivos em `.tar.gz` para você fazer `wget`.

## 3️⃣ Rode o instalador (faz TUDO automático)

```bash
sudo bash install.sh
```

Ele vai perguntar:
1. **Domínio** → `api.auraclinictga.com.br`
2. **E-mail** (para o certificado HTTPS Let's Encrypt)
3. **URL do WAHA** → normalmente `http://127.0.0.1:3000`
4. **WAHA_API_KEY** → o que você configurou no WAHA
5. **GEMINI_API_KEY** → do Google AI Studio

O script vai:
- ✅ Instalar Docker, Nginx, Certbot
- ✅ Gerar 4 secrets fortes automáticos (API_TOKEN, WEBHOOK_SIGNING_SECRET, INTERNAL_WAHA_HOOK_TOKEN, senha do Postgres)
- ✅ Subir Postgres + Redis + API Fastify + Worker Gemini via Docker Compose
- ✅ Configurar Nginx + HTTPS no seu domínio
- ✅ Registrar o webhook no WAHA apontando para a API nova

## 4️⃣ Ao final, o script imprime na tela

```
AURA_API_URL         = https://api.auraclinictga.com.br
AURA_API_TOKEN       = <um hex de 64 chars>
WAHA_WEBHOOK_SECRET  = <um hex de 64 chars>
```

**Copie esses 3 valores e me mande AQUI no chat** — eu registro no backend do Lovable como secrets (nunca ficam no código do site). A partir desse momento:

- `/admin/integracoes` mostra o status real do WhatsApp
- `/admin/atendimentos` recebe mensagens em tempo real
- Aurora responde automaticamente pelo Gemini

## 5️⃣ Escanear o QR Code do WhatsApp

No painel: **`/admin/integracoes` → "Iniciar sessão" → escaneie o QR** com o WhatsApp da Sirlei.

---

## 🔧 Manutenção

**Ver logs:**
```bash
cd /opt/aura-vps
docker compose -f docker-compose.waha-existente.yml logs -f api worker
```

**Reiniciar:**
```bash
docker compose -f docker-compose.waha-existente.yml restart
```

**Todos os secrets ficam salvos em:** `/opt/aura-vps/.env` (permissão 600, só root lê)

---

## 🆘 Se algo der errado

Me manda o resultado destes 2 comandos e eu te ajudo:
```bash
docker compose -f /opt/aura-vps/docker-compose.waha-existente.yml ps
docker compose -f /opt/aura-vps/docker-compose.waha-existente.yml logs --tail=50 api worker
```
