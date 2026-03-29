#!/bin/bash
# ============================================================
# TechNurture Labs — Initial VPS Environment Setup
# ============================================================
# This script installs Docker and Docker-Compose dependencies
# needed to run the LMS on a brand new VPS (Ubuntu/Debian).
# ============================================================

set -e

echo "🚀 Starting TechNurture LMS - Environment Setup"

# 1. Update system packages
echo "Updating system..."
apt-get update && apt-get upgrade -y

# 2. Install required packages
echo "Installing prerequisites..."
apt-get install -y ca-certificates curl gnupg lsb-release git ufw lsof htop

# 3. Install Docker
if ! command -v docker &> /dev/null; then
  echo "Installing Docker..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
fi

# 4. Open Firewall Ports
echo "Opening firewall (80, 443, 22)..."
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp
ufw --force enable

# 5. Disable host-level Nginx if present to avoid port 80 conflicts
if command -v nginx &> /dev/null; then
  echo "⚠️ Host-level Nginx found, disabling it to allow Caddy container..."
  systemctl stop nginx || true
  systemctl disable nginx || true
fi

echo "=================================================="
echo "✅ VPS Setup Successful!"
echo "Next steps:"
echo "1. Create your .env file: cp .env.example .env"
echo "2. Edit your .env with proper secrets"
echo "3. Run your first deployment: bash deploy.sh --clean"
echo "=================================================="
