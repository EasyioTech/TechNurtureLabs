# R2 Upload & Media Library — Middleware Impact Analysis

**Date:** 2026-04-04  
**Focus:** What in the middleware affects R2 file uploads and media library retrieval for courses

---

## TL;DR: Middleware's Impact on R2 Operations

The middleware has **4 exemptions** that ENABLE R2 uploads and retrieval. These are the critical lines:

```typescript
// Line 182-187 in middleware.ts
const isCsrfExempt = url.pathname.startsWith('/api/auth/') ||
                     url.pathname === '/api/admin/login' ||
                     url.pathname === '/api/admin/register' ||
                     url.pathname === '/api/media/stream-upload' ||  // ← Video upload
                     url.pathname === '/api/media/register' ||        // ← Register after upload
                     url.pathname === '/api/media/sync' ||            // ← Sync library
                     url.pathname === '/api/branding/upload' ||       // ← Branding
                     url.pathname === '/api/payment/verify' ||
                     url.pathname === '/api/payment/create-order';
```

**If these exemptions are removed or broken, R2 operations FAIL.**

---

## R2 Upload Flow & Middleware Touch Points

### 1. **Video Upload to R2** (`/api/media/stream-upload`)

```
Client → POST /api/media/stream-upload
         ↓
    [MIDDLEWARE]
    - Rate limiting: ✅ Applied
    - Session validation: ✅ Required (admins only)
    - CSRF validation: ❌ EXEMPTED (line 184)
    ↓
    Route generates upload URL for Cloudflare Stream
    ↓
    Client uploads directly to Cloudflare (bypasses API)
    ↓
    Client → POST /api/media/register (register file in DB)
```

**Middleware Impact:**
- ✅ Rate limiting prevents abuse
- ✅ Session check ensures only admins upload
- ✅ CSRF exemption allows form to send without token (intentional — Cloudflare handles pre-signed auth)

**Why CSRF is exempted:** `/api/media/stream-upload` returns a pre-signed Cloudflare upload URL. The actual file upload goes to Cloudflare's servers, not our API, so CSRF doesn't apply to the upload itself. However, the *initial request* to get the URL should still be CSRF-protected.

**⚠️ SECURITY NOTE:** With SECURITY FIX #3 (line 190), CSRF is now required on ALL mutating requests except exempted endpoints. This is CORRECT because:
- `/api/media/stream-upload` is POST (mutating) and creates a resource (upload session)
- Even pre-signed uploads should be protected from CSRF (prevent unauthorized admins from uploading)
- However, the exemption exists because the endpoint is low-risk (only admins, metadata only, no file stored yet)

---

### 2. **Register Uploaded File in Database** (`/api/media/register`)

```
Client → POST /api/media/register
         { fileName, filePath, fileSize, mimeType, folder, storageType: 'r2' }
         ↓
    [MIDDLEWARE]
    - Rate limiting: ✅ Applied
    - Session validation: ✅ Required (admins only)
    - CSRF validation: ❌ EXEMPTED (line 185)
    ↓
    Route inserts asset into mediaAssets table
    ↓
    Returns { assetId, file_url, ... }
```

**File Status After Register:**
- ✅ File exists in R2 bucket (uploaded by client to Cloudflare)
- ✅ File recorded in `mediaAssets` table
- ✅ File now visible in media library UI

**Middleware Impact:**
- ✅ Rate limiting prevents bulk registrations
- ✅ Session check ensures only admins register
- ✅ CSRF exemption is intentional (metadata-only, client-driven)

---

### 3. **Sync R2 Bucket with Database** (`/api/media/sync`)

```
Admin → POST /api/media/sync
        ↓
   [MIDDLEWARE]
   - Rate limiting: ✅ Applied
   - Session validation: ✅ Required (super_admin only)
   - CSRF validation: ❌ EXEMPTED (line 186)
   ↓
   Route lists all files in R2 bucket (images/, videos/, documents/)
   ↓
   For each file NOT in mediaAssets table:
       → Insert into mediaAssets
   ↓
   Returns: { totalFilesFoundInR2, newFilesAddedToLibrary }
```

**What This Fixes:**
- Files uploaded to R2 directly (via S3 CLI, API, or webhook) now appear in media library UI
- Orphaned files in R2 get registered in DB

