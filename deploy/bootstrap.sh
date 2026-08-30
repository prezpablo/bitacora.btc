#!/usr/bin/env bash
# Bitácora.btc — arranque en Ubuntu 24.04 (Njalla).
# Uso, como root:
#   export GITHUB_TOKEN=ghp_...   # PAT solo lectura del repo
#   bash bootstrap.sh
set -euo pipefail

REPO_URL="https://github.com/prezpablo/bitacora.btc.git"
APP_DIR="/var/www/bitacora"
PUBLIC_HOST="${PUBLIC_HOST:-bitácora.btc.us}"

if [ "$(id -u)" -ne 0 ]; then
  echo "Corré este script como root (ssh root@IP)."
  exit 1
fi

ZIP_SRC=""
for d in /tmp/bitacora.btc-main /tmp/bitacora-src; do
  if [ -f "$d/deploy/bootstrap.sh" ]; then ZIP_SRC="$d"; break; fi
done

export DEBIAN_FRONTEND=noninteractive

if ! swapon --show | grep -q .; then
  fallocate -l 2G /swapfile 2>/dev/null || dd if=/dev/zero of=/swapfile bs=1M count=2048 status=none
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q swapfile /etc/fstab || echo "/swapfile none swap sw 0 0" >> /etc/fstab
fi

apt-get update -y
apt-get install -y ca-certificates curl git gnupg debian-keyring debian-archive-keyring apt-transport-https ufw

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
if [ -n "$ZIP_SRC" ]; then
  rm -rf "$APP_DIR"
  mkdir -p "$APP_DIR"
  cp -a "$ZIP_SRC"/. "$APP_DIR"/
elif [ -n "${GITHUB_TOKEN:-}" ]; then
  if [ ! -d "$APP_DIR/.git" ]; then
    git clone "https://${GITHUB_TOKEN}@github.com/prezpablo/bitacora.btc.git" "$APP_DIR"
  else
    git -C "$APP_DIR" remote set-url origin "https://${GITHUB_TOKEN}@github.com/prezpablo/bitacora.btc.git"
    git -C "$APP_DIR" pull --ff-only
  fi
  git -C "$APP_DIR" remote set-url origin "$REPO_URL"
else
  echo "Poné el ZIP en /tmp (bitacora.btc-main) o exportá GITHUB_TOKEN."
  exit 1
fi

cd "$APP_DIR"
npm ci
NITRO_PRESET=node-server VITE_PUBLIC_HOSTNAME="$PUBLIC_HOST" npm run build

install -m 644 "$APP_DIR/deploy/Caddyfile" /etc/caddy/Caddyfile

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
ExecStart=/usr/bin/node $APP_DIR/.output/server/index.mjs
Restart=on-failure
RestartSec=4

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now bitacora
systemctl reload caddy || systemctl restart caddy

ufw --force enable
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp

echo
echo "Listo. Probá:  curl -sI http://127.0.0.1:80 | head"
echo "En btc.us → Redireccionamiento:  http://$(curl -s4 ifconfig.me || echo IP)"
echo "Después abrí https://bitácora.btc.us"
