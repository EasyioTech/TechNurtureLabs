# Tech Nurture Labs - Deployment & Maintenance Guide

This document contains essential commands and procedures for managing the Tech Nurture Labs platform on a VPS.

## 🚀 Quick Deployment
To deploy the latest changes from your local machine to the production VPS:
```bash
# 1. Commit and push local changes
git add .
git commit -m "Deployment update"
git push origin main

# 2. Push to VPS repository
git push vps main

# 3. Remote Rebuild & Restart
ssh root@187.127.132.137 "cd ~/TechNurtureLabs && git reset --hard && docker compose down && docker compose up -d --build"
```

## 🛠️ Maintenance & Troubleshooting

### 🔍 Check System Health
Run this if the website is slow or unreachable:
```bash
# Check container status and open ports
bash ops/doctor.sh
```

### 📋 View Logs
To see real-time errors in the application:
```bash
ssh root@187.127.132.137 "docker compose -f ~/TechNurtureLabs/docker-compose.yml logs -f app"
```

### 💾 Database Management
Backup or inspect the database:
```bash
# Open Postgres interactive shell
ssh root@187.127.132.137 "docker exec -it LMS_postgres psql -U postgres -d technurturelabs"

# Check table schema (e.g., students)
# Inside psql: \d students
```

## 🏗️ Setting up a New VPS
If you are moving to a completely new server, follow these steps:

1. **Initial Setup**: Install Docker and Git on the new server.
2. **Clone Repository**: 
   ```bash
   git clone https://github.com/EasyioTech/TechNurtureLabs.git
   cd TechNurtureLabs
   ```
3. **Configure Environment**: Create a `.env` file with the correct `DATABASE_URL` and `NEXTAUTH_SECRET`.
4. **Initialize Containers**:
   ```bash
   bash ops/deploy.sh --clean
   ```

## 🔑 Key Files
- `ops/deploy.sh`: Orchestrates the build and deployment.
- `ops/doctor.sh`: Runs health checks on the system.
- `docker-compose.yml`: Defines all services (App, DB, Redis, Caddy).
- `src/db/schema.ts`: Defines the database structure.
