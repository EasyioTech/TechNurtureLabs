# 🚀 TechNurture Labs — Deployment Ready

**Status:** ✅ **FULLY OPERATIONAL**

---

## Local Development Environment

### ✅ Running Successfully

```
✓ LMS_app (Next.js) — Healthy
✓ LMS_postgres (Database) — Healthy  
✓ LMS_redis (Cache) — Healthy
✓ LMS_event_worker (Background Jobs) — Healthy
✓ LMS_stats_worker (Metrics) — Healthy
✓ LMS_caddy (Reverse Proxy) — Healthy
```

### What Works

- **App is accessible** — `http://localhost` (via Caddy reverse proxy)
- **Database initialized** — all migrations applied automatically
- **Seeded data** — Admin account, payment plans, platform settings
- **Local dev** — `npm run dev` works without Redis
- **Docker production** — `docker-compose up` fully self-contained

---

## VPS Deployment Instructions

### Prerequisites on VPS

- Docker installed
- Docker Compose installed
- Git installed
- Root or sudo access

### Deployment Steps

```bash
# 1. Clone repository (if not already done)
git clone https://github.com/EasyioTech/TechNurtureLabs.git
cd TechNurtureLabs

# 2. Copy production environment (CRITICAL)
cp .env.production .env

# 3. Fix Redis memory management
sysctl vm.overcommit_memory=1
echo "vm.overcommit_memory = 1" | sudo tee -a /etc/sysctl.conf

# 4. Clean deployment
docker compose down -v  # Remove old volumes
docker compose build --no-cache
docker compose up -d

# 5. Wait and verify
sleep 30
docker compose ps      # All should be "Up"
docker logs LMS_app    # Should see "✓ Ready in XXXms"
```

### What Happens Automatically

1. ✅ **Database migrations** — Drizzle applies all schema changes
2. ✅ **Data seeding** — Admin user, classes, payment plans created
3. ✅ **Workers start** — Event processor, stats flusher running
4. ✅ **TLS certificate** — Let's Encrypt auto-provisioning
5. ✅ **Health checks pass** — All services healthy

### Verify Deployment Success

```bash
# Check all containers are healthy
docker compose ps
# Should show all "Healthy" or "Up"

# Check app logs
docker logs LMS_app | tail -20
# Should see: "✓ Ready in XXXms"

# Test the app
curl http://localhost
# Should return HTML (status 200)
```

---

## Critical Environment Variables

These are already set in `.env.production`:

| Variable | Value | Why |
|----------|-------|-----|
| `JWT_SECRET` | 32+ chars | Authentication token signing |
| `APP_ENCRYPTION_KEY` | 64 hex chars | 2FA secret encryption |
| `DATABASE_URL` | `postgresql://postgres:admin@db:5432/technurturelabs` | Docker network DB |
| `REDIS_URL` | `redis://redis:6379` | Docker network Redis |
| `RAZORPAY_KEY_ID` | Live key | Payment processing (update if needed) |
| `NODE_ENV` | `production` | Enables optimizations |

**⚠️ IMPORTANT:** Never run production without `.env` file. Always copy `.env.production` to `.env`.

---

## What Was Fixed

### Database Migrations (Critical)
- ❌ **Was:** Migrations tried to recreate tables → "relation already exists" errors
- ✅ **Now:** Drizzle tracking ensures idempotent migrations

### Redis Connectivity (Critical)
- ❌ **Was:** App crashed if Redis not ready
- ✅ **Now:** Entrypoint waits for Redis, workers gracefully handle timeouts

### Worker Reliability
- ❌ **Was:** Stats worker crashed on startup
- ✅ **Now:** Proper Redis connection wait + error recovery

### Local Development
- ❌ **Was:** Needed Redis running locally for `npm run dev`
- ✅ **Now:** `REDIS_URL=""` disables Redis for local dev (rate limiting fails open)

---

## Admin Credentials

After deployment, log in at `https://yourdomain.com/admin-portal/login`:

```
Email: admin@technurture.com
Password: AdminPassword123!
```

**⚠️ CHANGE THIS IMMEDIATELY after first login!**

---

## Monitoring

Monitor the system with:

```bash
# Live app logs
docker logs -f LMS_app

# Database health
docker exec LMS_postgres pg_isready

# Redis health
docker exec LMS_redis redis-cli ping

# All services health
docker compose ps

# Resource usage
docker stats
```

---

## Rollback Plan

If something goes wrong:

```bash
# Keep data, restart
docker compose restart

# Reset database (⚠️ DANGEROUS - loses all data)
docker compose down -v
docker compose up -d

# View errors
docker logs LMS_app
docker logs LMS_postgres
```

---

## Performance Notes

- **Database:** PostgreSQL 15 with automatic partitioning for audit logs
- **Cache:** Redis 7 with in-memory caching
- **Queue:** BullMQ for background jobs (achievements, streaks, challenges)
- **Static:** Next.js serving optimized assets via Caddy

---

## Security Checklist

- [ ] Change super admin password
- [ ] Update Razorpay keys (if using production Razorpay)
- [ ] Configure Cloudflare R2 (optional, uses local storage fallback)
- [ ] Enable HTTPS (automatic via Let's Encrypt)
- [ ] Backup database regularly
- [ ] Monitor logs for suspicious activity

---

## Support

If deployment fails:

1. Check `.env` exists and has `JWT_SECRET` set
2. Check migrations directory: `ls drizzle/0000*.sql`
3. View app logs: `docker logs LMS_app`
4. Verify disk space: `df -h`
5. Check Docker: `docker ps -a`

---

**Last Updated:** 2026-04-01  
**Status:** Ready for Production  
**Docker Image:** `technurturelabs-app:latest`
