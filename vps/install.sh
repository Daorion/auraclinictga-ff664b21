#!/usr/bin/env bash
# Aura VPS installer — sobe API + Worker + Postgres + Redis ao lado do WAHA existente.
# Uso:
#   sudo bash install.sh
# Requer: Ubuntu 22.04+, root, domínio apontado (ex.: api.auraclinictga.com.br)

set -euo pipefail

INSTALL_DIR="/opt/aura-vps"
DOMAIN="${DOMAIN:-}"
EMAIL="${EMAIL:-}"

echo "==> Aura VPS installer"
if [[ $EUID -ne 0 ]]; then echo "Rode como root (sudo)."; exit 1; fi

read -rp "Domínio da API (ex.: api.auraclinictga.com.br): " DOMAIN
read -rp "E-mail para Let's Encrypt: " EMAIL
read -rp "URL do WAHA já instalado (ex.: http://127.0.0.1:3000 ou http://waha:3000): " WAHA_URL
read -rsp "WAHA_API_KEY (do WAHA já instalado): " WAHA_API_KEY; echo
read -rsp "GEMINI_API_KEY (https://aistudio.google.com/apikey): " GEMINI_API_KEY; echo

# --- Dependências ---
echo "==> Instalando Docker, Compose, Nginx, Certbot..."
apt-get update -y
apt-get install -y ca-certificates curl gnupg nginx certbot python3-certbot-nginx git
if ! command -v docker >/dev/null; then
  curl -fsSL https://get.docker.com | sh
fi

# --- Geração de secrets fortes ---
gen() { openssl rand -hex 32; }
API_TOKEN=$(gen)
WEBHOOK_SIGNING_SECRET=$(gen)
INTERNAL_WAHA_HOOK_TOKEN=$(gen)
POSTGRES_PASSWORD=$(gen)

# --- Checkout do stack (assume que este script vive dentro de vps/) ---
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
mkdir -p "$INSTALL_DIR"
cp -r "$SCRIPT_DIR"/* "$INSTALL_DIR"/
cd "$INSTALL_DIR"

# --- .env ---
cat > .env <<EOF
API_TOKEN=$API_TOKEN
WEBHOOK_SIGNING_SECRET=$WEBHOOK_SIGNING_SECRET
INTERNAL_WAHA_HOOK_TOKEN=$INTERNAL_WAHA_HOOK_TOKEN
WAHA_API_KEY=$WAHA_API_KEY
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
GEMINI_API_KEY=$GEMINI_API_KEY

# Webhook do painel Lovable
LOVABLE_WEBHOOK_URL=https://okizljseegzvhdpywzpr.supabase.co/functions/v1/aura-webhook

# WAHA já instalado
WAHA_BASE_URL_EXTERNAL=$WAHA_URL
EOF
chmod 600 .env

# --- docker compose up (só API, worker, postgres, redis; WAHA já existe) ---
echo "==> Subindo containers..."
docker compose -f docker-compose.yml up -d postgres redis api worker

# --- Nginx + HTTPS ---
echo "==> Configurando Nginx para $DOMAIN..."
cat > /etc/nginx/sites-available/$DOMAIN <<NGINX
server {
  listen 80;
  server_name $DOMAIN;
  location / {
    proxy_pass         http://127.0.0.1:3000;
    proxy_set_header   Host \$host;
    proxy_set_header   X-Real-IP \$remote_addr;
    proxy_set_header   X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header   X-Forwarded-Proto \$scheme;
  }
}
NGINX
ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/$DOMAIN
nginx -t && systemctl reload nginx

certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$EMAIL" --redirect

# --- IMPORTANTE: reconfigurar webhook do WAHA para apontar pra API nova ---
echo "==> Registrando webhook no WAHA..."
curl -s -X POST "$WAHA_URL/api/sessions/default/config" \
  -H "X-Api-Key: $WAHA_API_KEY" -H "Content-Type: application/json" \
  -d "{\"webhooks\":[{\"url\":\"http://127.0.0.1:3000/waha/events\",\"events\":[\"message\",\"message.ack\",\"session.status\"],\"customHeaders\":[{\"name\":\"x-webhook-token\",\"value\":\"$INTERNAL_WAHA_HOOK_TOKEN\"}]}]}" || \
  echo "  (pode falhar se sessão ainda não existir — reenvie depois de criar a sessão default)"

echo ""
echo "============================================================"
echo "✅ INSTALAÇÃO CONCLUÍDA"
echo "============================================================"
echo ""
echo "Cole ESTES 3 valores no Lovable (chat comigo, um por vez):"
echo ""
echo "AURA_API_URL         = https://$DOMAIN"
echo "AURA_API_TOKEN       = $API_TOKEN"
echo "WAHA_WEBHOOK_SECRET  = $WEBHOOK_SIGNING_SECRET"
echo ""
echo "Guarde este arquivo com todos os secrets: $INSTALL_DIR/.env"
echo "============================================================"
