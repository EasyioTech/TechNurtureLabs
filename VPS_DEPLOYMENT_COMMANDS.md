# 🚀 VPS DEPLOYMENT COMMANDS - Final Clean Build

**Date:** 2026-04-03  
**Version:** 1.0.0  
**Status:** Ready for Production Deployment

---

## ⚠️ IMPORTANT BEFORE YOU START

1. **Backup Your Database** - If this is an existing VPS with data, back it up first
2. **SSH into your VPS** - All commands run on the VPS server
3. **Have .env.production ready** - You'll need your production environment variables
4. **Read DEPLOYMENT_SAFETY_GUIDELINES.md** - This overrides all other instructions

---

## 📋 Pre-Deployment Checklist

- [ ] VPS server is accessible via SSH
- [ ] Node.js 18+ installed on VPS (`node --version`)
- [ ] PostgreSQL database is running and accessible
- [ ] Redis server is running (for job queues)
- [ ] SSL/HTTPS certificate ready (if using HTTPS)
- [ ] Domain/DNS configured and pointing to VPS
- [ ] Backup of existing database (if upgrading)

---

## 🔧 ONE-TIME SETUP (Fresh VPS)

### Step 1: Clone the Project
```bash
cd /var/www
git clone <your-repo-url> technurture-lms
cd technurture-lms
```

### Step 2: Install Dependencies (Clean Build)
```bash
# Remove any old node_modules
rm -rf node_modules .next

# Fresh install - all vulnerabilities fixed
npm install --omit=dev --production

# Or if you want dev dependencies for debugging:
npm install
```

### Step 3: Configure Environment
```bash
# Create/copy your production environment file
nano .env.production

# Should contain:
# DATABASE_URL=postgresql://user:password@localhost:5432/technurture
# REDIS_URL=redis://localhost:6379
# NODE_ENV=production
# NEXT_PUBLIC_API_URL=https://yourdomain.com
# ... other variables from .env.example

# Make sure .env.production is in gitignore
echo ".env.production" >> .gitignore
```

### Step 4: Build the Project
```bash
npm run build

# Check if .next directory was created
ls -la .next/
```

### Step 5: Database Setup (FIRST TIME ONLY)
```bash
# Run migrations
npm run db:push

# Seed initial data (admin user, plans, etc.)
npm run db:seed
```

### Step 6: Start Application with PM2
```bash
# Install PM2 globally (if not already)
npm install -g pm2

# Start the app
pm2 start npm --name "technurture-lms" -- start

# Save PM2 config for startup on reboot
pm2 startup
pm2 save

# Check status
pm2 status
pm2 logs technurture-lms
```

---

## 🔄 UPDATE DEPLOYMENT (After Initial Setup)

**Use these commands to deploy new code WITHOUT deleting data:**

### Step 1: Pull Latest Code
```bash
cd /var/www/technurture-lms
git pull origin main
```

### Step 2: Install Dependencies (if package.json changed)
```bash
npm install --omit=dev --production

# Fix any vulnerabilities
npm audit fix
```

### Step 3: Build Only (Do NOT run db:seed or setup)
```bash
npm run build
```

### Step 4: Graceful Restart (Keeps data)
```bash
# Option A: Using PM2 (Recommended)
pm2 restart technurture-lms

# Option B: Manual restart
pm2 stop technurture-lms
npm run build  # Optional if not done above
pm2 start npm --name "technurture-lms" -- start

# Verify it's running
pm2 status
pm2 logs technurture-lms
```

---

## 🗄️ DATABASE OPERATIONS (ONLY when needed)

### Run Migrations (Safe - Adds new tables/columns)
```bash
# Check what will be migrated
npm run db:generate

# Apply safe migrations (DO NOT do this on production without backup)
npm run db:push
```

### Query Database (Read-only)
```bash
npm run db:studio
# Opens browser interface to view data safely
```

### Full Reset (DELETES ALL DATA - Use only when deploying to new VPS)
```bash
# BACKUP FIRST!
# This will destroy all student data, courses, etc.
npm run setup
```

---

## 🔍 Monitoring & Logs

### View Application Logs
```bash
# Real-time logs
pm2 logs technurture-lms

# Last 100 lines
pm2 logs technurture-lms --lines 100

# Save to file
pm2 logs technurture-lms > /var/log/technurture.log
```

### Check Server Health
```bash
# App status
pm2 status

# CPU/Memory usage
pm2 monit

# Check if port is listening (usually 3000)
netstat -tlnp | grep node
lsof -i :3000
```

### Check Database Connection
```bash
# Test PostgreSQL
psql -h localhost -U <user> -d technurture -c "SELECT version();"

# Test Redis
redis-cli ping
```

---

## 🆘 Troubleshooting

### App won't start
```bash
# Check logs for errors
pm2 logs technurture-lms

# Check if port 3000 is in use
lsof -i :3000

# Kill process on port
lsof -ti:3000 | xargs kill -9

# Restart
pm2 restart technurture-lms
```

### Database connection error
```bash
# Check if PostgreSQL is running
systemctl status postgresql

# Check if Redis is running
systemctl status redis-server

# Test connection
psql -h localhost -U <user> -d technurture
```

### High memory/CPU usage
```bash
# Check running processes
pm2 monit

# Restart app to clear memory
pm2 restart technurture-lms

# Check for memory leaks in logs
pm2 logs technurture-lms | grep -i "memory\|leak"
```

### Disk space issues
```bash
# Check disk usage
df -h

# Clean old logs
rm -rf ~/.pm2/logs/technurture*

# Clean npm cache (safe)
npm cache clean --force
```

---

## 📊 SSL/HTTPS Setup (Optional)

### With Let's Encrypt + Nginx
```bash
# Install Nginx (if not already)
sudo apt install nginx

# Get SSL cert
sudo apt install certbot python3-certbot-nginx
sudo certbot certonly --standalone -d yourdomain.com

# Configure Nginx as reverse proxy
sudo nano /etc/nginx/sites-available/technurture-lms

# Add this:
# server {
#     listen 443 ssl;
#     server_name yourdomain.com;
#     
#     ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
#     ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
#     
#     location / {
#         proxy_pass http://localhost:3000;
#         proxy_set_header Host $host;
#         proxy_set_header X-Real-IP $remote_addr;
#     }
# }

sudo systemctl restart nginx
```

---

## 📝 Common Commands Reference

```bash
# Start/Stop/Restart
pm2 start npm --name "technurture-lms" -- start
pm2 stop technurture-lms
pm2 restart technurture-lms
pm2 delete technurture-lms

# Deploy code update
cd /var/www/technurture-lms && git pull && npm install && npm run build && pm2 restart technurture-lms

# Check status
pm2 status
pm2 logs technurture-lms

# View running services
ps aux | grep node
```

---

## ✅ Final Verification

After deployment, verify:

```bash
# 1. Check app is running
pm2 status

# 2. Check API responds
curl http://localhost:3000

# 3. Check database connection (from app logs)
pm2 logs technurture-lms | grep -i "database\|connection"

# 4. Check no data was deleted (query database)
npm run db:studio

# 5. Access in browser
curl https://yourdomain.com  # Should show HTML
```

---

## 🔐 Security Reminders

- [ ] Never commit `.env.production` to git
- [ ] Use strong database password
- [ ] Enable firewall (ufw)
- [ ] Regularly update system: `sudo apt update && sudo apt upgrade`
- [ ] Monitor logs for suspicious activity
- [ ] Keep secrets out of source code
- [ ] Use environment variables for all sensitive data

---

**Questions?** Check DEPLOYMENT_SAFETY_GUIDELINES.md
