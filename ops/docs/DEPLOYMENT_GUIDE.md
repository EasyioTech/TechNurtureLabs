# 🚀 TechNurture LMS - Deployment & Configuration Guide

This guide covers everything needed to deploy, configure, and maintain the **TechNurture Learning Management System** in a production-ready environment.

---

## 🏗️ System Requirements
- **OS**: Ubuntu 20.04+ (or equivalent Linux distribution)
- **RAM**: Minimum 2GB (4GB+ recommended)
- **Storage**: Minimum 10GB for app; 50GB+ if using local file storage for media.
- **CPU**: 1 vCPU minimum (2+ vCPU recommended for high concurrency)

---

## ⚡ Quick Start Deployment (with complete data seeding)

You can deploy the entire system with a single command that:
- ✓ Builds the application in Docker
- ✓ Initializes the PostgreSQL database
- ✓ Creates the Super Admin account
- ✓ Sets up 3 payment tiers (Starter, Standard, Elite)
- ✓ Creates Class 1 through Class 12 automatically
- ✓ Configures platform branding settings

### Step 1: Initial Server Setup (Run Once)
```bash
bash ops/setup.sh
```

### Step 2: Configure Environment
Create `.env.production` in your root directory:
```env
# Database
DATABASE_URL=postgresql://postgres:admin@db:5432/technurturelabs
POSTGRES_PASSWORD=admin

# Security (Set strong secrets!)
JWT_SECRET=your-minimum-32-character-jwt-key
APP_ENCRYPTION_KEY=your-16-character-encryption-key
MEDIA_SECRET=your-secure-media-secret-key

# Application
NEXT_PUBLIC_APP_URL=https://technurturelms.in
CADDY_DOMAIN=technurturelms.in

# Storage Strategy (r2 or local)
STORAGE_TYPE=local
```

### Step 3: Deploy & Seed Data
```bash
# Deletes old containers (if any) and rebuilds a fresh, seeded system
bash ops/deploy.sh --clean
```

---

## 📋 Initial Credentials
| Field | Value |
|-------|-------|
| **Admin Email** | `admin@technurture.com` |
| **Admin Password** | `AdminPassword123!` |
| **Admin Portal** | `https://admin.yourdomain.com` |
| **School Portal** | `https://school.yourdomain.com` |

---

## ⚙️ Operations & Troubleshooting

### Automated Health Check
Run the **Operations Doctor** at any time to verify system health and troubleshoot issues:
```bash
bash ops/doctor.sh
```

### Common Maintenance Tasks

- **Updating code without data loss**: Just run `bash ops/deploy.sh` (without the --clean flag).
- **Manual Database Seeding**: `docker compose exec app npm run db:seed`
- **View Application Logs**: `docker compose logs app --tail 50 -f`
- **Backup Database**: `docker compose exec db pg_dump -U postgres -d technurturelabs > backup.sql`

---

## 🔐 Security Best Practices
1. **Change Passwords**: Immediately update the Super Admin password upon first login.
2. **Rotate Secrets**: Regularly update your `JWT_SECRET` and `APP_ENCRYPTION_KEY`.
3. **Backup Strategy**: Configure a daily backup job for the PostgreSQL volume.
4. **Firewall**: Ensure firewall rules (UFW) only allow ports 80 (HTTP), 443 (HTTPS), and your specific SSH port.

---

**Version**: 1.0.1  
**Last Updated**: April 2026  
**License**: Proprietary - TechNurture LMS

For more in-depth technical operations, see [ops/README.md](ops/README.md)
