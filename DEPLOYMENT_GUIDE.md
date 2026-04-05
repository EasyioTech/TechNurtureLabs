# TechNurtureLabs LMS — Deployment Guide

**Last Updated:** 2026-04-05  
**Version:** Phase 2 Hardening + Local Storage Removal

---

## 📋 Quick Reference Commands

### Deploy to Staging VPS (187.124.98.192)

```bash
# SSH into staging
ssh staging

# Navigate to project
cd ~/TechNurtureLabs

# Pull latest code from main branch
git pull origin main

# Stop all containers (if running)
docker compose down

# Remove old image to force rebuild
docker image rm technurturelabs-app:latest 2>/dev/null || true

# Build fresh Docker image (no cache)
docker compose build --no-cache app

# Start all services
docker compose up -d

# Verify all containers are healthy (wait 30 seconds)
sleep 30
docker compose ps

# Verify API health
docker exec LMS_caddy wget -q -O - http://app:3000/api/health
```

### Deploy to Production VPS (187.127.132.137)

```bash
# SSH into production
ssh prod

# Navigate to project
cd ~/TechNurtureLabs

# Pull latest code from main branch
git pull origin main

# Stop all containers (if running)
docker compose down

# Remove old image to force rebuild
docker image rm technurturelabs-app:latest 2>/dev/null || true

# Build fresh Docker image (no cache)
docker compose build --no-cache app

# Start all services
docker compose up -d

# Verify all containers are healthy (wait 30 seconds)
sleep 30
docker compose ps

# Verify API health
docker exec LMS_caddy wget -q -O - http://app:3000/api/health
```

### Deploy Locally (Windows/Mac/Linux)

```bash
# Navigate to project directory
cd ~/TechNurtureLabs

# Pull latest code
git pull origin main

# Stop all containers
docker compose down

# Remove old image
docker image rm technurturelabs-app:latest 2>/dev/null || true

# Build fresh Docker image
docker compose build --no-cache app

# Start all services
docker compose up -d

# Wait for health
sleep 30

# Check container status
docker compose ps

# Verify API response
curl http://localhost:3000/api/health
```

---

## 🚀 Full Deployment Sequence (All Three Environments)

Run this to deploy to all environments simultaneously:

```bash
# Deploy LOCAL
docker compose down && \
docker image rm technurturelabs-app:latest 2>/dev/null || true && \
docker compose build --no-cache app && \
docker compose up -d && \
sleep 30 && \
echo "=== LOCAL ===" && \
docker compose ps && \
echo && \

# Deploy STAGING
ssh staging 'cd ~/TechNurtureLabs && \
git pull origin main && \
docker compose down && \
docker image rm technurturelabs-app:latest 2>/dev/null || true && \
docker compose build --no-cache app && \
docker compose up -d && \
sleep 30 && \
docker compose ps' && \
echo "=== STAGING ===" && \
echo && \

# Deploy PRODUCTION  
ssh prod 'cd ~/TechNurtureLabs && \
git pull origin main && \
docker compose down && \
docker image rm technurturelabs-app:latest 2>/dev/null || true && \
docker compose build --no-cache app && \
docker compose up -d && \
sleep 30 && \
docker compose ps' && \
echo "=== PRODUCTION ==="
```

---

## ✅ Verification Checklist After Deployment

After deploying, verify each environment:

```bash
# 1. Check all containers are running
docker compose ps

# Expected output should show all 6 containers as "Up" or "Up (healthy)"

# 2. Verify API health
curl http://localhost:3000/api/health
# OR on VPS: docker exec LMS_caddy wget -q -O - http://app:3000/api/health

# Expected response:
# {"status":"ok","timestamp":"2026-04-05T...","uptime":xxx,"services":{"database":"healthy","redis":"healthy"}}

# 3. Check database connectivity
docker compose exec -T db psql -U postgres -d technurturelabs -c "SELECT 1"

# Expected: Returns a single row with value 1

# 4. Check Redis connectivity
docker exec LMS_redis redis-cli -a redis_dev_password_docker PING

# Expected: PONG

# 5. View app logs for errors
docker logs LMS_app --tail 50 | grep -i error

# Expected: No critical errors (worker restart messages are OK)
```

---

## 🔧 Environment-Specific Variables

