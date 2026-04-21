# Video Upload Test Plan - E2E Validation

## Scope
Tests for `src/modules/shared/components/video-upload.tsx` and `src/lib/services/cloudflare-stream.ts`

---

## Test Environment Setup

**Prerequisites:**
- Cloudflare Stream API credentials configured (CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_STREAM_API_TOKEN)
- Super-admin account
- Test video files: 10MB, 50MB, 500MB
- Network conditions: Normal, slow (simulate latency)

---

## Test Cases

### ✓ UPLOAD INITIATION

**TC-001: Valid video file upload starts**
- [ ] Select valid MP4 video (5-20MB)
- [ ] Progress bar appears
- [ ] Submit button shows "X%"
- [ ] Expected: Progress updates, upload starts

**TC-002: Invalid file type rejected**
- [ ] Select non-video file (PDF, image, audio)
- [ ] Expected: Toast error "Please upload a valid video file"
- [ ] Component state: unchanged, upload doesn't start

**TC-003: Missing file handled gracefully**
- [ ] Click upload, don't select file
- [ ] Click cancel on file picker
- [ ] Expected: No error, upload doesn't start

**TC-004: Super-admin restriction enforced**
- [ ] Log in as school-admin (non-super-admin)
- [ ] Attempt to upload video
- [ ] Expected: UI disabled, cannot select file

---

### ✓ TUS RESUMABLE UPLOAD

**TC-005: Normal upload completes**
- [ ] Upload 10MB video on stable connection
- [ ] Watch progress: 5% → 100%
- [ ] Expected: Toast success, video UID returned (cf-stream://...), iframe displays

**TC-006: Progress accuracy**
- [ ] Upload 50MB video
- [ ] Progress increments match network throughput
- [ ] Expected: Smooth progress curve (not jumpy), final value = 100%

**TC-007: Metadata sent to Cloudflare**
- [ ] Upload video named "test-video.mp4"
- [ ] Check Cloudflare Stream UI or API
- [ ] Expected: Metadata shows filename, upload_by, etc.

**TC-008: Resume interrupted upload**
- [ ] Start 200MB video upload
- [ ] Forcefully kill browser tab mid-upload (at ~30%)
- [ ] Reopen tab, select same file again
- [ ] Expected: TUS resumes from checkpoint, completes successfully

---

### ✓ ERROR HANDLING

**TC-009: Stream API timeout (30s)**
- [ ] Simulate network latency (simulate >30s response time)
- [ ] Attempt to initialize upload
- [ ] Expected: AbortError caught, toast "Request timed out" or similar

**TC-010: Invalid upload URL from server**
- [ ] Mock `/api/media/stream-upload` to return empty uploadUrl
- [ ] Attempt upload
- [ ] Expected: Toast error "Missing upload URL or video ID"

**TC-011: Missing UID from server**
- [ ] Mock `/api/media/stream-upload` to return missing uid field
- [ ] Attempt upload
- [ ] Expected: Toast error "Missing upload URL or video ID"

**TC-012: JSON parse error from server**
- [ ] Mock `/api/media/stream-upload` to return invalid JSON
- [ ] Attempt upload
- [ ] Expected: Toast error "Server returned invalid response"

**TC-013: CSRF token missing handled gracefully**
- [ ] Delete csrf_token cookie
- [ ] Attempt upload
- [ ] Expected: Upload still works (CSRF header optional), completes successfully

**TC-014: Network error during upload**
- [ ] Kill network mid-upload
- [ ] Expected: Toast error "Upload failed: ..." (TUS error message)
- [ ] State: isUploading = false, progress reset

---

### ✓ STATE MANAGEMENT

**TC-015: Duplicate upload detection**
- [ ] Upload video A (succeeds, value = cf-stream://uid-1)
- [ ] Try to upload same file again immediately
- [ ] Expected: Toast "This video was already uploaded", upload blocked

**TC-016: Input cleared after success**
- [ ] Upload video
- [ ] Wait for success
- [ ] Expected: File input value = '', can select new file immediately

**TC-017: Upload progress preserved across renders**
- [ ] Start upload
- [ ] Scroll parent page
- [ ] Expected: Progress bar still visible, continues counting up

**TC-018: Multiple simultaneous uploads blocked**
- [ ] Start upload A
- [ ] While uploading, try to start upload B
- [ ] Expected: Input disabled, upload B blocked

---

### ✓ COMPONENT INTEGRATION

**TC-019: Video preview displays after upload**
- [ ] Upload video
- [ ] Wait for completion
- [ ] Expected: Iframe shows (cf-stream:// URL embedded in videodelivery.net)
- [ ] Can play video in iframe

**TC-020: MediaLibraryPicker still works**
- [ ] Click "Browse Stream Library" button
- [ ] Expected: Dialog opens, shows existing videos from Stream

**TC-021: Value change callback fires**
- [ ] Upload succeeds
- [ ] Expected: onChange(cf-stream://uid) called
- [ ] Parent component receives video URL

**TC-022: Dark mode UI consistent**
- [ ] Set isDark={true}
- [ ] Upload video
- [ ] Expected: Dark theme applied to all UI elements

---

### ✓ PERFORMANCE & SCALE

**TC-023: Large file upload (500MB)**
- [ ] Upload 500MB video on normal connection
- [ ] Expected: Completes without memory leak, progress smooth
- [ ] Monitor browser memory: stays <200MB overhead

**TC-024: Slow network upload (simulate 500kbps)**
- [ ] Upload 50MB on throttled connection
- [ ] Expected: Progress updates frequently, UX responsive
- [ ] Completes without timeout (>30s is OK, timeout is 30s per fetch call)

**TC-025: Rapid file selection (stress test)**
- [ ] Click upload button 10 times rapidly, each with different file
- [ ] Expected: Only last selected file uploads, no crashes

---

### ✓ CLEANUP & RECOVERY

**TC-026: Cancel upload mid-stream**
- [ ] Start upload
- [ ] (If UI had cancel button) click Cancel
- [ ] Expected: AbortController aborts, toast "Upload cancelled", state reset

**TC-027: Unmount component during upload**
- [ ] Start upload
- [ ] Unmount component (navigate away)
- [ ] Expected: No memory leaks, abort controller cleaned up

**TC-028: Upload fails then retry**
- [ ] Mock API to return 500 error
- [ ] Attempt upload, get error toast
- [ ] Try same upload again
- [ ] Expected: Second attempt succeeds (or fails with same message)

---

## Test Execution Checklist

### Manual Testing (Required)

- [ ] **Browser:** Chrome, Firefox, Safari
- [ ] **Network:** Fast (10Mbps+), Slow (1Mbps), Offline
- [ ] **Devices:** Desktop, Tablet, Mobile
- [ ] **Video:** Small (1MB), Medium (50MB), Large (200MB)

### Automated Testing (Recommended)

```bash
# Unit tests
npm test -- video-upload.tsx

# Integration tests
npm test -- --integration
```

### Performance Baseline

- [ ] Upload 50MB video: Expected **<2min**, no console errors
- [ ] Memory usage during upload: <150MB overhead
- [ ] Network requests: Exactly 1 POST to `/api/media/stream-upload`, then TUS chunks

---

## Bug Tracker

| ID   | Issue | Status | Notes |
|------|-------|--------|-------|
| BUG-001 | | | |
| BUG-002 | | | |

---

## Sign-Off

- [ ] All test cases passed
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Ready for production deployment

**Tested by:** _________________ **Date:** _________