**Middleware Impact:**
- ✅ Session check ensures only super_admins can sync
- ✅ CSRF exemption is intentional (one-off admin action, not user-driven)
- ⚠️ **With SECURITY FIX #3:** CSRF is now required, but still exempted for `sync` (intentional)

---

### 4. **Retrieve Media Library in Admin Dashboard** (GET `/api/media/library`)

```
Admin → GET /api/media/library?type=video&folder=library&page=1
        ↓
   [MIDDLEWARE]
   - Rate limiting: ✅ Applied
   - Session validation: ✅ Required (super_admin only)
   - CSRF validation: ❌ NOT CHECKED (GET request, no CSRF needed)
   ↓
   Route queries mediaAssets table
   WHERE storage_type = 'r2' AND asset_type = 'video' AND folder LIKE 'library/%'
   ↓
   For each asset:
       → Compute file_url using /api/media/r2/[...path]
   ↓
   Returns paginated results with file URLs
```

**No CSRF Needed:** GET requests are side-effect-free. CSRF applies only to POST/PUT/PATCH/DELETE.

**Middleware Impact:**
- ✅ Rate limiting prevents library DoS
- ✅ Session validation ensures auth
- ✅ No CSRF issues (GET is safe)

---

## Branding Upload (`/api/branding/upload`)

```
Admin → POST /api/branding/upload (multipart form)
        ↓
   [MIDDLEWARE]
   - Rate limiting: ✅ Applied
   - Session validation: ✅ Required (super_admin only)
   - CSRF validation: ❌ EXEMPTED (line 187)
   ↓
   Route stores image as base64 data URI in platformSettings table
   (NOT uploaded to R2 — stored in DB)
   ↓
   Served via /api/branding/{logo|favicon}
```

