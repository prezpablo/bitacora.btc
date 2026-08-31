#!/usr/bin/env bash
# P0 — crea usuario bitacora con la misma clave SSH que root.
# NO desactiva root. Eso es p0-lock-root.sh, en OTRA sesión, cuando ya entres como bitacora.
set -euo pipefail
if [ "$(id -u)" -ne 0 ]; then
  echo "Corré como root."
  exit 1
fi
if [ ! -s /root/.ssh/authorized_keys ]; then
  echo "No hay /root/.ssh/authorized_keys. Aborto para no dejarte afuera."
  exit 1
fi
if ! id bitacora >/dev/null 2>&1; then
  adduser --disabled-password --gecos "Bitacora" bitacora
fi
usermod -aG sudo bitacora
mkdir -p /home/bitacora/.ssh
cp /root/.ssh/authorized_keys /home/bitacora/.ssh/authorized_keys
chown -R bitacora:bitacora /home/bitacora/.ssh
chmod 700 /home/bitacora/.ssh
chmod 600 /home/bitacora/.ssh/authorized_keys
printf 'bitacora ALL=(ALL) NOPASSWD:ALL\n' >/etc/sudoers.d/bitacora
chmod 440 /etc/sudoers.d/bitacora
echo
echo "Listo. SIN CERRAR esta ventana, abrí otra:"
echo "  ssh bitacora@45.158.116.49"
echo "Si entra, ahí corré:  sudo bash /var/www/bitacora/deploy/p0-lock-root.sh"
