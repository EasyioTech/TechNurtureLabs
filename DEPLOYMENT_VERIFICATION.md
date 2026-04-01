# Deployment Verification & Testing Guide

## Overview

This guide explains how to verify that the TechNurture LMS deployment works correctly with all initial data properly seeded. This includes automatic admin account creation, payment plans, classes, and platform settings.

---

## 🧪 Complete Deployment Test Sequence

### Prerequisites
- VPS with Ubuntu 20.04+ running
- SSH access as root or with sudo
- Domain: **technurturelms.in** (or your configured domain in `.env.production`)
- Port 80 and 443 available

### Step 1: Prepare Environment
```bash
# SSH into your VPS
ssh root@your-vps-ip

# Navigate to project
cd /root/technurture-lms

# Create .env.production with required values
cat > .env.production << 'EOF'
# Database
DATABASE_URL=postgresql://postgres:admin@db:5432/technurturelabs
POSTGRES_USER=postgres
POSTGRES_PASSWORD=admin
POSTGRES_DB=technurturelabs

# Redis
REDIS_URL=redis://redis:6379

# Security
JWT_SECRET=your-secure-random-key-min-32-chars-long-security-key
APP_ENCRYPTION_KEY=your-encryption-key-min-16-chars
MEDIA_SECRET=your-media-secret-key

# Application
NEXT_PUBLIC_APP_URL=https://technurturelms.in
NODE_ENV=production

# Deployment
CADDY_DOMAIN=technurturelms.in

# Payment (optional for testing)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# Storage (R2 or local)
STORAGE_TYPE=local
LOCAL_STORAGE_DIR=/app/local_storage

# Cron Security
CRON_SECRET=your-cron-secret-key
EOF
```

### Step 2: Run Clean Deployment
```bash
# Run clean deployment (deletes everything and rebuilds)
bash ops/deploy.sh --clean

# This will:
# 1. Pull latest code
# 2. Stop all containers
# 3. Remove all volumes (clean slate)
# 4. Rebuild all Docker images without cache
# 5. Start all services (Database, Redis, App, Workers, Caddy)
# 6. Wait for app to be healthy
# 7. Automatically seed initial data
```

### Step 3: Expected Output
```
🌱 Seeding initial data (Admin, Payment Plans, Settings, Classes)...

═══════════════════════════════════════════════════════════════
🎉 DEPLOYMENT COMPLETE & SEEDED
═══════════════════════════════════════════════════════════════

📋 INITIAL CREDENTIALS:
   Email:    admin@technurture.com
   Password: AdminPassword123!

⚠️  IMPORTANT: Change this password immediately after first login!

🌐 ACCESS POINTS:
   Admin Portal:        https://admin.technurturelms.in
   Student Dashboard:   https://school.technurturelms.in

✅ Payment Plans Created:
   1. Starter LMS (₹9,999/year - 100 students)
   2. Standard Scholar (₹24,999/year - 500 students) - POPULAR
   3. Elite Institutional (₹49,999/year - Unlimited)

📊 DATABASE READY with:
   ✓ Super Admin Account
   ✓ 12 Classes (Class 1-12)
   ✓ 3 Payment Plans
   ✓ Platform Settings

🚀 System is ready for use!
═══════════════════════════════════════════════════════════════
```

---

## ✅ Verification Checklist

### 1. Verify Services Running
```bash
# Check all containers
docker compose ps

# Expected output:
# NAME          STATUS      PORTS
# LMS_caddy     healthy     0.0.0.0:80->80, 0.0.0.0:443->443
# LMS_app       healthy     3000
# LMS_postgres  healthy     5432
# LMS_redis     healthy     6379
# LMS_event_worker  running
# LMS_stats_worker   running
```

### 2. Verify Database Seeded
```bash
# Access database
docker compose exec db psql -U postgres -d technurturelabs

# Run these commands:
SELECT COUNT(*) FROM super_admins;           -- Should be: 1
SELECT COUNT(*) FROM classes;                -- Should be: 12
SELECT COUNT(*) FROM payment_plans;          -- Should be: 3
SELECT * FROM platform_settings WHERE id='global';  -- Should exist
SELECT * FROM super_admins WHERE email='admin@technurture.com';
```

### 3. Verify Admin Access
```bash
# Test admin login
curl -X POST https://admin.technurturelms.in/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@technurture.com",
    "password": "AdminPassword123!"
  }'

# Expected: JWT token in response
```

### 4. Verify Application Health
```bash
# Check app health endpoint
curl https://admin.technurturelms.in/

# Should return HTML (login page) with status 200
```

### 5. Verify Redis Sessions
```bash
# Access Redis CLI
docker compose exec redis redis-cli

# Check commands
KEYS *           -- Should show session keys
PING            -- Should respond PONG
```

### 6. Verify Database Connections
```bash
# Check database logs
docker compose logs db

# Look for: "database system is ready to accept connections"
```

### 7. Verify Media Storage
```bash
# Check local storage directory was created
docker compose exec app ls -la /app/local_storage

# Should exist and be writable
```

---

## 🐛 Troubleshooting

### Issue: "App is not healthy"
```bash
# Check application logs
docker compose logs app --tail 100

# Common causes:
# 1. Database not ready - wait longer
# 2. Environment variables missing - check .env.production
# 3. Port conflict - check ports 80, 443
```

### Issue: "Seeding failed"
```bash
# Check detailed error
docker compose logs app | grep -i "seed\|error"

# Run seed manually
docker compose exec app npm run db:seed

# Check if database is accessible
docker compose exec db psql -U postgres -c "SELECT 1"
```

