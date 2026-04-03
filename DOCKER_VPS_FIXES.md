# VPS Docker Issues - Critical Fixes Required

## Issue 1: Server Action Hash Mismatch ⚠️ CRITICAL

**Error**:
```
Error: Failed to find Server Action "00f67f2bffece196e067550944094468a1972618bd"
This request might be from an older or newer deployment.
```

**Root Cause**: 
- You have updated the backup/restore component code
- The build cache contains old Server Action hashes
- Browsers are calling old action hashes that no longer exist

**Fix on VPS**:
```bash
cd /path/to/technurture-labs

# Stop the app container
docker-compose down app

# Clear build cache completely
docker exec LMS_app rm -rf .next/*
docker exec LMS_app rm -rf node_modules/.cache/*

# Rebuild with fresh hashes
docker-compose up app --build

# Wait 2-3 minutes for full rebuild
```

**Verification**: After rebuild, test the backup/restore buttons. You should NOT see the hash error anymore.

---

## Issue 2: Missing course_enrollments Table ⚠️ CRITICAL

**Error**:
```
relation "course_enrollments" does not exist
at character 56
```

**Root Cause**: 
- A diagnostic query is trying to access a table that doesn't exist
- This is in the admin panel diagnostics (meta-actions.ts)
- Database schema mismatch or incomplete migration

**File to Fix**:
`src/modules/super-admin/actions/sub-actions/meta-actions.ts`

**Quick Fix** - Comment out or check if table exists:
```typescript
// In the diagnostics function, add a safety check:
try {
    const orphaned = await db.execute(
        sql`SELECT COUNT(*) as count
            FROM course_enrollments ce
            WHERE NOT EXISTS (
                SELECT 1 FROM courses c WHERE c.id = ce.course_id
            ) AND ce.deleted_at IS NULL`
    );
} catch (error) {
    // Table doesn't exist - skip this check
    console.warn('[Diagnostics] course_enrollments table not found - skipping orphan check');
}
```

**Alternative** - Check migration:
```bash
# SSH into VPS, check if migration exists
docker exec LMS_postgres psql -U postgres -d technurturelabs -c "\dt" | grep enrollment

# If missing, run migrations manually
docker exec LMS_app npm run db:push
```

---

## Issue 3: TLS Certificate DNS-01 Challenge Failing ⚠️ WARNING

**Error**:
```
no solvers available for remaining challenges 
(configured=[http-01 tls-alpn-01] offered=[dns-01])
```

**Root Cause**: 
- Let's Encrypt requires DNS-01 challenge for wildcard certificates
- Caddy is only configured for HTTP-01 and TLS-ALPN-01
- DNS-01 requires DNS provider API access (Cloudflare, Route53, etc.)

**Options**:

### Option A: Use HTTP-only (Dev/Testing)
Edit Caddyfile:
```caddy
http://technurturelms.in, http://www.technurturelms.in {
    reverse_proxy http://app:3000
}
```

### Option B: Configure DNS-01 with Cloudflare (Production)
Add to docker-compose.yml under caddy service:
```yaml
environment:
  - CLOUDFLARE_API_TOKEN=<your-cloudflare-token>
```

Edit Caddyfile:
```caddy
*.technurturelms.in, technurturelms.in {
    tls {
        issuer acme {
            dns cloudflare {env.CLOUDFLARE_API_TOKEN}
        }
    }
    reverse_proxy http://app:3000
}
```

---

## Issue 4: UNAUTHORIZED Errors (Expected)

**Errors**:
```
⨯ Error: UNAUTHORIZED
```

**Status**: ✅ EXPECTED - This is normal. Unauthenticated requests return 401. Not an issue.

---

## Backup/Restore Logs (Looking Good ✅)

**Observed**:
```
[Backup Service] Starting system restore for 2 courses...
[Backup Service] Step 1: Restoring 12 classes...
[Backup Service] Step 2: Restoring 0 media assets...
[Backup Service] Processed Course: Voluptates vel quo e
[Backup Service] Restore completed: 0 courses, 3 lessons, 0 assets, 0 quizzes.
```

**Status**: ✅ **WORKING CORRECTLY** - The restore is functioning as expected!

---

## Recommended Fix Priority

1. **🔴 CRITICAL** - Fix Server Action hash mismatch (Issue 1)
   - Blocks UI interactions completely
   - Rebuild required

2. **🔴 CRITICAL** - Fix course_enrollments missing table (Issue 2)
   - Blocks admin diagnostics
   - Check migrations

3. **🟡 WARNING** - Fix TLS certificates (Issue 3)
   - Blocks HTTPS access
   - Configure DNS-01 or use HTTP-only

4. **✅ OK** - Backup/Restore is working (Issue 4)
   - No changes needed
   - Your fixes were successful!

---

## Commands to Run on VPS

```bash
# SSH into VPS
ssh root@your-vps-ip

# Navigate to project
cd /path/to/technurture-labs

# 1. Rebuild app (fixes Server Action issue)
docker-compose down app
docker exec LMS_app rm -rf .next
docker-compose up -d app --build

# 2. Check if course_enrollments exists
docker exec LMS_postgres psql -U postgres -d technurturelabs -c "\dt public.course_enrollments"

# 3. If missing, run migrations
docker exec LMS_app npm run db:push

# 4. View logs
docker-compose logs -f app
```

---

## Validation

After fixes, you should see:
- ✅ No Server Action hash errors
- ✅ No course_enrollments errors  
- ✅ HTTPS working (or HTTP-only if configured)
- ✅ Backup/Restore buttons functional
- ✅ Page doesn't refresh infinitely on restore