### SSH Configuration (.ssh/config)

Add this to your `~/.ssh/config` file for easy SSH access:

```
Host staging
  HostName 187.124.98.192
  User root
  IdentityFile ~/.ssh/id_technurture

Host prod
  HostName 187.127.132.137
  User root
  IdentityFile ~/.ssh/id_technurture
```

Then you can simply run: `ssh staging` or `ssh prod`

### Environment Files

Each environment uses a `.env` file for configuration:

**Staging (.env):**
```
NODE_ENV=production
NEXT_PUBLIC_APP_URL=http://187.124.98.192.nip.io
DATABASE_URL=postgresql://postgres:admin@db:5432/technurturelabs
POSTGRES_USER=postgres
POSTGRES_PASSWORD=technurture_dev_password_docker
POSTGRES_DB=technurturelabs
REDIS_URL=redis://:redis_dev_password_docker@redis:6379
REDIS_PASSWORD=redis_dev_password_docker
DATABASE_APP_ROLE_PASSWORD=app_role_dev_password
[... other config ...]
```

**Production (.env):**
```
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://technurturelms.in
DATABASE_URL=postgresql://postgres:admin@db:5432/technurturelabs
POSTGRES_USER=postgres
POSTGRES_PASSWORD=technurture_dev_password_docker
POSTGRES_DB=technurturelabs
REDIS_URL=redis://:redis_prod_password_docker@redis:6379
REDIS_PASSWORD=redis_prod_password_docker
DATABASE_APP_ROLE_PASSWORD=app_role_prod_password
[... other config ...]
```

---

## 🔒 Security & Local Storage Removal

### What Was Removed

All references to local disk storage have been eliminated:
- ❌ `/api/media/[...path]` — Local file serving endpoint (now returns 501 error)
- ❌ Local storage fallback logic from video streaming
- ❌ Local storage preference from upload hooks
- ❌ Placeholder images for non-R2 storage
- ❌ `local_storage` directory creation in Docker

### What Remains

All media is now **exclusively** Cloudflare R2:
- ✅ `/api/media/r2/[...path]` — R2 file proxy
- ✅ `/api/media/hls/[...path]` — HLS video streaming
- ✅ Cloudflare Stream API for video hosting
- ✅ Server-side storage for favicon/logo only

### Hidden "Local Server" References Still in Code

The following files contain UI labels or type definitions for "Local Server" that should be removed or hidden:

1. **`src/modules/super-admin/components/media-library-picker/library-header.tsx` (Line 94)**
   - UI label: `{ id: 'local', label: 'Local Server', icon: HardDrive }`
   - Status: Dead code (toggle rendered but non-functional)
   - Action: Remove from UI options

2. **`src/modules/super-admin/components/media-library-picker/types.ts` (Line 13)**
   - Type: `storage_type: 'r2' | 'local'`
   - Status: Outdated type definition
   - Action: Change to `storage_type: 'r2'`

3. **`src/modules/super-admin/components/media-library-picker.tsx` (Line 53)**
   - State: `const [storagePref, setStoragePref] = React.useState<'r2' | 'local'>('r2')`
   - Status: Never used
   - Action: Change type to `'r2'` only

4. **`src/modules/super-admin/components/lesson-dialog.tsx` (Line 66)**
   - State: `const [storagePref, setStoragePref] = React.useState<'r2' | 'local'>('r2')`
   - Status: Never used
   - Action: Change type to `'r2'` only

5. **`src/modules/super-admin/components/media-library-picker/asset-grid.tsx` (Line 112)**
   - UI: Renders 'Local' badge for non-R2 assets
   - Status: Dead code (never shown since only R2 assets fetched)
   - Action: Remove local badge rendering

6. **`src/modules/student/actions/lesson-actions.ts` (Line 93)**
   - Fallback: `storage_type: 'local'` in fallback asset
   - Status: Will cause error if triggered
   - Action: Change to `storage_type: 'r2'` or remove fallback

7. **`src/db/schema.ts` (Enum definition)**
   - Status: Already updated to R2-only, comment shows 'local' was removed
   - Action: Verify enum only contains `['r2']`

---

## 📝 Files to Update (Manual Changes)

Run these commands one by one to update the remaining "local server" references:

### Step 1: Update library-header.tsx

