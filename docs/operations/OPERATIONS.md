# 🚀 TechNurture Labs: Master Operations Guide

This is the **Ultimate Developer's Handbook** for managing TechNurture Labs. It contains every command you need for local development, production maintenance, database administration, and emergency disaster recovery.

---

## 🛡️ STRICT DEPLOYMENT PROTOCOL
> [!IMPORTANT]
always access my vps server if needed using the command 'ssh prod' you will directly land in the directory of my project which is TechNurtureLabs
---

## 🏗️ 1. Local Development Suite
Run these from `c:\Users\cristy's\TechNurtureLabs`.

### 🛠️ Core Commands
| Action | Command | Why? |
| :--- | :--- | :--- |
| **Full Setup** | `npm install --legacy-peer-deps` | Installs everything safely. |
| **Power Start** | `npm run dev` | Starts local dev server with HMR. |
| **Verify Build** | `npm run build` | Checks for errors before deployment. |
| **Deep Clean** | `Remove-Item -Recurse -Force .next, node_modules` | Fixes "weird" build or dependency bugs. |
| **Lint Everything** | `npm run lint` | Ensures code style and types are perfect. |

---

## 🔑 1b. SSH Key Setup (No More Passwords!)
To log into your VPS servers without entering a password every time, follow these steps on your **Local Computer (Windows)**:

### 1. Generate Your Key Pair
Open PowerShell and run:
```powershell
ssh-keygen -t ed25519 -f "$HOME\.ssh\id_technurture"
# Press Enter for all prompts (no passphrase needed for simplicity)
```

### 2. Copy Key to VPS
For **each** VPS (Production & Staging), run this command:
```powershell
# Run Once for Production (Real)
Get-Content "$HOME\.ssh\id_technurture.pub" | ssh root@187.127.132.137 "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"

# Run Once for Staging (Test)
Get-Content "$HOME\.ssh\id_technurture.pub" | ssh root@187.124.98.192 "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

### 3. (Optional) Create a Shortcut
Create or edit `C:\Users\cristy's\.ssh\config` and add:
```text
Host prod
  HostName 187.127.132.137
  User root
  IdentityFile ~/.ssh/id_technurture

Host staging
  HostName 187.124.98.192
  User root
  IdentityFile ~/.ssh/id_technurture
```
**Now you can just type:** `ssh prod` or `ssh staging` and you're in!

---

### 🗄️ Database (Drizzle & PostgreSQL)
| Action | Command |
| :--- | :--- |
| **Visual DB Editor** | `npx drizzle-kit studio` | Opens a browser UI to edit your local data. |
| **Push Schema** | `npx drizzle-kit push` | Updates local DB to match `schema.ts`. |
| **Generate Migration** | `npx drizzle-kit generate` | Creates a SQL file for schema changes. |
| **Run Migrations** | `npm run db:migrate` | Applies pending SQL migrations. |

---

## ☁️ 2. VPS Infrastructure Management

> [!CAUTION]
> **STRICT PROTOCOL**: Always test on **Staging** first. Never update **Production** until Staging is confirmed 100% flawless.

| Environment | VPS IP | SSH Access | Purpose |
| :--- | :--- | :--- | :--- |
| **Production** | `187.127.132.137` | `ssh prod` | **Live Traffic** |
| **Staging** | `187.124.98.192` | `ssh staging` | **Pre-Production Testing** |

---

## 🚀 3. Deployment Pipelines

To ensure stability, we now follow a **Staging-First** deployment strategy.

### 🧪 Pipeline A: The Staging Deploy (Beta Testing)
Use this to confirm your changes work "in the wild" before they hit the real students.
1. **Local**: `git add . && git commit -m "feat: new feature" && git push origin main` 
   *(Note: You can also use a dedicated `staging` branch if you prefer)*.
2. **Staging VPS**: `cd /root/TechNurtureLabs && git pull origin main`
3. **Staging VPS (Build)**: `docker compose build app`
4. **Staging VPS (Deploy)**: `docker compose up -d app`
5. **Verify**: Open your staging URL (or VPS IP) and test all critical flows.

### 🏆 Pipeline B: The Production Deploy (The "Gold Standard")
Only run this **AFTER** confirming success on the Staging VPS.
1. **Production VPS**: `cd /root/TechNurtureLabs && git pull origin main`
2. **Production VPS (Build)**: `docker compose build app`
3. **Production VPS (Deploy)**: `docker compose up -d app`

