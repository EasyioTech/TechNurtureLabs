# 🛠️ Operations & Deployment

This directory contains all tools and scripts for deploying, managing, and maintaining the TechNurture LMS platform.

## 📋 Quick Reference

| Task | Command | When to Use |
|------|---------|------------|
| **New VPS Setup** | `bash ops/setup.sh` | First deployment on a fresh server |
| **Deploy/Update** | `bash ops/deploy.sh` | Update code, rebuild containers, restart services |
| **Health Check** | `bash ops/doctor.sh` | Diagnose issues, verify system health |
| **DB Init** | `bash ops/db-init.sh` | Initialize database schema (first run) |
| **Clean Deploy** | `bash ops/deploy.sh --clean` | Wipe everything and redeploy (⚠️ removes data) |

## 🚀 Deployment Workflows

### 1. Initial Server Setup (Run Once)
```bash
bash ops/setup.sh
```

**What it does:**
- Installs Docker and Docker Compose
- Configures firewall rules (HTTP 80, HTTPS 443)
- Sets up system dependencies
- Disables conflicting services (Nginx, Apache)
- Creates necessary directories

**Prerequisites:**
- Ubuntu 20.04+ or equivalent Linux distribution
- SSH access with sudo privileges
- Minimum 2GB RAM, 10GB disk space

---

### 2. Deploy or Update Application
```bash
bash ops/deploy.sh
```

**What it does:**
- Pulls latest code from repository
- Builds Docker images
- Starts services in correct dependency order
- Runs database migrations
- Performs health checks

**Supported flags:**
- `--clean`: Complete reset (removes all containers, volumes, and data) ⚠️

---

### 3. Troubleshooting & Diagnostics
```bash
bash ops/doctor.sh
```

**Checks:**
- Port availability (80, 443, 3000, 5432, 6379)
- Environment configuration (.env files)
- Database connectivity
- Redis connectivity
- Disk space
- Docker status
- Service logs (last 10 lines)

**Output includes:**
- ✅ Status indicators for each check
- ⚠️ Warnings for potential issues
- 📋 Suggested fixes for problems
- 📊 System resource usage

---

### 4. Database Initialization
```bash
bash ops/db-init.sh
```

**When needed:**
- First database setup after `setup.sh`
- After database container recreation
- When applying schema from scratch

**What it does:**
- Creates database tables
- Applies initial schema
- Sets up indexes
- Initializes required sequences

---

## 🐳 Docker Services

The deployment uses Docker Compose with four main services:

### Application (Next.js)
- **Port**: 3000
- **Restarts**: Automatically on failure
- **Dependencies**: Database, Redis
- **Environment**: Loaded from `.env.production`

### PostgreSQL Database
- **Port**: 5432
- **Volume**: `/docker/postgres-data`
- **Backup**: Recommend daily automated backups
- **Connection**: Internal Docker network

### Redis Cache
- **Port**: 6379
- **Volume**: `/docker/redis-data`
- **Purpose**: Session store, cache, rate limiting
- **Connection**: Internal Docker network

### Nginx Reverse Proxy
- **Port**: 80, 443
- **Purpose**: SSL termination, subdomain routing
- **Config**: `nginx.conf`
- **Certs**: Let's Encrypt (auto-renewed)

---

## ⚙️ Configuration

### Environment Variables (.env.production)

**Required:**
```env
# Database
DATABASE_URL=postgresql://user:password@postgres:5432/technurture

# Redis
REDIS_URL=redis://redis:6379/0

# Security
JWT_SECRET=your-secure-random-key-here

# Application
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NODE_ENV=production

# File Storage
STORAGE_TYPE=r2  # or 'local' for testing
R2_BUCKET_NAME=technurture-media
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-key-id
R2_SECRET_ACCESS_KEY=your-secret-key

# Payment (Razorpay)
RAZORPAY_KEY_ID=your-key-id
RAZORPAY_KEY_SECRET=your-secret

# Email (optional but recommended)
SMTP_HOST=smtp.provider.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-password
```

**Optional:**
```env
# Logging
LOG_LEVEL=info  # debug, info, warn, error

# Performance
CACHE_TTL=3600
SESSION_TIMEOUT=86400

# Features
FEATURE_RAZORPAY_ENABLED=true
FEATURE_TWO_FACTOR_AUTH_ENABLED=true
```

