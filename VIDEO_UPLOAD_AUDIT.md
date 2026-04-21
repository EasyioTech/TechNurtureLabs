# Video Upload Architecture Audit & Refactor

**Date**: 2026-04-21  
**Status**: Over-engineered, refactoring to CF Stream best practices

## Current Flow Analysis

### 1. VideoUpload Component Issues
```
analyzeVideo() → 4s timeout, FileReader scan for moov atom
   ↓
POST /api/media/stream-upload with durationHint
   ↓
TUS protocol with tus-js-client
   ↓
Proxied via /api/media/tus-proxy
```

**Problems:**
- ❌ `analyzeVideo()` is 50+ lines of complex logic that's mostly unnecessary
- ❌ Moov atom detection doesn't affect upload (Cloudflare handles this)
- ❌ Duration hint is optional, not required by Stream API
- ❌ Pre-upload analysis adds 4s+ latency before upload even starts

### 2. TUS Protocol Overhead
- TUS is resumable protocol (good for large files)
- But client must upload via `/api/media/tus-proxy` relay
- This adds server relay overhead (extra network hop)
- Most videos are < 1GB, don't need resumability complexity

### 3. Direct Creator Upload is Simpler
- Cloudflare Stream recommends Direct Creator Upload for most cases
- Single HTTP POST, no multipart, no TUS
- Smaller client library bundle
- No proxy relay needed
- Works natively with browser CORS

## Cloudflare Stream Best Practices

✅ **Direct Creator Upload** (recommended):
- Simple POST to one-time URL
- For files up to 5GB
- Best for most use cases
- No setup needed

⚠️ **TUS Protocol** (when resumability matters):
- For very large files (> 100MB)
- Client-side resume capability
- More complex setup

## Refactoring Plan

### Phase 1: Simplify Client (VideoUpload.tsx)
```
Remove:
- analyzeVideo() function (completely)
- durationHint passing
- Complex error scenarios
- Last file hash tracking

Keep:
- File type validation
- Upload progress
- Abort control
- Basic error handling
```

### Phase 2: Simplify API (/api/media/stream-upload/route.ts)
```
Change from TUS to Direct Creator Upload:
- Use createDirectUpload() instead of createTusUpload()
- One-time URL, client POSTs directly
- Minimal metadata (just name)
- Return direct upload URL (no proxy needed)
```

### Phase 3: Remove TUS Proxy
```
If not using TUS:
- Can remove /api/media/tus-proxy entirely
- OR keep for backward compatibility but mark deprecated
```

## Benefits of Refactor

| Metric | Current | After |
|--------|---------|-------|
| Client code | 200+ lines | ~100 lines |
| Pre-upload latency | 4+ seconds | 0 seconds |
| Network hops | 2 (browser→proxy→CF) | 1 (browser→CF) |
| Dependencies | tus-js-client | None needed |
| Error cases | 8+ | 3 |

## Implementation

1. ✅ Keep stream service (cloudflare-stream.ts) as-is
2. ✅ Update stream-upload endpoint to use Direct Upload
3. ✅ Simplify VideoUpload component
4. ✅ Remove unnecessary pre-upload logic
5. ✅ Test with real uploads
6. ✅ Update documentation