---

## 📦 4. Docker Fleet Control
| Operation | Command |
| :--- | :--- |
| **Status Dashboard** | `docker ps` |
| **Resource Usage** | `docker stats` (Monitor RAM/CPU live) |
| **Restart App** | `docker compose restart app` |
| **Stop All Services** | `docker compose down` |
| **Start All Services** | `docker compose up -d` |
| **View App Logs** | `docker logs -f LMS_app` |
| **View Proxy Logs** | `docker logs -f LMS_caddy` |

---

## 🕵️ 5. Advanced Debugging & Troubleshooting

### 🔍 Investigating Crashes
| Scenario | Command on VPS |
| :--- | :--- |
| **App is 500 error** | `docker logs --tail 200 LMS_app` |
| **Site is Offline** | `docker logs LMS_caddy` |
| **DB Connection Error** | `docker logs LMS_postgres` |
| **Redis Sync Error** | `docker logs LMS_redis` |

### 🐚 Shell Access (Internal Container)
Sometimes you need to run commands *inside* the running app:
```bash
# Enter the App Container
docker exec -it LMS_app /bin/bash

# Inside the container, you can check files or environment variables:
ls -la
env | grep NEXT_PUBLIC
```

### 🗃️ Production Database Access
```bash
# Enter the DB Console (direct SQL access)
docker exec -it LMS_postgres psql -U technurture_user -d technurture_db

# Useful SQL inside psql:
# \dt -> list tables
# select count(*) from students; -> check student count
# \q -> exit
```

---

## 🆘 6. Emergency & Maintenance Utility

### 🧹 Disk Space Cleanup (Very Important!)
Docker builds consume a lot of space. Run this once a month:
```bash
# Removes all unused images, containers, and build cache
docker system prune -af --volumes
```

### 🛰️ SSL / Domain Reset
If SSL fails to renew or subdomains are broken:
```bash
cd /root/TechNurtureLabs
# Edit Caddyfile if needed
nano Caddyfile 
# Reload Caddy without stopping (Zero Downtime)
docker exec LMS_caddy caddy reload --config /etc/caddy/Caddyfile
```

### ☢️ The "Nuclear" Reset (Start Over)
If the VPS code is messed up beyond repair:
```bash
cd /root/TechNurtureLabs
git fetch --all
git reset --hard origin/main
docker compose down
docker compose up -d --build --force-recreate
```

---

## 🔐 7. Security & Environment

### 📝 Updating Secrets (.env)
1. **Local**: Edit `.env` or `.env.production`.
2. **VPS**: 
   ```bash
   nano /root/TechNurtureLabs/.env.production
   # Update variables, then save (Ctrl+O, Enter, Ctrl+X)
   docker compose up -d --force-recreate app
   ```

### 📁 Backup Procedures
To backup the production database to a file:
```bash
docker exec LMS_postgres pg_dump -U technurture_user technurture_db > backup_$(date +%F).sql
```

---

## 🛠️ 8. Initial Setup: Staging VPS
If you've just bought a new VPS, follow these steps to prepare it for deployment:

### ⚡ 1. Install Docker & Prerequisites
Run this on your new VPS bash shell:
```bash
# Update system
apt update && apt upgrade -y
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh
# Final check
docker --version && docker compose version
```

### 🧬 2. Clone Your Repository
```bash
# Set up working directory
mkdir -p /root/TechNurtureLabs
git clone [YOUR_REPO_URL] /root/TechNurtureLabs
cd /root/TechNurtureLabs
```

### 📝 3. Environment Variables (Staging Mode)
Copy the production template as a starting point:
```bash
cp .env.production .env
nano .env
```
**CRITICAL**: In the `nano` editor, update these values:
- `NEXT_PUBLIC_APP_URL` -> Set to your new VPS IP or staging subdomain.
- `JWT_SECRET` -> Generate a new unique secret.
- `APP_ENCRYPTION_KEY` -> Generate a new unique key.

### 🍱 4. Launch the Environment
```bash
# Build and run the entire stack in the background
docker compose up -d --build
```

---

*Handcrafted for TechNurture Labs Developers | v2.0 | 2026-04-04*