### Subdomain Configuration

The application uses subdomain-based multi-tenancy:

```
school.domain.com          → School Admin Portal + Student Dashboard
admin.domain.com           → Super Admin Portal
api.domain.com             → API endpoints
```

Configure DNS records:
```dns
*.domain.com  A  your-server-ip  (wildcard for all subdomains)
```

---

## 🩺 Health Checks & Monitoring

### Manual Health Check
```bash
bash ops/doctor.sh
```

### Docker Logs
```bash
# Application logs
docker compose logs app -f

# Database logs
docker compose logs postgres -f

# Redis logs
docker compose logs redis -f

# Nginx logs
docker compose logs nginx -f
```

### System Resources
```bash
# Check container status
docker compose ps

# Resource usage
docker stats

# Disk space
df -h
```

---

## 🔄 Backup & Recovery

### Database Backup
```bash
# Manual backup
docker compose exec postgres pg_dump -U postgres technurture > backup-$(date +%Y%m%d).sql

# Restore from backup
docker compose exec -T postgres psql -U postgres technurture < backup-20260401.sql
```

### File Storage Backup
```bash
# Local storage backup
tar -czf storage-backup-$(date +%Y%m%d).tar.gz /docker/postgres-data /docker/redis-data

# R2 storage is automatically managed (configure R2 lifecycle policies)
```

### Recommended Backup Schedule
- **Database**: Daily automated backups (3 months retention)
- **Files**: Daily automated backups (30 days retention)
- **Configuration**: Git version control for `.env` files

---

## 🚨 Troubleshooting

### Application won't start
```bash
bash ops/doctor.sh
# Check logs
docker compose logs app -f
```

### Database connection errors
```bash
# Verify database is running
docker compose ps postgres

# Check database logs
docker compose logs postgres

# Verify DATABASE_URL in .env.production
```

### Port conflicts
```bash
# Find process using port 80/443
lsof -i :80
lsof -i :443

# Kill the conflicting process
kill -9 <PID>

# Run setup again
bash ops/setup.sh
```

### Redis connection issues
```bash
# Check Redis status
docker compose ps redis

# Clear Redis cache
docker compose exec redis redis-cli FLUSHALL

# Restart Redis
docker compose restart redis
```

### Disk space full
```bash
# Check disk usage
df -h

# Clean Docker system
docker system prune -a --volumes  # ⚠️ Removes all stopped containers

# Remove old logs
docker compose logs --tail 0 -f > /dev/null
```

---

## 📊 Performance Tuning

### Database Optimization
```sql
-- Analyze query performance
ANALYZE;

-- Check index usage
SELECT schemaname, tablename, indexname FROM pg_indexes WHERE schemaname != 'pg_catalog';
```

### Redis Memory
```bash
# Monitor memory usage
docker compose exec redis redis-cli info memory

# Set max memory policy
docker compose exec redis redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

### Application Scaling
```bash
# Increase instances (edit docker-compose.yml)
services:
  app:
    deploy:
      replicas: 3
```

---

## 🔐 Security

### SSL/TLS Certificates
- **Type**: Let's Encrypt (auto-renewed)
- **Location**: `/etc/letsencrypt/live/yourdomain.com`
- **Renewal**: Automatic (runs daily)

### Environment Security
- Never commit `.env.production` to git
- Rotate `JWT_SECRET` regularly
- Use strong database passwords
- Enable 2FA on Cloudflare R2

### Access Control
- Restrict SSH access by IP
- Use non-root user for Docker
- Enable UFW firewall
- Monitor audit logs

---

## 📈 Monitoring & Alerts

### Key Metrics to Monitor
- Application uptime
- Response time (p50, p95, p99)
- Error rate (5xx, 4xx)
- Database query performance
- Redis memory usage
- Disk space availability

### Recommended Tools
- **Uptime Monitoring**: StatusPage, UptimeRobot
- **Log Aggregation**: ELK Stack, Datadog
- **Error Tracking**: Sentry, New Relic
- **Performance Monitoring**: DataDog, New Relic

---

## 📞 Getting Help

1. Run health diagnostics: `bash ops/doctor.sh`
2. Check recent logs: `docker compose logs --tail 100`
3. Review error messages in application logs
4. Verify environment configuration

---

**Version**: 1.0.0  
**Last Updated**: April 2026

For application documentation, see the main [README.md](../README.md)
