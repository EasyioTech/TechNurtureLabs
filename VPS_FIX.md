# 🚨 VPS DEPLOYMENT FIX (URGENT)

Your VPS is crashing due to missing environment variables. Here's the exact fix:

## Step 1: Copy production environment file

On the VPS, run:

```bash
cd ~/TechNurtureLabs
cp .env.production .env
```

## Step 2: Verify migration files exist

```bash
ls -la drizzle/0000_*.sql
```

Should show:
- `0000_friendly_shatterstar.sql` (50KB)
- `0001_yummy_azazel.sql` (91 bytes)

If missing, pull latest from git:

```bash
git pull origin main
```

## Step 3: Fix Redis memory overcommit (critical)

```bash
sysctl vm.overcommit_memory=1
echo "vm.overcommit_memory = 1" | sudo tee -a /etc/sysctl.conf
```

## Step 4: Clean rebuild

```bash
docker compose down -v
docker compose build --no-cache
docker compose up -d
```

## Step 5: Verify system is healthy

```bash
docker compose ps
docker logs LMS_app -f
```

Wait for: `✓ Ready in XXXms`

---

## What was wrong?

1. **JWT_SECRET=""** → Environment validation failed (auth system broken)
2. **Migration files not in image** → Drizzle failed to initialize DB
3. **REDIS_URL=""** → App crashed, workers crashed
4. **Redis memory warning** → Potential data loss under load

---

## What you're doing

The `.env.production` file already exists in your repo with proper secrets. You just need to:
- Copy it to `.env` on VPS
- Rebuild the Docker image
- Let Docker do the rest (migrations, seeding, etc are automatic)

**No npm or Node installation needed on VPS. Docker handles everything.**