```bash
cd ~/TechNurtureLabs

# Remove 'local' option from storage destinations toggle
# Line 94 should change from:
# { id: 'local', label: 'Local Server', icon: HardDrive },
# To: (remove this line entirely)

# Then verify it looks right
grep -n "Local Server" src/modules/super-admin/components/media-library-picker/library-header.tsx
```

### Step 2: Update types.ts

```bash
# Change storage_type type from 'r2' | 'local' to just 'r2'
# Line 13 should change from:
# storage_type: 'r2' | 'local';
# To:
# storage_type: 'r2';

grep -n "storage_type" src/modules/super-admin/components/media-library-picker/types.ts
```

### Step 3: Update media-library-picker.tsx

```bash
# Change storagePref state type from 'r2' | 'local' to just 'r2'
# Line 53 should change from:
# const [storagePref, setStoragePref] = React.useState<'r2' | 'local'>('r2');
# To:
# const [storagePref, setStoragePref] = React.useState<'r2'>('r2');

grep -n "storagePref" src/modules/super-admin/components/media-library-picker.tsx | head -3
```

### Step 4: Update lesson-dialog.tsx

```bash
# Change storagePref state type from 'r2' | 'local' to just 'r2'
# Line 66 should change from:
# const [storagePref, setStoragePref] = React.useState<'r2' | 'local'>('r2');
# To:
# const [storagePref, setStoragePref] = React.useState<'r2'>('r2');

grep -n "storagePref" src/modules/super-admin/components/lesson-dialog.tsx | head -3
```

### Step 5: Update asset-grid.tsx

```bash
# Remove the HardDrive icon and 'Local' badge rendering
# Lines 107-112 should be simplified to only show R2 icon and label

grep -n "HardDrive\|'Local'" src/modules/super-admin/components/media-library-picker/asset-grid.tsx
```

### Step 6: Update lesson-actions.ts

```bash
# Change fallback asset storage_type from 'local' to 'r2'
# Line 93 should change from:
# lesson.asset ? (lesson.asset as any) : { storage_type: 'local', file_path: lesson.content_url || '' },
# To:
# lesson.asset ? (lesson.asset as any) : { storage_type: 'r2', file_path: lesson.content_url || '' },

grep -n "storage_type: 'local'" src/modules/student/actions/lesson-actions.ts
```

---

## 🔄 After Making Changes

```bash
# 1. Stage your changes
git add -A

# 2. Commit with a clear message
git commit -m "fix(storage): Remove all 'Local Server' UI references - R2 exclusive"

# 3. Push to main
git push origin main

# 4. Deploy to all environments using the deployment commands above
# (See "Full Deployment Sequence" section)
```

---

## 📊 Deployment Status Tracking

After each deployment, document the status:

| Date | Environment | Status | Git Commit | Notes |
|------|-------------|--------|-----------|-------|
| 2026-04-05 | Local | ✅ Healthy | c6bb5c5 | All containers running |
| 2026-04-05 | Staging | ✅ Healthy | c6bb5c5 | App healthy, workers restarting |
| 2026-04-05 | Production | ✅ Healthy | c6bb5c5 | App healthy, workers restarting |

---

## 🚨 Troubleshooting

### Containers failing to start

```bash
# Check logs
docker compose logs app

# If database connection fails
docker compose logs db

# If Redis connection fails
docker compose logs redis

# Restart all services
docker compose down && docker compose up -d
```

### Build failures

```bash
# Clean build
docker compose down
docker image prune -f
docker compose build --no-cache app

# If that fails, check Node version
docker run node:20-slim node --version
```

### Database issues

```bash
# Check database health
docker compose exec -T db pg_isready -U postgres

# Check schema exists
docker compose exec -T db psql -U postgres -d technurturelabs -c "\dt"
```

### Redis issues

```bash
# Test Redis connection
docker exec LMS_redis redis-cli PING

# With password
docker exec LMS_redis redis-cli -a redis_dev_password_docker PING
```

---

## 📞 Support

If deployment fails:
1. Check container logs: `docker compose logs [service-name]`
2. Verify .env variables are set correctly
3. Ensure git pull succeeded: `git log -1`
4. Try clean rebuild: `docker compose build --no-cache`
5. Check disk space: `df -h`

---

**End of Deployment Guide**
