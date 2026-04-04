# 🚀 TechNurture Labs: Operations & Fleet Management

This guide contains the essential commands for managing both the local development environment and the production VPS.

---

## 💻 Local Development Commands
Run these from your local machine terminal (`c:\Users\cristy's\TechNurtureLabs`).

### 🛠️ Setup & Maintenance
| Action | Command |
| :--- | :--- |
| **Install Dependencies** | `npm install --legacy-peer-deps` |
| **Start Dev Server** | `npm run dev` |
| **Local Production Build** | `npm run build` |
| **Lint Check** | `npm run lint` |
| **Clean Build Cache** | `Remove-Item -Recurse -Force .next` |

### 🗄️ Database (Drizzle)
| Action | Command |
| :--- | :--- |
| **Generate Migration** | `npx drizzle-kit generate` |
| **Push Schema to Local DB** | `npx drizzle-kit push` |
| **Open DB Studio** | `npx drizzle-kit studio` |

---

## ☁️ Production VPS Operations
**VPS IP:** `187.127.132.137`
**SSH Command:** `ssh root@187.127.132.137`

### 🚀 Standard Deployment (Clean Way)
Always use this workflow to ensure production matches your local code.

1. **On Local Machine**:
   ```powershell
   git add .
   git commit -m "Your update message"
   git push origin main
   ```

2. **On VPS (via SSH)**:
   ```bash
   cd /root/TechNurtureLabs
   git pull origin main
   # If there are conflicts, run: git reset --hard origin/main
   docker compose build app
   docker compose up -d app
   ```

### 🛠️ Container Management
| Operation | Command |
| :--- | :--- |
| **View All Services** | `docker ps` |
| **Check App Health** | `docker logs -f LMS_app` |
| **Check Proxy Health** | `docker logs -f LMS_caddy` |
| **Restart Everything** | `docker compose restart` |
| **Stop Production** | `docker compose down` |
| **Start Production** | `docker compose up -d` |

### 🔍 Debugging & Deep Inspection
| Need | Command |
| :--- | :--- |
| **Check App Errors** | `docker logs --tail 100 LMS_app` |
| **Check Database Logs** | `docker logs LMS_postgres` |
| **Prune Old Images** | `docker image prune -af` (Frees up disk space) |
| **Enter App Container** | `docker exec -it LMS_app /bin/bash` |
| **Enter DB Terminal** | `docker exec -it LMS_postgres psql -U your_db_user` |

---

## 🤫 Secret & Utility Operations

### 🔑 SSL / Certificate Management
If the site is unreachable due to SSL:
```bash
# Check Caddy status
docker logs LMS_caddy 
# Force restart proxy
docker compose restart caddy
```

### 🧹 Hard Reset VPS (Nuclear Option)
If files on VPS are corrupted or dirty:
```bash
cd /root/TechNurtureLabs
git fetch --all
git reset --hard origin/main
docker compose up -d --build --force-recreate
```

### 📊 Production Stats Check
```bash
docker stats  # Shows CPU/RAM usage of every service
```

---

*Last Updated: 2026-04-04*
