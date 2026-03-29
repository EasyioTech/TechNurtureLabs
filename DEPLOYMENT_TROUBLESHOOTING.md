# 🚀 TechNurture LMS — "Never Suffer Again" Deployment Guide

This guide ensures a stable, error-free deployment on **any** VPS (Hostinger, AWS, DigitalOcean, etc.).

---

## 🏗️ 1. Setup a Brand New VPS (One-Time)
If you've just bought a new VPS and it's empty, run this command **first** to install Docker, configure the firewall, and disable conflicting host-level Nginx:

```bash
cd TechNurtureLabs
bash scripts/setup-vps.sh
```

## 🚢 2. Standard Deployment (Production)
Use the simplified `deploy.sh`. It now automatically detects port conflicts and lets Docker handle the service startup logic.

```bash
bash deploy.sh
```

## 🛠️ 3. "Fix Everything" Command
If the site is not loading or you face errors, run the **VPS Doctor**. It will diagnose exactly why the app or proxy is failing:

```bash
bash scripts/vps-doctor.sh
```

---

## 🔍 Common Fixes & Permanent Resolutions

### ❌ Problem: "Port 80 is occupied"
**Why**: Hostinger/other providers often pre-install Nginx on the host machine, which blocks LMS Caddy from starting.
**Fix**: `systemctl stop nginx && systemctl disable nginx` (The setup-vps script does this automatically).

### ❌ Problem: "Redis Connection Refused"
**Why**: The event-worker tries to connect too fast during startup.
**Permanent Fix**: I have updated `scripts/event-worker.ts` to wait for the "Ready" signal from Redis before starting.

### ❌ Problem: "Page can't be reached"
**Why**: Caddy fails to start if the app isn't healthy.
**Permanent Fix**: I modified `deploy.sh` to use Docker's native dependency system. Caddy will now keep trying until the app is healthy, ensuring the site eventually comes online without manual intervention.

### ❌ Problem: "Database not initialized"
**Why**: First-time deployments on fresh volumes need schema application.
**Fix**: `bash deploy.sh --clean` (This wipes old experimental data and applies the fresh schema from `database/schema.sql`).

---

## 📊 Deployment Cheat Sheet

| Task | Command |
| :--- | :--- |
| **Normal Update** | `bash deploy.sh` |
| **Critical Reset** | `bash deploy.sh --clean` |
| **Check Health** | `bash scripts/vps-doctor.sh` |
| **Check Logs** | `docker compose logs -f --tail 50` |
| **Check DB** | `docker exec LMS_postgres pg_isready -U postgres` |

```bash
# How to view real-time logs for a specific service:
docker compose logs -f app
docker compose logs -f caddy
```

---
**Last Updated**: March 29, 2026
**Status**: Architecture simplified for maximum resilience.
