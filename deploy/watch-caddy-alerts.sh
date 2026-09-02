#!/usr/bin/env bash
# Alerta Telegram si Caddy corta extractores (abort=0 bytes / 403) o Node responde 429.
# No va ningún secreto al git: copiar /etc/bitacora/telegram.env en el VPS.
# Cron sugerido: * * * * * bitacora /opt/bitacora/deploy/watch-caddy-alerts.sh
set -euo pipefail

ENV_FILE="${BITACORA_TELEGRAM_ENV:-/etc/bitacora/telegram.env}"
if [[ ! -f "$ENV_FILE" ]]; then
  exit 0
fi
# shellcheck disable=SC1090
source "$ENV_FILE"
: "${TELEGRAM_BOT_TOKEN:?}"
: "${TELEGRAM_CHAT_ID:?}"

THRESHOLD="${ALERT_THRESHOLD:-50}"
STATE_DIR="${ALERT_STATE_DIR:-/tmp/bitacora-alerts}"
mkdir -p "$STATE_DIR"
SINCE_FILE="$STATE_DIR/last-ts"
NOW=$(date +%s)
if [[ -f "$SINCE_FILE" ]]; then
  SINCE=$(cat "$SINCE_FILE")
else
  SINCE=$((NOW - 60))
fi
echo "$NOW" > "$SINCE_FILE"

# journalctl de Caddy (stdout) + unit de la app.
LOG=$(journalctl -u caddy -u bitacora --since "@$SINCE" --no-pager 2>/dev/null || true)
if [[ -z "$LOG" ]]; then
  exit 0
fi

ABORTS=$(printf '%s\n' "$LOG" | grep -cE 'abort| 403 |User-Agent.*(CCBot|Bytespider)' || true)
RATES=$(printf '%s\n' "$LOG" | grep -cE ' 429 ' || true)
TOTAL=$((ABORTS + RATES))

if (( TOTAL < THRESHOLD )); then
  exit 0
fi

TEXT="*Bitácora.btc* alerta borde
abort/403: \`${ABORTS}\`
429: \`${RATES}\`
ventana: 1 min — umbral ${THRESHOLD}"

curl -fsS -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  --data-urlencode "chat_id=${TELEGRAM_CHAT_ID}" \
  --data-urlencode "parse_mode=Markdown" \
  --data-urlencode "text=${TEXT}" >/dev/null