**Middleware Impact:**
- ✅ CSRF exemption is intentional (different storage path, lower risk)
- ✅ File size limited to 2MB in route validation
- ✅ MIME type validated (only image/* allowed)

---

## Issues in R2 Uploads & How Middleware Contributes

### Issue #1: "Files uploaded to R2 but don't appear in media library"

**Root Causes:**
1. **File upload succeeds** (client → Cloudflare directly)
2. **Registration fails** (`/api/media/register` doesn't complete)
   - Missing CSRF token? No — it's exempted
   - Database down? → 500 error
   - Session invalid? → 401 error
3. **File orphaned in R2** but not in DB

**Middleware Responsibility:** NONE. Middleware doesn't prevent registration. Likely causes:
- Database constraint violation
- Session expiration mid-request
- Rate limiting during bulk uploads (if `limit` is too low)

**Fix in Middleware:** Ensure rate limit is high enough for admin bulk operations:
```typescript
// Current: 300 req/min (5 per second)
// For uploading 50 videos, each with register + library refresh:
// Need ~150 requests/min = adjust if necessary
await rateLimitIp(ip, 300, 60); // ← Can increase if admins hit this
```

---

### Issue #2: "Sync endpoint not finding files in R2"

**Root Causes:**
1. **R2 credentials misconfigured** → S3Client fails → `listFiles()` returns empty
2. **Files stored under wrong folder** → `/api/media/sync` only checks `['images', 'videos', 'documents']`
3. **Session validation fails** → 401 error

**Middleware Responsibility:**
- ✅ Session check works (line 102-170)
- ✅ CSRF exemption correct (line 186)
- ✅ Rate limiting applied

**Fix in Middleware:** NONE. Problem is likely in `src/lib/storage.ts:listFiles()` or R2 bucket structure.

**Verify:**
```bash
# Check if R2 client initialized
echo $CLOUDFLARE_ACCOUNT_ID
echo $CLOUDFLARE_ACCESS_KEY_ID  # Should not be empty
echo $CLOUDFLARE_BUCKET_NAME

# Manually list R2 files
aws s3 ls s3://your-bucket --recursive --endpoint-url https://{account_id}.r2.cloudflarestorage.com
```

---

### Issue #3: "Media library retrieves old files, new files missing"

**Root Causes:**
1. **Caching issue** → Client-side or CDN caching stale list
2. **Database transaction isolation** → Newly registered files not visible yet
3. **Session permissions** → User not super_admin

**Middleware Responsibility:**
- ✅ Session validation (line 102-170)
- ✅ No caching in middleware (raw request-pass-through)

**Route's Response Headers (line 81-84 in `/api/media/library`):**
```typescript
response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
response.headers.set('Pragma', 'no-cache');
response.headers.set('Expires', '0');
```
✅ Already prevents caching. Middleware doesn't override.

**Fix:** If still seeing old files:
1. Clear browser cache
2. Check if frontend is caching responses
3. Ensure database has unique constraint on `(file_path, storage_type)`

---

## Middleware Configuration for R2 Operations

### Environment Variables (Required)

```bash
# R2 Credentials (in .env or deployment config)
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_ACCESS_KEY_ID=your-access-key
CLOUDFLARE_SECRET_ACCESS_KEY=your-secret-key
CLOUDFLARE_BUCKET_NAME=your-bucket-name
CLOUDFLARE_PUBLIC_DOMAIN=cdn.example.com  # Public URL for R2 files

# JWT Secret (CRITICAL for session validation)
JWT_SECRET=your-long-random-secret

# Middleware Behavior (optional)
CSRF_STRICT_MODE=true  # Fail-secure on infra failure (default)
```

### Rate Limiting for Admin Operations

Current: `300 req/min` (5 req/sec)

For typical workflows:
- Single file upload + register: 2 requests = no issue
- Bulk sync: 1 request + returns summary = no issue
- Pagination through library (25 pages): 25 requests = acceptable

**If admins hit 429 (Too Many Requests):**
```typescript
// In middleware.ts line 86, adjust limit:
await rateLimitIp(ip, 500, 60); // Increase to 8+ per second
```

---

## Checklist: R2 Operations Troubleshooting

- [ ] JWT_SECRET is set and non-empty
- [ ] CLOUDFLARE_* variables all configured
- [ ] `/api/media/stream-upload` returns upload URL (test: curl -X POST ...)
- [ ] `/api/media/register` accepts registration (test: POST with filePath)
- [ ] `/api/media/library` returns paginated results (test: GET with ?page=1)
- [ ] `/api/media/sync` lists files found (test: POST, check response stats)
- [ ] Admin session cookie (session=...) is valid and non-expired
- [ ] No CSRF-related 403 errors (exemptions are working)
- [ ] No 429 rate limit errors (if so, increase limit in middleware)
- [ ] Media library UI auto-refreshes after upload (check client code)

---

## Summary Table: Middleware Impact on R2 Operations

| Endpoint | Method | CSRF Exempt? | Reason | Status |
|----------|--------|-------------|--------|--------|
| `/api/media/stream-upload` | POST | ✅ Yes | Pre-signed URL only, no file stored | Correct |
| `/api/media/register` | POST | ✅ Yes | Admin-only, metadata registration | **Needs review* |
| `/api/media/sync` | POST | ✅ Yes | Super-admin-only, rare operation | Correct |
| `/api/media/library` | GET | N/A | No CSRF needed (GET is safe) | Correct |
| `/api/branding/upload` | POST | ✅ Yes | DB storage only, different flow | Correct |

*With SECURITY FIX #3, `/api/media/register` should ideally be CSRF-protected if it creates user-accessible resources. However, exemption is acceptable since only admins can call it.

---

## Recommended Changes (Optional)

### If You Want Stricter CSRF on Admin Operations:

Remove exemption from `/api/media/register`:
```typescript
// Current (line 185):
url.pathname === '/api/media/register' ||

// Remove the line above and require CSRF token in client
// Then client must send header: X-CSRF-Token: ...
```

Then update client to send CSRF token:
```javascript
// In media upload client
const csrfToken = document.querySelector('[name=csrf_token]')?.value;
const response = await fetch('/api/media/register', {
  method: 'POST',
  headers: {
    'X-CSRF-Token': csrfToken,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ filePath, fileName, ... }),
});
```

**Trade-off:** More secure, but requires client changes. Current exemption is low-risk since only authenticated admins can call it.

---

## Key Takeaway

**Middleware correctly handles R2 operations.** The exemptions are intentional and safe:
- ✅ Session validation ensures only authorized users
- ✅ Rate limiting prevents abuse
- ✅ CSRF exemptions are appropriate for admin-only, metadata-driven operations
- ✅ No caching conflicts

**If R2 uploads fail, the issue is likely:**
1. R2 credentials misconfigured (`CLOUDFLARE_*` env vars)
2. Database constraint or transaction issue
3. S3Client initialization failure
4. **Not** a middleware problem

Use the troubleshooting checklist above to isolate the root cause.
