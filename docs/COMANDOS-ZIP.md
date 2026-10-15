# Comandos para actualizar bitacorabtc.org

Canónica. Si el usuario pide **comandos** / **actualizar** / **ya bajé el zip**, pegar **estos**, no inventar otra receta.

VPS: `bitacora@45.158.116.49` · app `/var/www/bitacora` · ZIP GitHub `bitacora.btc-main.zip` → `/tmp/bitacora.btc-main.zip`

---

## 1. PowerShell (PC)

```powershell
scp $env:USERPROFILE\Downloads\bitacora.btc-main.zip bitacora@45.158.116.49:/tmp/bitacora.btc-main.zip
ssh bitacora@45.158.116.49
```

## 2. En el SSH — siempre root

Si ves `bitacora@Bitacora:~$`:

```bash
sudo -i
```

Cuando el prompt sea `root@Bitacora`, pegar **un solo bloque** (heredoc: no rompe comillas):

```bash
bash <<'EOF'
set -euo pipefail
ZIP=/tmp/bitacora.btc-main.zip
APP=/var/www/bitacora
[ -f "$ZIP" ] || { echo "falta $ZIP — volvé a scp"; exit 1; }
rm -rf /tmp/bitacora.btc-main /tmp/bit-src.* /tmp/bit-data.*
WORKDIR=$(mktemp -d /tmp/bit-src.XXXX)
unzip -qo "$ZIP" -d "$WORKDIR"
SRC=$(find "$WORKDIR" -maxdepth 2 -name package.json | head -n1 | xargs dirname)
[ -f "$SRC/package.json" ] || { echo "zip sin package.json"; exit 1; }
KEEP=$(mktemp -d /tmp/bit-data.XXXX)
mkdir -p "$APP/data"
cp -a "$APP/data"/. "$KEEP"/ 2>/dev/null || true
rsync -a --delete --exclude data --exclude .output --exclude node_modules "$SRC"/ "$APP"/
mkdir -p "$APP/data"
cp -a "$KEEP"/. "$APP/data"/ 2>/dev/null || true
rm -rf "$KEEP" "$WORKDIR"
cd "$APP"
npm ci || npm install
SOURCE_REV=""
if REV_JSON=$(curl -fsS --max-time 8 -H "Accept: application/vnd.github+json" -H "User-Agent: bitacora.btc" https://api.github.com/repos/prezpablo/bitacora.btc/commits/main); then
  SOURCE_REV=$(printf '%s' "$REV_JSON" | grep -oE '"sha": "[0-9a-f]{40}"' | head -n1 | grep -oE '[0-9a-f]{40}' || true)
fi
SOURCE_REV=$(printf '%s' "$SOURCE_REV" | cut -c1-7)
[ -n "$SOURCE_REV" ] || { echo "D-FOSS: GitHub no dio el commit. No se publica sin hash."; exit 1; }
echo "SOURCE_REV=$SOURCE_REV"
NITRO_PRESET=node-server VITE_PUBLIC_HOSTNAME=bitacorabtc.org SOURCE_REV="$SOURCE_REV" npm run build:vps
install -m 644 "$APP/deploy/Caddyfile" /etc/caddy/Caddyfile
systemctl restart bitacora
systemctl reload caddy
curl -s https://bitacorabtc.org/healthz
echo
curl -s https://bitacorabtc.org | grep -a -o "commit/$SOURCE_REV" | head
curl -s https://bitacorabtc.org/sitemap.xml | grep -E 'lastmod|LICENSE'
EOF
```

Listo si `/healthz` responde `{"ok":true}` y el sitemap muestra `LICENSE`.

---

## No hacer

- No pegar el bloque como `bitacora` (Permission denied en unzip/rsync/Caddy).
- No unzip a `/tmp/bitacora.btc-main` a mano: el resto root no lo borra.
- No `mkdir /data` (es `$APP/data`).
- No cortar el heredoc ni pegar con corchetes `[200~`.

Si `npm ci` falla: el bloque ya cae a `npm install`.

---

## 3. Backup en el VPS — solo D-BAK-ON

No es el deploy. No reemplaza la sección 2. Como root, una vez:

```bash
bash <<'EOF'
set -euo pipefail
APP=/var/www/bitacora
install -m 755 "$APP/deploy/backup-sqlite.sh" /usr/local/bin/bitacora-backup.sh
install -m 644 "$APP/deploy/bitacora-backup.service" /etc/systemd/system/bitacora-backup.service
install -m 644 "$APP/deploy/bitacora-backup.timer" /etc/systemd/system/bitacora-backup.timer
install -m 644 "$APP/deploy/bitacora-retain.service" /etc/systemd/system/bitacora-retain.service
install -m 644 "$APP/deploy/bitacora-retain.timer" /etc/systemd/system/bitacora-retain.timer
systemctl daemon-reload
systemctl enable --now bitacora-backup.timer bitacora-retain.timer
systemctl start bitacora-backup.service
systemctl list-timers bitacora-backup.timer bitacora-retain.timer --no-pager
ls -lt /var/backups/bitacora | head
EOF
```

Queda cerrado cuando los dos timers están activos y hay un `bitacora-*.sqlite.gz` de hoy. La copia fuera de ese disco es **D-BAK-OFF**, otro paso.

---

## 4. Rotar la pimienta — solo L-HMAC

No es el deploy. No imprime la clave. Como root, una vez. El sitio se reinicia unos segundos.

```bash
bash <<'EOF'
set -euo pipefail
ENV=/etc/bitacora.env
[ -f "$ENV" ] || { echo "falta $ENV"; exit 1; }
grep -q '^BITACORA_IP_PEPPER=' "$ENV" || { echo "falta la variable"; exit 1; }
umask 077
NEW=$(openssl rand -hex 32)
[ "${#NEW}" -eq 64 ] || { echo "largo malo"; exit 1; }
TMP=$(mktemp)
trap 'rm -f "$TMP"' EXIT
while IFS= read -r line || [ -n "$line" ]; do
  case "$line" in
    BITACORA_IP_PEPPER=*) printf 'BITACORA_IP_PEPPER=%s\n' "$NEW" ;;
    *) printf '%s\n' "$line" ;;
  esac
done < "$ENV" > "$TMP"
chars=$(awk -F= '/^BITACORA_IP_PEPPER=/ {print length($2); exit}' "$TMP")
[ "$chars" = "64" ] || { echo "no se escribio"; exit 1; }
chown root:root "$TMP"
chmod 600 "$TMP"
mv "$TMP" "$ENV"
unset NEW
systemctl restart bitacora
sleep 2
systemctl is-active bitacora
curl -sf https://bitacorabtc.org/healthz; echo
awk -F= '/^BITACORA_IP_PEPPER=/ {print "pepper_chars", length($2); exit}' "$ENV"
date -u +%F
EOF
```

Queda hecha cuando diga `active`, `{"ok":true}` y `pepper_chars 64`. No pegar el contenido de `/etc/bitacora.env`. `/legal` nombra la fecha en el ZIP siguiente, no en este bloque.
