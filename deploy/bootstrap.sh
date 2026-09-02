#!/usr/bin/env bash
# Bitácora.btc — arranque en Ubuntu 24.04 (Njalla).
# Uso, como root:
#   1) ZIP:  /tmp/bitacora.btc-main.zip  (o carpeta /tmp/bitacora.btc-main)
#   2) Git:  export GITHUB_TOKEN=ghp_...   # PAT, no el texto PEGÁ_EL_TOKEN
#   bash bootstrap.sh
set -euo pipefail

REPO_URL="https://github.com/prezpablo/bitacora.btc.git"
APP_DIR="/var/www/bitacora"
PUBLIC_HOST="${PUBLIC_HOST:-bitácora.btc.us}"
TOKEN="${GITHUB_TOKEN:-}"

if [ "$(id -u)" -ne 0 ]; then
  echo "Corré este script como root (ssh root@IP)."
  exit 1
fi

if [ "$TOKEN" = "PEGÁ_EL_TOKEN" ] || [ "$TOKEN" = "PEGA_EL_TOKEN" ]; then
  echo "GITHUB_TOKEN es el texto de ejemplo. Usá un PAT real o un ZIP."
  TOKEN=""
fi

ZIP_SRC=""
for z in /tmp/bitacora.btc-main.zip /tmp/bitacora.btc.zip /tmp/bitacora.zip; do
  if [ -f "$z" ]; then
    apt-get install -y unzip >/dev/null 2>&1 || true
    rm -rf /tmp/bitacora.btc-main
    unzip -qo "$z" -d /tmp
    # GitHub: bitacora.btc-main  |  a veces prezpablo-bitacora.btc-*
    for d in /tmp/bitacora.btc-main /tmp/prezpablo-bitacora.btc-*; do
      if [ -f "$d/deploy/bootstrap.sh" ]; then ZIP_SRC="$d"; break; fi
    done
    break
  fi
done
if [ -z "$ZIP_SRC" ]; then
  for d in /tmp/bitacora.btc-main /tmp/bitacora-src; do
    if [ -f "$d/deploy/bootstrap.sh" ]; then ZIP_SRC="$d"; break; fi
  done
fi

export DEBIAN_FRONTEND=noninteractive

if ! swapon --show 2>/dev/null | grep -q .; then
  fallocate -l 2G /swapfile 2>/dev/null || dd if=/dev/zero of=/swapfile bs=1M count=2048 status=none || true
  chmod 600 /swapfile 2>/dev/null || true
  mkswap /swapfile 2>/dev/null || true
  swapon /swapfile 2>/dev/null || echo "swap omitido (este VPS no lo permite)"
  grep -q swapfile /etc/fstab 2>/dev/null || echo "/swapfile none swap sw 0 0" >> /etc/fstab || true
fi

apt-get update -y
apt-get install -y ca-certificates curl git gnupg debian-keyring debian-archive-keyring apt-transport-https ufw unzip

if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi

if ! command -v caddy >/dev/null 2>&1; then
  curl -1sLf "https://dl.cloudsmith.io/public/caddy/stable/gpg.key" | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf "https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt" | tee /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -y
  apt-get install -y caddy
fi

mkdir -p /var/www
KEEP_DATA=$(mktemp -d)
if [ -d "$APP_DIR/data" ]; then
  cp -a "$APP_DIR/data"/. "$KEEP_DATA"/ || true
fi

git_ok=0
if [ -n "$TOKEN" ]; then
  AUTH="https://x-access-token:${TOKEN}@github.com/prezpablo/bitacora.btc.git"
  if [ -d "$APP_DIR/.git" ]; then
    git -C "$APP_DIR" remote set-url origin "$AUTH"
    if git -C "$APP_DIR" fetch origin && git -C "$APP_DIR" reset --hard origin/main; then
      git_ok=1
    fi
  elif git clone "$AUTH" "$APP_DIR.next"; then
    rm -rf "$APP_DIR"
    mv "$APP_DIR.next" "$APP_DIR"
    git_ok=1
  fi
  if [ -d "$APP_DIR/.git" ]; then
    git -C "$APP_DIR" remote set-url origin "$REPO_URL" || true
  fi
fi

if [ "$git_ok" != 1 ]; then
  if [ -z "$ZIP_SRC" ]; then
    echo "Git falló y no hay ZIP. En Windows: GitHub → Code → Download ZIP → scp a /tmp/bitacora.btc-main.zip"
    exit 1
  fi
  mkdir -p "$APP_DIR"
  rm -rf "$APP_DIR/.git"
  cp -a "$ZIP_SRC"/. "$APP_DIR"/
  echo "Instalado desde ZIP (sin .git). No te fíes de git log."
fi

mkdir -p "$APP_DIR/data"
if [ -n "$(ls -A "$KEEP_DATA" 2>/dev/null)" ]; then
  cp -a "$KEEP_DATA"/. "$APP_DIR/data"/
fi
rm -rf "$KEEP_DATA"

cd "$APP_DIR"
npm ci
NITRO_PRESET=node-server VITE_PUBLIC_HOSTNAME="$PUBLIC_HOST" npm run build:vps 2>/dev/null || \
  NITRO_PRESET=node-server VITE_PUBLIC_HOSTNAME="$PUBLIC_HOST" npm run build

install -m 644 "$APP_DIR/deploy/Caddyfile" /etc/caddy/Caddyfile

if [ ! -f /etc/bitacora.env ]; then
  umask 077
  printf 'BITACORA_IP_PEPPER=%s\n' "$(openssl rand -hex 32)" > /etc/bitacora.env
  chmod 600 /etc/bitacora.env
fi

cat >/etc/systemd/system/bitacora.service <<EOF
[Unit]
Description=Bitacora.btc
After=network.target

[Service]
Type=simple
WorkingDirectory=$APP_DIR
Environment=NODE_ENV=production
Environment=HOST=127.0.0.1
Environment=PORT=8080
Environment=NITRO_HOST=127.0.0.1
Environment=NITRO_PORT=8080
Environment=BITACORA_SQLITE=$APP_DIR/data/bitacora.sqlite
EnvironmentFile=-/etc/bitacora.env
ExecStart=/usr/bin/node $APP_DIR/.output/server/index.mjs
Restart=always
RestartSec=4
MemoryMax=700M

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now bitacora
systemctl restart bitacora
systemctl reload caddy || systemctl restart caddy

ufw --force enable
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp

echo
echo "Commit: $(git -C "$APP_DIR" log -1 --oneline 2>/dev/null || echo 'ZIP sin git')"
echo "Probá:  curl -sI http://127.0.0.1:80 | head"
echo "SQLite: $APP_DIR/data/"
echo "https://bitacora.btc.us"
