#!/usr/bin/env bash
# D-NODO. La casa no abre puertos. Este script no arma el túnel.
# Solo corre si BITACORA_NODE_HOST es una IP privada (WireGuard o Tailscale)
# y solo pide lectura: getblockchaininfo, getmempoolinfo, estimatesmartfee.
# No hay billetera, no hay método de administración, no hay Cloudflare.
set -euo pipefail

HOST="${BITACORA_NODE_HOST:-}"
PORT="${BITACORA_NODE_PORT:-8332}"
RPC_USER="${BITACORA_NODE_USER:-}"
RPC_PASS="${BITACORA_NODE_PASS:-}"
OUT="${BITACORA_DATA:-/var/www/bitacora/data}/node-status.json"

private_ip() {
  local ip="$1"
  [[ "$ip" =~ ^10\.([0-9]{1,3}\.){2}[0-9]{1,3}$ ]] && return 0
  [[ "$ip" =~ ^192\.168\.([0-9]{1,3})\.[0-9]{1,3}$ ]] && return 0
  [[ "$ip" =~ ^172\.(1[6-9]|2[0-9]|3[0-1])\.([0-9]{1,3})\.[0-9]{1,3}$ ]] && return 0
  [[ "$ip" =~ ^100\.(6[4-9]|[7-9][0-9]|1[0-1][0-9]|12[0-7])\.([0-9]{1,3})\.[0-9]{1,3}$ ]] && return 0
  return 1
}

if [[ -z "$HOST" ]]; then
  echo "BITACORA_NODE_HOST vacío — no hay nodo. No se arma el túnel."
  exit 0
fi

if [[ "$HOST" == *"/"* || "$HOST" == *":"* || "$HOST" == *"cloudflare"* ]]; then
  echo "host no permitido" >&2
  exit 1
fi

if ! private_ip "$HOST"; then
  echo "el host tiene que ser una IP privada de WireGuard o Tailscale" >&2
  exit 1
fi

if [[ ! "$PORT" =~ ^[0-9]+$ || "$PORT" -lt 1 || "$PORT" -gt 65535 || "$PORT" == "8333" ]]; then
  echo "puerto no permitido" >&2
  exit 1
fi

if [[ -z "$RPC_USER" || -z "$RPC_PASS" ]]; then
  echo "faltan BITACORA_NODE_USER y BITACORA_NODE_PASS" >&2
  exit 1
fi

rpc() {
  local method="$1"
  local params="$2"
  case "$method" in
    getblockchaininfo|getmempoolinfo|estimatesmartfee) ;;
    *)
      echo "método no permitido" >&2
      exit 1
      ;;
  esac
  curl -fsS --max-time 8 \
    --user "${RPC_USER}:${RPC_PASS}" \
    -H "content-type: application/json" \
    --data "{\"jsonrpc\":\"1.0\",\"id\":\"bitacora\",\"method\":\"${method}\",\"params\":${params}}" \
    "http://${HOST}:${PORT}/"
}

mkdir -p "$(dirname "$OUT")"
CHAIN=$(rpc getblockchaininfo "[]")
MEMPOOL=$(rpc getmempoolinfo "[]")
FEE=$(rpc estimatesmartfee "[6]")
TMP="${OUT}.tmp"
CHAIN="$CHAIN" MEMPOOL="$MEMPOOL" FEE="$FEE" HOST="$HOST" TMP="$TMP" python3 - << 'PY'
import json, os
def load(raw):
    data = json.loads(raw)
    result = data.get("result")
    if not isinstance(result, dict):
        raise SystemExit("respuesta sin result")
    for key in ("wallet", "hdseed", "private_keys", "master_key"):
        result.pop(key, None)
    return result
out = {
    "ok": True,
    "host": os.environ["HOST"],
    "methods": ["getblockchaininfo", "getmempoolinfo", "estimatesmartfee"],
    "getblockchaininfo": load(os.environ["CHAIN"]),
    "getmempoolinfo": load(os.environ["MEMPOOL"]),
    "estimatesmartfee": load(os.environ["FEE"]),
}
with open(os.environ["TMP"], "w", encoding="utf-8") as fh:
    json.dump(out, fh)
    fh.write("\n")
PY
mv "$TMP" "$OUT"
echo "nodo leído en $OUT"
