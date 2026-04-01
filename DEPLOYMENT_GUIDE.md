# TechNurture LMS - Deployment & Configuration Guide

## Quick Start for Deployment

This guide covers everything needed to deploy and maintain the TechNurture Learning Management System in production.

### System Requirements
- **OS**: Ubuntu 20.04+ (or equivalent Linux)
- **RAM**: Minimum 2GB (recommended 4GB+)
- **Storage**: Minimum 10GB (recommended 50GB+ for media)
- **CPU**: 1 vCPU minimum (2+ vCPU recommended)

### Automated Deployment (Recommended)

```bash
# 1. Initial server setup (run once)
bash ops/setup.sh

# 2. Deploy or update application
bash ops/deploy.sh

# 3. Health check
bash ops/doctor.sh
```

## Configuration

### Environment Variables

Create `.env.production` in the project root:

```env
# ─── DATABASE ─────────────────────────────────────────────
DATABASE_URL=postgresql://user:password@localhost:5432/technurture

# ─── CACHE & SESSIONS ─────────────────────────────────────
REDIS_URL=redis://localhost:6379/0

# ─── SECURITY ─────────────────────────────────────────────
JWT_SECRET=your-generated-secret-key
NODE_ENV=production

# ─── APPLICATION ─────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=https://yourdomain.com
PORT=3000

# ─── FILE STORAGE ─────────────────────────────────────────────
# Options: 'local' or 'r2'
STORAGE_TYPE=r2

# Cloudflare R2 (if using R2)
R2_BUCKET_NAME=your-bucket-name
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_REGION=us

# Local storage path (if using local storage)
LOCAL_STORAGE_DIR=/var/technurture/storage

# ─── PAYMENT GATEWAY ─────────────────────────────────────────────
RAZORPAY_KEY_ID=your-key-id
RAZORPAY_KEY_SECRET=your-secret

# ─── EMAIL ────────────────────────────────────────────────────────
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-password
SMTP_FROM=noreply@yourdomain.com
```

### Domain Configuration

Configure DNS records pointing to your server:

```dns
yourdomain.com           A   YOUR_SERVER_IP
*.yourdomain.com         A   YOUR_SERVER_IP
```

This enables subdomains:
- `school.yourdomain.com` → Student & School Admin
- `admin.yourdomain.com` → Super Admin Portal
- `api.yourdomain.com` → API endpoints (optional)

## Deployment Checklist

- [ ] Server provisioned and SSH access tested
- [ ] DNS records updated and propagated
- [ ] `.env.production` created with all required variables
- [ ] Database and Redis connection strings verified
- [ ] Payment gateway credentials configured
- [ ] Email credentials configured
- [ ] File storage configured (R2 or local)
- [ ] SSL certificates ready (Let's Encrypt auto-handled)
- [ ] Backup strategy defined
- [ ] Monitoring tools configured (optional)

## Running Deployment

```bash
# 1. SSH into server
ssh ubuntu@YOUR_SERVER_IP

# 2. Clone repository
git clone https://github.com/your-org/technurture-lms.git
cd technurture-lms

# 3. Create environment file
cp .env.example .env.production
nano .env.production  # Edit with your configuration

# 4. Run setup (first time only)
bash ops/setup.sh

# 5. Deploy
bash ops/deploy.sh
```

## Health Checks

```bash
# Run automated health check
bash ops/doctor.sh

# Manual checks:
docker compose ps          # View service status
docker compose logs app    # View application logs
curl http://localhost:3000 # Test application
```

## Database Operations

### Initial Database Setup
```bash
bash ops/db-init.sh
```

### Backup Database
```bash
docker compose exec postgres pg_dump -U postgres technurture > backup.sql
```

### Restore Database
```bash
docker compose exec -T postgres psql -U postgres technurture < backup.sql
```

## Troubleshooting

### Application won't start
```bash
bash ops/doctor.sh
docker compose logs app --tail 50
```

### Database connection error
- Verify `DATABASE_URL` in `.env.production`
- Check if PostgreSQL container is running: `docker compose ps`
- Check database logs: `docker compose logs postgres`

### Redis connection error
- Check Redis status: `docker compose ps redis`
- Verify `REDIS_URL` environment variable
- Restart Redis: `docker compose restart redis`

### Port conflicts
- Check which process uses ports 80/443: `sudo lsof -i :80`
- Kill conflicting process or change port
- Re-run: `bash ops/setup.sh`

## Monitoring

### Recommended Monitoring Tools
- **Uptime**: UptimeRobot or StatusPage
- **Logs**: CloudWatch, ELK Stack, or Loki
- **Metrics**: Prometheus + Grafana or DataDog
- **Error Tracking**: Sentry or New Relic

### Key Metrics to Monitor
- Application uptime and response time
- Database query performance
- Redis memory usage
- Disk space availability
- Error rates (5xx, 4xx responses)

## Security Best Practices

1. **Regular Updates**
   ```bash
   bash ops/deploy.sh  # Pulls latest code
   ```

2. **Backup Strategy**
   - Daily database backups (3 months retention)
   - Daily file backups (1 month retention)
   - Test restore procedures regularly

3. **Access Control**
   - Restrict SSH to specific IPs
   - Use non-root user for Docker
   - Enable UFW firewall
   - Monitor audit logs

4. **Secrets Management**
   - Never commit `.env.production` to git
   - Rotate JWT_SECRET regularly
   - Use strong database passwords
   - Store credentials securely

## Scaling

### Horizontal Scaling
```bash
# Edit docker-compose.yml
services:
  app:
    deploy:
      replicas: 3
```

### Database Connection Pool
- Adjust `DATABASE_URL` connection pool size
- Monitor connection count in PostgreSQL

### Redis Optimization
```bash
# Monitor memory usage
docker compose exec redis redis-cli info memory
```

## Support & Maintenance

For issues or questions, refer to:
1. Run `bash ops/doctor.sh` for diagnostics
2. Check deployment logs: `docker compose logs`
3. Review application README for architecture details
4. Check operations documentation in `ops/README.md`

---

**Version**: 1.0.0  
**Last Updated**: April 2026

For application architecture and feature documentation, see [README.md](README.md)
