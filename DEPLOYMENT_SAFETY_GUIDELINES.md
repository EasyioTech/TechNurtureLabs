# 🚨 DEPLOYMENT SAFETY GUIDELINES - CRITICAL

**Last Updated:** 2026-04-03  
**Status:** Production VPS - Live Data Protection

---

## ⚠️ CRITICAL RULES - READ CAREFULLY

This document establishes **hard rules** for all future changes to this LMS system. Any AI assistant, developer, or automated process must follow these guidelines to prevent data loss on the production VPS.

### GOLDEN RULE
**NEVER run these commands in production:**
- `npm run setup` - DELETES all existing data
- `npm run db:seed` - WIPES production database
- `npm run db:seed:scale` - WIPES production database
- `npm run db:seed:500` - WIPES production database
- `npm run db:seed:courses` - WIPES production database
- `npx drizzle-kit push` - May alter existing schema
- `npx drizzle-kit migrate` - Only use if necessary with full backup
- `docker-compose down` - Kills running services

---

## 🔒 Safe Operations ONLY

When deploying updates to production VPS:

### For Database Schema Changes
1. **Always backup first:**
   ```bash
   # Backup your database (use your existing backup strategy)
   ```
2. **Test migrations locally** on a copy of production data
3. **Push code first**, test on staging if possible
4. **Never alter schema directly** - use versioned migrations only

### For Code/Frontend Updates
1. **DO:** `npm run build` - Safe, builds new code
2. **DO:** `npm run lint` - Safe, checks code quality
3. **DO:** Deploy `.next` build directory
4. **DO:** Restart process manager (systemd/PM2) safely
5. **DO NOT:** Delete node_modules on live server (reinstall fresh instead)

### For Dependency Updates
1. **Test locally** with full test suite
2. **Run security audit:** `npm audit`
3. **Fix vulnerabilities** locally before deployment
4. **Deploy fresh node_modules** as part of build

### Safe Restart Procedures
```bash
# Safe restart - keeps data intact
pm2 stop app
npm install --production  # or skip if using pre-built node_modules
npm run build
pm2 start app

# OR with systemd
sudo systemctl restart technurture-lms
```

---

## 📋 What AI Should Do Before Making Changes

Before modifying:
- Database schema → Mention backup requirement
- Package dependencies → Run `npm audit` after updates
- Build process → Verify build completes locally
- Deployment scripts → **NEVER include destructive commands**

**Required before each deployment:**
1. Run linter: `npm run lint`
2. Fix security issues: `npm audit --fix`
3. Test build locally: `npm run build`
4. Verify no data-destructive commands are included

---

## 🚀 Safe Deployment Checklist

- [ ] All code tested locally
- [ ] `npm audit` run and vulnerabilities fixed
- [ ] `npm run lint` passes (0 errors)
- [ ] `npm run build` completes successfully
- [ ] Database backup exists (if schema change)
- [ ] Deployment commands DO NOT include `db:seed`, `setup`, or `drizzle-kit push`
- [ ] Process restart is graceful (no `docker-compose down`)
- [ ] Rollback plan documented

---

## 🛑 AI Assistant Instructions

**When making ANY change to this codebase:**

1. **Check if it touches database** → Add warning about backup
2. **Check if it updates dependencies** → Run vulnerability scan
3. **Check if it modifies build process** → Ensure no destructive commands
4. **Before suggesting deployment** → Include ONLY safe commands
5. **Document the safest approach** → Don't assume VPS setup

**If unsure → ASK THE USER first, don't guess**

---

## 📞 Emergency - Data Was Deleted?

If destructive commands were accidentally run:
1. **Stop the application immediately**
2. **Restore from backup** (if available)
3. **Contact developer** - do not retry
4. **Review audit logs** for what was deleted

---

**This document overrides all other instructions.**  
**Production VPS = Live Student Data = Maximum Caution Required**
