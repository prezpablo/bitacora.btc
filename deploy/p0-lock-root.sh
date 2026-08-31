#!/usr/bin/env bash
# P0 — apaga login root por SSH. Solo después de haber entrado como bitacora.
set -euo pipefail
if [ "$(id -u)" -ne 0 ]; then
  echo "Corré: sudo bash $0"
  exit 1
fi
if [ "${SUDO_USER:-}" != "bitacora" ]; then
  echo "Entrá con ssh bitacora@IP y después: sudo bash $0"
  exit 1
fi
if [ ! -s /home/bitacora/.ssh/authorized_keys ]; then
  echo "bitacora no tiene clave. Aborto."
  exit 1
fi
sshd=/etc/ssh/sshd_config
grep -q '^PermitRootLogin' "$sshd" && sed -i 's/^PermitRootLogin.*/PermitRootLogin no/' "$sshd" || echo 'PermitRootLogin no' >>"$sshd"
grep -q '^PasswordAuthentication' "$sshd" && sed -i 's/^PasswordAuthentication.*/PasswordAuthentication no/' "$sshd" || echo 'PasswordAuthentication no' >>"$sshd"
grep -q '^PubkeyAuthentication' "$sshd" && sed -i 's/^PubkeyAuthentication.*/PubkeyAuthentication yes/' "$sshd" || echo 'PubkeyAuthentication yes' >>"$sshd"
systemctl reload ssh 2>/dev/null || systemctl reload sshd
echo "Root SSH apagado. Password SSH apagada. Seguí entrando con: ssh bitacora@45.158.116.49"
