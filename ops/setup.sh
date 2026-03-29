#!/bin/bash
# ============================================================
# TechNurture Labs — Initial VPS Environment Setup
# ENSURE WE ARE IN PROJECT ROOT
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ "$SCRIPT_DIR" == *"ops" ]]; then
  cd "$SCRIPT_DIR/.."
fi
# ============================================================

set -e

echo "🚀 Starting TechNurture LMS - Environment Setup"

# 1. System packages
echo "Updating system..."
apt-get update && apt-get upgrade -y

# 2. Requisites
echo "Installing prerequisites..."
apt-get install -y ca-certificates curl gnupg lsb-release git ufw lsof htop

# 3. Docker
if ! command -v docker &> /dev/null; then
  echo "Installing Docker..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
fi

# 4. Firewall
echo "Opening firewall (80, 443, 22)..."
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp
ufw --force enable

# 5. Services
if command -v nginx &> /dev/null; then
  echo "⚠️ Host-level Nginx found, disabling it to allow Caddy..."
  systemctl stop nginx || true
  systemctl disable nginx || true
fi

echo "✅ VPS Setup Successful!"