### Issue: "Cannot connect to database"
```bash
# Verify database is running
docker compose ps db

# Check database logs
docker compose logs db

# Verify environment variable
grep DATABASE_URL .env.production

# Try connecting manually
docker compose exec db psql -U postgres -d technurturelabs -c "SELECT VERSION();"
```

### Issue: "Caddy SSL certificate not working"
```bash
# Check Caddy logs
docker compose logs caddy

# Verify domain DNS is correct
nslookup admin.technurturelms.in

# Check Caddyfile syntax
docker compose exec caddy caddy validate --config /etc/caddy/Caddyfile
```

---

## 📊 Initial Data Created

### Super Admin Account
```
Email:    admin@technurture.com
Password: AdminPassword123!
Role:     Super Admin (full platform access)
Status:   Active
```
⚠️ **MUST** change password on first login!

### Payment Plans
```
1. Starter LMS
   Price: ₹9,999/year
   Max Students: 100
   Features: Basic LMS
   Popular: No

2. Standard Scholar (POPULAR)
   Price: ₹24,999/year
   Max Students: 500
   Features: LMS + Analytics + Support
   Popular: Yes

3. Elite Institutional
   Price: ₹49,999/year
   Max Students: Unlimited
   Features: Full platform + Priority Support + Custom Branding
   Popular: No
```

### Classes
```
Class 1 through Class 12 (Standard Indian school structure)
Each with level attribute (1-12)
Used for student enrollment grouping
```

### Platform Settings
```
Platform Name: TechNurture Labs
Support Email: support@technurture.io
Default Currency: INR (Indian Rupees)
```

---

## 🔄 Reseeding Data

### Option 1: Reseed Without Clean Deployment
```bash
# This preserves all data but reseeds initial records
docker compose exec app npm run db:seed

# Safe because seed uses "ON CONFLICT DO NOTHING"
```

### Option 2: Force Admin Reset
If you need to reset the admin password:
```bash
# Connect to database
docker compose exec db psql -U postgres -d technurturelabs

# Update admin password (new password: NewPassword123!)
UPDATE super_admins 
SET password_hash = '$2b$10$...' 
WHERE email = 'admin@technurture.com';
```

### Option 3: Full Clean Redeployment
```bash
# Complete fresh start
bash ops/deploy.sh --clean
```

---

## 🚀 Post-Deployment Tasks

### 1. Change Admin Password
```
1. Login to https://admin.technurturelms.in
2. Email: admin@technurture.com
3. Password: AdminPassword123!
4. Navigate to Settings → Change Password
5. Set new secure password
```

### 2. Configure Email
```
1. Go to Settings → Email Configuration
2. Configure SMTP settings
3. Test email delivery
```

### 3. Create Your First School
```
1. Go to Schools → Add School
2. Fill in school details
3. Assign payment plan
4. Create school admin account
5. Activate school
```

### 4. Create Sample Content
```
1. Go to Content Library
2. Create a sample course
3. Add lessons and quizzes
4. Publish course
5. Assign to a class
```

### 5. Invite First Students
```
1. Go to Schools → Select School
2. Go to Students → Invite Students
3. Enter student email
4. Send invitation
5. Student registers and joins
```

---

## 📊 Monitoring Deployment

### View Real-time Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f app
docker compose logs -f db
docker compose logs -f caddy
```

### Monitor Resource Usage
```bash
# CPU, Memory, Network
docker stats

# Individual container
docker stats LMS_app
```

### Check Disk Space
```bash
# Overall
df -h

# Database volume
docker volume inspect technurture_postgres_data
```

---

## 🎯 What Happens Automatically

When you run `bash ops/deploy.sh --clean`:

1. ✅ **Git Pull**: Gets latest code
2. ✅ **Shutdown**: Stops and removes all containers
3. ✅ **Cleanup**: Removes volumes for clean slate
4. ✅ **Rebuild**: Builds all images without cache
5. ✅ **Start Services**: Starts Database, Redis, App, Workers, Caddy
6. ✅ **Database Migration**: Runs `npm run db:push` (Drizzle ORM)
7. ✅ **Seeding**: Automatically runs `npm run db:seed`
8. ✅ **Health Check**: Waits for app to report healthy
9. ✅ **Output**: Shows initial credentials and access information

**No manual intervention needed!** The system is fully automated.

---

## 📝 Logs to Check

### Deployment Success
```bash
docker compose logs app | grep "listening on"
```

### Database Ready
```bash
docker compose logs db | grep "ready to accept"
```

### Seeding Complete
```bash
docker compose logs app | grep "Seed"
```

### SSL Certificate Generated
```bash
docker compose logs caddy | grep "tls.acme"
```

---

## ✨ Success Indicators

When deployment is complete and successful:

- [ ] `docker compose ps` shows all services healthy
- [ ] `https://admin.technurturelms.in` loads without SSL errors
- [ ] Admin login works with provided credentials
- [ ] Database contains seeded data
- [ ] No error logs in application
- [ ] Payment plans visible in admin panel
- [ ] Classes available for selection
- [ ] Email configuration accessible

---

## 🆘 Support

If deployment fails:

1. **Check logs**: `docker compose logs app`
2. **Verify .env**: All required variables set
3. **Check ports**: `lsof -i :80` and `lsof -i :443`
4. **Database connectivity**: `docker compose exec db psql -U postgres -c "SELECT 1"`
5. **Run doctor**: `bash ops/doctor.sh`

---

**Status**: Complete deployment with automatic seeding is production-ready.  
**Tested**: Yes, verified with technurturelms.in domain  
**Ready for Use**: Immediately after deployment  

For questions, refer to [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) or [ops/README.md](ops/README.md).
