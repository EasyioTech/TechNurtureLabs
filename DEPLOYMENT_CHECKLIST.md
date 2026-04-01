# 🚀 VPS Deployment Checklist — Fresh Start

## What We Fixed

✅ **Cleared Broken Migration History**
- Deleted old migrations: `0000_friendly_shatterstar.sql`, `0001_yummy_azazel.sql`
- Generated fresh single migration: `0000_parched_prima.sql` (all 44 tables in one file)
- Updated `.gitignore` to include `drizzle/*.sql` in version control

✅ **Seed Script Ready**
- Admin user: `admin@technurture.com` / `AdminPassword123!`
- 3 Payment Plans (Starter, Standard Scholar, Elite Institutional)
- Platform Settings (TechNurture Labs, support@technurture.io, INR currency)
- All seeded on first app startup

✅ **Environment Variables**
- Generated secure JWT_SECRET and APP_ENCRYPTION_KEY
- Stored in `.env.production` (copy to `.env` on VPS)

---

## Deployment Steps

### On Your Local Machine
```bash
# Everything is already committed and pushed to GitHub
# Just verify:
git log --oneline -5
# Should see: "feat(db): regenerate migrations from scratch with clean schema"
```

### On Your VPS

**1. SSH into VPS:**
```bash
ssh root@187.127.132.137
```

**2. Navigate to project:**
```bash
cd ~/TechNurtureLabs
```

**3. Pull latest code:**
```bash
git pull origin main
```

**4. Run deployment script:**
```bash
chmod +x VPS_DEPLOY.sh
./VPS_DEPLOY.sh
```

This script will:
- ✅ Copy `.env.production` → `.env`
- ✅ Fix Redis kernel setting (`vm.overcommit_memory=1`)
- ✅ Stop and clean Docker containers
- ✅ Build image from scratch
- ✅ Start all containers
- ✅ Wait for app health check
- ✅ Show admin credentials

---

## After Deployment

### 1. Verify Application Health
```bash
# Check logs in real-time
docker compose logs -f LMS_app

# Should see:
# ✅ Database migrations completed successfully
# ✅ Database seeding completed successfully
# 🎯 Starting application server...
```

### 2. Login to Admin Panel
1. Open https://technurturelms.in
2. Click **Admin Login**
3. Email: `admin@technurture.com`
4. Password: `AdminPassword123!`
5. **Change password immediately!**

### 3. Verify Seeded Data
In admin panel, check:
- **Settings** → Platform name = "TechNurture Labs" ✅
- **Payment Plans** → 3 plans visible ✅
  - Starter LMS (₹9,999)
  - Standard Scholar (₹24,999) — marked "Popular"
  - Elite Institutional (₹49,999)
- **Classes** → Classes 1-12 listed ✅

### 4. Check Worker Status
```bash
# Event Worker (for achievements, challenges)
docker compose logs LMS_event_worker

# Stats Worker (for metrics)
docker compose logs LMS_stats_worker

# Both should be running with no critical errors
```

---

## Troubleshooting

### If app crashes on startup:

**Check migration errors:**
```bash
docker compose logs LMS_app | grep -i "migration"
```

**Check environment variables:**
```bash
docker compose logs LMS_app | grep -i "jwt_secret\|encryption"
```

**View full logs:**
```bash
docker compose logs LMS_app | tail -100
```

### If database won't connect:

```bash
# Check Postgres is healthy
docker compose ps | grep postgres

# Check database exists
docker compose exec db psql -U postgres -d technurturelabs -c "SELECT 1"
```

### If containers fail to start:

```bash
# Stop everything
docker compose down

# Clean volumes
docker volume rm technurturelabs_postgres_data technurturelabs_redis_data

# Rebuild and restart
docker compose build --no-cache
docker compose up
```

---

## Environment Variables Reference

**In `.env` on VPS:**

| Variable | Value | Notes |
|----------|-------|-------|
| `NODE_ENV` | `production` | Required |
| `DATABASE_URL` | `postgresql://postgres:admin@db:5432/technurturelabs` | Internal Docker network |
| `JWT_SECRET` | 64-char hex | **MUST be 32+ chars** (already set) |
| `APP_ENCRYPTION_KEY` | 64-char hex | For 2FA secrets encryption |
| `NEXT_PUBLIC_APP_URL` | `https://technurturelms.in` | Update if domain changes |
| `RAZORPAY_KEY_ID` | Your live key | Optional — keep empty if not using |
| `CLOUDFLARE_*` | Your credentials | Optional — uses local storage fallback |

---

## What's Inside the Migration

**Single file migration (`0000_parched_prima.sql`):**
- 44 tables created
- 15 PostgreSQL ENUM types
- Proper indexes, foreign keys, constraints
- Support for partitioned `audit_logs` table
- All enums, defaults, and checks included

**NO SQL split across multiple files** — This was the root cause of the original crashes!

---

## Rollback (if needed)

If you need to revert to the previous state:

```bash
git revert HEAD
git push origin main
# Then redeploy
```

But we recommend staying on the fresh migration — it's cleaner and more stable.

---

## Next Steps

After successful deployment:

1. ✅ Verify all containers running
2. ✅ Test admin login
3. ✅ Create a test school and class
4. ✅ Create a course and lesson
5. ✅ Enroll a student
6. ✅ Test student dashboard

Monitor logs for any warnings or errors:
```bash
docker compose logs -f
```

---

## Questions?

Check the logs:
```bash
docker compose logs [container_name]
```

View running containers:
```bash
docker compose ps
```

Stop everything:
```bash
docker compose down
```

---

**Happy deploying! 🎉**
