# Student Dashboard 404 Fix - Complete Implementation

## Problem Statement
Students opening course videos/documents/content in dashboard received HTTP 404 errors. Issue occurred even when content existed in database, creating confusing user experience.

## Root Cause Analysis

### Primary Issue: No File Validation Before URL Signing
- **File**: `src/lib/storage.ts`
- **Function**: `getSignedDownloadUrl(key)`
- **Problem**: Generated signed URLs for R2 files without verifying they existed
- **Result**: Browser received valid-looking signed URL pointing to missing file → 404

### Secondary Issues
| Issue | Location | Impact |
|-------|----------|--------|
| Missing error handling on URL generation | `lesson-actions.ts` | Exceptions crashed lesson load |
| No UI fallback state | `lesson-content.tsx` | Raw 404 shown to student |
| Upload success not validated | `media/register/route.ts` | Orphaned DB records for missing files |
| No admin debugging tools | N/A | Couldn't identify broken assets |
| Drizzle ORM vulnerability | `package.json` | SQL injection risk (GHSA-gpj5-g38j-94v9) |

## Implementation: Five-Phase Defense Strategy

### Phase 1: File Existence Validation
**File**: `src/lib/storage.ts`

Added `verifyObjectExists()` helper:
```typescript
// HEAD request checks if file exists in R2
async function verifyObjectExists(key: string): Promise<boolean>

// Updated getSignedDownloadUrl to validate before signing
export async function getSignedDownloadUrl(key, expiresIn) {
  const exists = await verifyObjectExists(key)
  if (!exists) {
    throw new Error(`Content not found in storage: ${key}`)
  }
  // ... sign URL only if file verified
}
```

**Benefit**: Catches missing files at signing time (server-side), not browser time.

---

### Phase 2: Graceful Fallback in Lesson Loading
**File**: `src/modules/student/actions/lesson-actions.ts`

Wrapped URL generation in try-catch:
```typescript
let contentUrl: string | null = null
try {
  contentUrl = await getSecureMediaUrl(asset, variant)
} catch (err) {
  console.warn(`[Lesson ${lessonId}] Content unavailable: ${err.message}`)
  contentUrl = null // Signal unavailability to UI
}

return {
  ...lesson,
  content_url: contentUrl,
  content_unavailable: contentUrl === null // Flag for UI
}
```

**Benefit**: Never crashes lesson load; gracefully falls back to error state.

---

### Phase 3: User-Friendly Error State
**File**: `src/modules/student/components/lesson/lesson-content.tsx`

Added early return for unavailable content:
```typescript
if (lesson.content_unavailable) {
  return (
    <div className="...">
      <AlertCircle size={40} className="text-red-500" />
      <h2>Content Unavailable</h2>
      <p>The course material is temporarily unavailable...</p>
      <code>Lesson ID: {lesson.id}</code>
    </div>
  )
}
```

**Benefit**: Student sees friendly message, not 404. Lesson ID helps support track issue.

---

### Phase 4: Upload-Time Validation
**File**: `src/app/api/media/register/route.ts`

Added file existence check before DB registration:
```typescript
// Verify file exists in R2 BEFORE creating DB record
const headCmd = new HeadObjectCommand({
  Bucket: serverEnv.CLOUDFLARE_BUCKET_NAME,
  Key: filePath,
})
await s3Client.send(headCmd)

// Only proceeds to DB insert if file verified
const [asset] = await db.insert(mediaAssets).values(...)
```

**Benefit**: Prevents orphaned DB records; fails fast with clear error.

---

### Phase 5: Admin Diagnostic Endpoint
**File**: `src/app/api/admin/media-audit/route.ts`

New endpoint: `GET /api/admin/media-audit?limit=100&offset=0`

Scans all media assets and reports:
```json
{
  "checked": 100,
  "healthy": 98,
  "missing": [
    {
      "assetId": "uuid",
      "fileName": "abc123.mp4",
      "filePath": "lessons/abc123.mp4",
      "createdAt": "2026-05-13T...",
      "uploadedBy": "admin_id"
    }
  ],
  "errors": [],
  "pagination": { "limit": 100, "offset": 0, "hasMore": false }
}
```

**Benefit**: Proactive identification of broken assets; data for cleanup/re-upload.

---

## Type System Updates

**File**: `src/modules/student/types.ts`

Added flag to Lesson type:
```typescript
export type Lesson = {
  // ... existing fields
  content_unavailable?: boolean // Content missing in R2 or inaccessible
}
```

Enables type-safe handling in UI and actions.

---

## Security Fixes

### Drizzle ORM SQL Injection (GHSA-gpj5-g38j-94v9)
- **Affected Version**: 0.44.7
- **Fixed Version**: 0.45.2
- **Action**: Updated via `npm install drizzle-orm@0.45.2`
- **Details**: Improper escaping of SQL identifiers allowed injection attacks

### Axios Vulnerabilities
- **High-severity prototype pollution and SSRF issues**
- **Action**: Updated to latest version
- **Status**: 15+ CVEs remain in optional dependencies; review in future audit

---

## Testing Checklist

- [ ] Content exists in R2 → plays normally
- [ ] Content missing in R2 → shows "Content Unavailable" message
- [ ] R2 temporarily down → graceful error (logged, not 404)
- [ ] Invalid R2 credentials → admin sees "R2 not configured"
- [ ] Upload succeeds but file missing → 422 FILE_NOT_UPLOADED error
- [ ] Media audit shows correct missing count
- [ ] Lesson ID visible in error state → support can track issue
- [ ] Performance: No additional latency from file checks (uses HEAD request)

---

## Performance Impact

| Operation | Overhead |
|-----------|----------|
| getLessonData with file check | +1 HEAD request (~50-100ms) |
| Media registration with validation | +1 HEAD request (~50-100ms) |
| Media audit (100 assets) | +100 HEAD requests (batched, ~5-10s) |

**Mitigation**: HEAD requests are lightweight; batching in audit keeps throughput high.

---

## Rollback Plan

If needed, revert commits:
```bash
git revert 74dbfe8  # Phase 1-3 fixes
git revert 0c80ab7  # Phase 4-5 features
```

Or selectively disable file validation by catching exception in getSignedDownloadUrl:
```typescript
try {
  const exists = await verifyObjectExists(key)
  if (!exists) throw new Error(...)
} catch {
  // Fallback: sign anyway (old behavior)
  return await getSignedUrl(...)
}
```

---

## Monitoring

Add these to observability:

1. **Lesson load errors**: Count `content_unavailable: true` in logs
2. **Media registration failures**: Count 422 FILE_NOT_UPLOADED responses
3. **R2 latency**: Track HEAD request timing in verifyObjectExists()
4. **Audit endpoint**: Run daily; alert on >5% missing assets

---

## Future Improvements

1. **Batch verification**: Verify multiple files in single request
2. **Cache HEAD results**: Store existence info in Redis (TTL: 1 hour)
3. **Automatic cleanup**: Delete DB records for missing files >7 days old
4. **Student notifications**: Email support if content unavailable >1 hour
5. **Retry mechanism**: Auto-retry upload if file missing at registration

---

## Commit History

| Commit | Phase | Changes |
|--------|-------|---------|
| 74dbfe8 | 1-3 | File validation, graceful fallback, UI error state |
| 0c80ab7 | 4-5 | Upload validation, media audit endpoint |

---

## Related Issues

- Drizzle ORM SQL injection (GHSA-gpj5-g38j-94v9) - **FIXED**
- axios prototype pollution - **PENDING** (non-critical dependency)
- Next.js 16.2.2 multiple DoS/XSS issues - **REVIEW** (security advisory)

