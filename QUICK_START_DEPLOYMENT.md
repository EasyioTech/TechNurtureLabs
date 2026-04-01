# TechNurture LMS - Quick Start Deployment

## 🚀 One-Command Deployment (with complete data seeding)

The entire TechNurture LMS system can be deployed with a single command that:
- Builds the application
- Initializes the database
- Creates admin account
- Sets up payment plans
- Creates classes
- Configures platform settings

**No manual database setup required!**

---

## ⚡ Quick Start (5 minutes)

### Step 1: Prepare Your VPS
```bash
# SSH into your server
ssh root@your-vps-ip

# Go to project directory (or clone it)
cd /root/technurture-lms
```

### Step 2: Create Configuration File
```bash
# Create .env.production
cat > .env.production << 'EOF'
# Database
DATABASE_URL=postgresql://postgres:admin@db:5432/technurturelabs
POSTGRES_PASSWORD=admin

# Security (change these to secure values!)
JWT_SECRET=your-very-secure-key-minimum-32-characters-long-here
APP_ENCRYPTION_KEY=your-encryption-key-16-chars
MEDIA_SECRET=your-media-secret

# Application
NEXT_PUBLIC_APP_URL=https://technurturelms.in
CADDY_DOMAIN=technurturelms.in

# Storage
STORAGE_TYPE=local

# Cron
CRON_SECRET=your-cron-secret-key
EOF
```

### Step 3: Deploy Everything
```bash
# Run deployment (deletes everything and rebuilds clean)
bash ops/deploy.sh --clean

# This is safe! The --clean flag:
# ✓ Removes old containers/volumes
# ✓ Rebuilds everything from scratch
# ✓ Seeds all initial data automatically
# ✓ Takes 2-3 minutes to complete
```

### Step 4: You're Done!
After deployment completes, you'll see:
```
═══════════════════════════════════════════════════════════════
🎉 DEPLOYMENT COMPLETE & SEEDED
═══════════════════════════════════════════════════════════════

📋 INITIAL CREDENTIALS:
   Email:    admin@technurture.com
   Password: AdminPassword123!

🌐 ACCESS POINTS:
   Admin Portal:      https://admin.technurturelms.in
   Student Dashboard: https://school.technurturelms.in

✅ Payment Plans Created:
   1. Starter LMS (₹9,999/year - 100 students)
   2. Standard Scholar (₹24,999/year - 500 students)
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

## 🔐 Initial Credentials

**Admin Account** (created automatically):
- Email: `admin@technurture.com`
- Password: `AdminPassword123!`
- Role: Super Admin (full system access)

⚠️ **IMPORTANT**: Change this password immediately after first login!

---

## 📊 What Gets Created Automatically

### Payment Plans (₹ Pricing in INR)
1. **Starter LMS** - ₹9,999/year
   - Up to 100 students
   - Basic LMS features

2. **Standard Scholar** - ₹24,999/year (POPULAR)
   - Up to 500 students
   - LMS + Analytics + Support

3. **Elite Institutional** - ₹49,999/year
   - Unlimited students
   - Full platform + Priority Support

### Classes
- Class 1 through Class 12 (Standard Indian system)
- Each can have multiple students
- Used for course assignment and organization

### Platform Settings
- Platform Name: TechNurture Labs
- Support Email: support@technurture.io
- Default Currency: INR (Indian Rupees)

---

## 🌐 Access Your System

After deployment, access via:

| Portal | URL | Purpose |
|--------|-----|---------|
| Admin Portal | `https://admin.technurturelms.in` | Manage schools, users, content |
| School Portal | `https://school.technurturelms.in` | School admin panel |
| Student Dashboard | `https://school.technurturelms.in/dashboard` | Student learning interface |
| API | `https://api.technurturelms.in` | REST API endpoints |

---

## ✅ Verify Deployment

After seeing the success message, verify everything works:

```bash
# 1. Check all services running
docker compose ps

# 2. Check database has data
docker compose exec db psql -U postgres -d technurturelms -c \
  "SELECT COUNT(*) as admin_count FROM super_admins;"

# 3. Check classes created
docker compose exec db psql -U postgres -d technurturelms -c \
  "SELECT COUNT(*) as class_count FROM classes;"

# 4. Check payment plans
docker compose exec db psql -U postgres -d technurturelms -c \
  "SELECT COUNT(*) as plan_count FROM payment_plans;"

# 5. Test application health
curl -s https://admin.technurturelms.in | head -20
```

---

## 🔄 Update Deployment (without data loss)

To deploy updates without deleting data:

```bash
# This pulls latest code and redeploys WITHOUT removing data
bash ops/deploy.sh
```

This will:
- Pull latest code from git
- Rebuild images
- Restart services
- **Keep all data intact**

Use `--clean` only when you want a fresh start.

---

## 🆘 If Something Goes Wrong

### Check Logs
```bash
# Application logs
docker compose logs app --tail 50

# Database logs
docker compose logs db --tail 50

# Full diagnostic
bash ops/doctor.sh
```

### Common Issues

**"App is not healthy"**
- Wait longer (can take 2-3 minutes first time)
- Check logs: `docker compose logs app`
- Check .env.production variables are set

**"Database connection error"**
- Verify DATABASE_URL in .env.production
- Check if db container is running: `docker compose ps db`
- Wait 30+ seconds, database takes time to initialize

**"Port 80/443 already in use"**
- Check: `lsof -i :80` and `lsof -i :443`
- Stop conflicting service or use different port
- Run setup again: `bash ops/setup.sh`

---

## 📋 Next Steps After Deployment

1. **Change Admin Password**
   - Login to admin portal
   - Go to Settings → Profile
   - Change password immediately

2. **Configure Email (Optional)**
   - Settings → Email Configuration
   - Add your SMTP credentials
   - Test email sending

3. **Create Your First School**
   - Schools → Add School
   - Fill in school details
   - Assign a payment plan
   - Create school admin
   - Activate school

4. **Add Content**
   - Create courses
   - Add lessons and quizzes
   - Publish and assign to classes

5. **Invite Students**
   - Schools → Select School
   - Students → Invite
   - Share credentials with students

---

## 🎯 System Is Ready

Your TechNurture LMS is now:
✅ Fully deployed
✅ Database initialized with seed data
✅ Admin account created
✅ Payment plans configured
✅ Payment tiers ready
✅ Classes created
✅ Ready for student enrollment
✅ SSL certificates active (Let's Encrypt)
✅ Monitoring and logging enabled

**Start using immediately!**

---

## 📖 For More Details

- **Complete Setup**: See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- **Verification & Testing**: See [DEPLOYMENT_VERIFICATION.md](DEPLOYMENT_VERIFICATION.md)
- **Troubleshooting**: See [ops/README.md](ops/README.md)
- **System Overview**: See [README.md](README.md)

---

## 🚀 Single Command Reference

```bash
# Complete deployment with automatic seeding
bash ops/deploy.sh --clean

# Update without deleting data
bash ops/deploy.sh

# Health check and diagnostics
bash ops/doctor.sh

# Manual database seed (if needed)
docker compose exec app npm run db:seed
```

---

**Deployment Time**: 2-3 minutes  
**Data Seeded**: Yes, automatically  
**Manual Setup Required**: No  
**Ready for Production**: Yes  

✅ **Your TechNurture LMS is ready!**
