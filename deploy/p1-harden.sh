#!/usr/bin/env bash
# P1 — fail2ban (SSH) + unattended-upgrades. Correr: sudo bash deploy/p1-harden.sh
set -euo pipefail
if [ "$(id -u)" -ne 0 ]; then
  echo "sudo bash $0"
  exit 1
fi
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y fail2ban unattended-upgrades apt-listchanges
printf 'PermitRootLogin no\nPasswordAuthentication no\nPubkeyAuthentication yes\n' >/etc/ssh/sshd_config.d/50-bitacora.conf
cat >/etc/fail2ban/jail.d/bitacora.conf <<'EOF'
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = %(sshd_log)s
backend = 10m
maxretry = 4
findtime = 10m
bantime = 1h
EOF
cat >/etc/apt/apt.conf.d/20auto-upgrades <<'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanIntervals "7";
EOF
systemctl enable --now fail2ban
systemctl reload ssh 2>/dev/null || systemctl reload sshd || true
fail2ban-client status sshd || true
echo "P1: fail2ban sshd + unattended-upgrades"
