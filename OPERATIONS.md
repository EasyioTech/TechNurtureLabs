# 🚀 TechNurture Labs: Master Operations Guide

This is the **Ultimate Developer's Handbook** for managing TechNurture Labs. It contains every command you need for local development, production maintenance, database administration, and emergency disaster recovery.

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

### 🗄️ Database (Drizzle & PostgreSQL)
| Action | Command |
| :--- | :--- |
| **Visual DB Editor** | `npx drizzle-kit studio` | Opens a browser UI to edit your local data. |
| **Push Schema** | `npx drizzle-kit push` | Updates local DB to match `schema.ts`. |
| **Generate Migration** | `npx drizzle-kit generate` | Creates a SQL file for schema changes. |
| **Run Migrations** | `npm run db:migrate` | Applies pending SQL migrations. |

---

## ☁️ 2. Production VPS Management
**VPS IP:** `187.127.132.137` | **SSH:** `ssh root@187.127.132.137`

### 🚀 The "Gold Standard" Deployment
Follow this **EXACTLY** to avoid breaking production:
1. **Local**: `git add . && git commit -m "feat: your change" && git push origin main`
2. **VPS**: `cd /root/TechNurtureLabs && git pull origin main`
3. **VPS (Build)**: `docker compose build app`
4. **VPS (Deploy)**: `docker compose up -d app`

### 📦 Docker Fleet Control
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

## 🕵️ 3. Advanced Debugging & Troubleshooting

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

## 🆘 4. Emergency & Maintenance Utility

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

## 🔐 5. Security & Environment

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

*Handcrafted for TechNurture Labs Developers | v2.0 | 2026-04-04*
