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
NITRO_PRESET=node-server VITE_PUBLIC_HOSTNAME=bitacorabtc.org npm run build:vps
install -m 644 "$APP/deploy/Caddyfile" /etc/caddy/Caddyfile
systemctl restart bitacora
systemctl reload caddy
curl -s https://bitacorabtc.org/healthz
echo
curl -s https://bitacorabtc.org | grep -a -o Aprender | head
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
