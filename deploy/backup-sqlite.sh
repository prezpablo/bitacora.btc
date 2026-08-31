#!/usr/bin/env bash
# Copia consistente de SQLite (WAL) y rota 14 días.
set -euo pipefail
SRC="${BITACORA_SQLITE:-/var/www/bitacora/data/bitacora.sqlite}"
DESTDIR="${BITACORA_BACKUP_DIR:-/var/backups/bitacora}"
KEEP="${BITACORA_BACKUP_KEEP:-14}"
mkdir -p "$DESTDIR"
if [ ! -f "$SRC" ]; then
  echo "sin sqlite: $SRC"
  exit 0
fi
STAMP=$(date +%Y%m%d-%H%M)
OUT="$DESTDIR/bitacora-$STAMP.sqlite"
sqlite3 "$SRC" <<SQL
.timeout 5000
.backup $OUT
SQL
gzip -f "$OUT"
ls -1t "$DESTDIR"/bitacora-*.sqlite.gz 2>/dev/null | tail -n +"$((KEEP + 1))" | xargs -r rm -f
echo "backup $OUT.gz"
