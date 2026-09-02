#!/usr/bin/env bash
# P2 — worker VPS → Umbrel (Tailscale). No corre hasta tener UMBREL_HOST.
# El front nunca pega al nodo de Colonia; este cron escribe JSON en data/.
set -euo pipefail
HOST="${UMBREL_HOST:-}"
if [[ -z "$HOST" ]]; then
  echo "UMBREL_HOST vacío — nodo aún no encolado. Ver docs/DEUDA-PLAN-HIBRIDO.md H2."
  exit 0
fi
OUT="${BITACORA_DATA:-/opt/bitacora/data}/umbrel-status.json"
TMP="${OUT}.tmp"
# Ejemplo: mempool del Umbrel por Tailscale, timeout corto para no colgar el VPS.
curl -fsS --max-time 8 "http://${HOST}:3006/api/v1/fees/recommended" -o "$TMP"
mv "$TMP" "$OUT"
