# Cloudflare Stream Upload Rules - Complete Error Prevention Guide

**Last Updated:** 2026-04-22  
**Purpose:** Comprehensive rules to prevent ALL upload errors and failures for Cloudflare Stream  
**Source:** Official Cloudflare Stream Documentation

---

## CRITICAL RULE: Upload Method Selection

| File Size | Method | Protocol | Resumable | Timeout | Max Concurrent |
|-----------|--------|----------|-----------|---------|-----------------|
| **< 200MB** | Basic POST | HTTP POST | ❌ No | 30s-60s | 120 uploads |
| **≥ 200MB** | TUS Protocol | HTTP PATCH/HEAD | ✅ Yes | 5min+ per chunk | 120 uploads |
| **Unreliable network** | TUS Protocol | HTTP PATCH/HEAD | ✅ Yes | 5min+ per chunk | 120 uploads |

**HARDCODED LIMITS:**
- **Absolute max concurrent uploads:** 120 per account simultaneously
- **Absolute max file size:** 30 GB
- **Min video duration:** 0.1 seconds (videos shorter fail encoding)
- **ERROR 400 MAIN CAUSE:** Using basic POST for files >200MB. Switch to TUS.

---

## 1. FILE & FORMAT REQUIREMENTS

### Supported Formats
✅ MP4, MKV, MOV, AVI, FLV, MPEG-2 TS/PS, MXF, LXF, GXF, 3GP, WebM, MPG, Quicktime

### Optimal Codec Settings (Required for >200MB)
```
Container: MP4
Video Codec: H.264
Audio Codec: AAC
Frame Rate: 60 FPS or lower
Audio Channels: Mono or Stereo (multi-channel auto-downmixed)
```

**ERROR 400 Fix:** Wrong codec = validation fail. Use H.264 + AAC only.

### File Size Limits
- **Hard Limit:** 30 GB absolute maximum
- **Practical Limit for POST:** 200 MB
- **TUS Optimal Chunk:** 5-50 MB chunks (50 MB recommended)
- **Total Timeout:** 24 hours per upload session

**ERROR 413 (Payload Too Large):** Chunk exceeds server limit. Reduce chunk to 50MB max.

---

## 2. DIRECT CREATOR UPLOADS - Backend Setup

### Step 1: Generate One-Time Upload URL (Backend Only - Bearer Token Required)

**Authentication:**
```bash
curl -X POST https://api.cloudflare.com/client/v4/accounts/{account_id}/stream/direct_upload \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json" \
  -d '{...payload...}'
```

**REQUIRED Parameters:**
```json
{
  "maxDurationSeconds": 3600,
  "requireSignedURLs": false,
  "expiry": 86400,
  "metadata": {
    "name": "video-name.mp4"
  }
}
```

**CRITICAL RULES:**
- `maxDurationSeconds` MUST be specified (reserves account quota)
- **Token must be Bearer token** (NOT API Key) for security
- `expiry` recommended: 24h (24 * 3600 = 86400 seconds), max 7 days recommended
- Never expose API token to client (backend only)
- Token is **one-time use only** per upload
- If upload fails/expires, entire `maxDurationSeconds` reservation released

**Response Includes:**
```json
{
  "uploadURL": "https://upload.videodelivery.net/[UPLOAD_TOKEN]",
  "uid": "[VIDEO_UID]"
}
```

**CRITICAL FORMULA - maxDurationSeconds:**
```
Calculate: (File_Size_GB × 8) / 2.5 Mbps = maxDurationSeconds

Example:
- 500MB file → (0.5 × 8) / 2.5 = 1600 seconds ≈ 26.7 minutes
- 2GB file → (2 × 8) / 2.5 = 6400 seconds ≈ 107 minutes
- 5GB file → (5 × 8) / 2.5 = 16000 seconds ≈ 266 minutes (4.4 hours)

Rule: Always add 20% buffer for network overhead
Example: 500MB → 1600 × 1.2 = 1920 seconds
```

**ERROR 402 (Payment Required):** 
- Account quota exhausted
- `maxDurationSeconds` exceeds available quota
- Billing issue on account
- Fix: Reduce `maxDurationSeconds`, check account quota in dashboard, verify billing

### Step 2: Client Receives Upload URL
```
URL format: https://upload.videodelivery.net/[UPLOAD_TOKEN]
```

---

## 3. CONCURRENT UPLOAD LIMITS & QUEUING

**Hard Limit:** 120 simultaneous uploads per account

**What Happens at Limit:**
- New upload requests return **429 Too Many Requests**
- Must wait for other uploads to complete
- Queue management required on client side

**Implementation:**
```javascript
// Track active uploads
let activeUploadCount = 0;
const MAX_CONCURRENT = 3; // Safe limit (not 120)

async function uploadWithQueue(file) {
  // Wait if at limit
  while (activeUploadCount >= MAX_CONCURRENT) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  activeUploadCount++;
  try {
    // Upload logic
  } finally {
    activeUploadCount--;
  }
}
```

**Best Practice:** Use 3-5 concurrent uploads, not 120 (Cloudflare recommends conservative approach for stability).

---

## 4. UPLOAD METHOD DECISION TREE

### For File Size < 200MB: Basic POST
```bash
curl -X POST \
  -H "Content-Type: application/octet-stream" \
  --data-binary @video.mp4 \
  "https://upload.videodelivery.net/[UPLOAD_TOKEN]"
```

**Headers Required:**
- `Content-Type: application/octet-stream` (NOT multipart/form-data)

**Timeout:** 30-60 seconds max

**Errors to Avoid:**
- ❌ Using `multipart/form-data` → 400 Bad Request
- ❌ Missing `Content-Type` → 400 Bad Request
- ❌ File > 200MB → 413 Payload Too Large

---

### For File Size ≥ 200MB: TUS Protocol (Resumable)

#### Client-Side: Tus-js-client Library

```javascript
import * as tus from 'tus-js-client';

const upload = new tus.Upload(file, {
  endpoint: 'https://upload.videodelivery.net',
  chunkSize: 50 * 1024 * 1024, // 50 MB chunks
  retryDelays: [0, 3000, 5000, 10000], // exponential backoff
  metadata: {
    filename: file.name,
    filetype: file.type,
    relativePath: file.webkitRelativePath || file.name,
  },
  headers: {
    Authorization: `Bearer ${uploadToken}`, // if needed
  },
  onError(error) {
    console.error('Upload failed:', error);
    // Handle retry
  },
  onProgress(bytesUploaded, bytesTotal) {
    const percentage = (bytesUploaded / bytesTotal) * 100;
    console.log(`${percentage}% uploaded`);
  },
  onSuccess() {
    console.log('Upload successful');
  },
});

upload.start();
```

#### TUS Protocol Requirements

**Headers (Automatic via tus-js-client):**
- `Tus-Resumable: 1.0.0` (TUS version)
- `Upload-Length: [TOTAL_FILE_SIZE]`
- `Upload-Metadata: filename [BASE64_ENCODED_NAME]`
- `Content-Type: application/offset+octet-stream`

**Chunk Upload Flow:**
1. POST with `Upload-Length` header → Get `Location` URL
2. PATCH chunks to `Location` URL
3. Each PATCH: `Content-Range` + chunk data
4. Server responds 204 until complete
5. Final: 200 OK + `Location` with video UID

---

## 7. WEBHOOK SETUP FOR ENCODING ERRORS (REQUIRED)

**Why Webhooks?** Only way to know if video failed encoding after upload completes.

### Setup: Configure Webhook Endpoint

**Backend setup:**
```bash
curl -X PUT \
  https://api.cloudflare.com/client/v4/accounts/{account_id}/stream/webhook \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "notificationUrl": "https://yourdomain.com/webhook/stream"
  }'
```

**CRITICAL RULES:**
- Only 1 webhook per account allowed
- Webhook URL must be public (no localhost, no 192.168.x.x)
- Must be HTTPS (not HTTP)

### Webhook Events

**Webhook triggers on:**
1. ✅ Upload successful → Video enters processing
2. ✅ Encoding complete → `status: "ready"`
3. ❌ Encoding failed → `status: "error"` (see below)

### Webhook Signature Validation (SECURITY CRITICAL)

**Every webhook must verify signature:**

```javascript
import crypto from 'crypto';

function verifyWebhookSignature(request, secret) {
  const signature = request.headers.get('Webhook-Signature');
  const [timestamp, hash] = signature.split(',').map(x => x.split('=')[1]);
  
  const body = request.body;
  const source = timestamp + body;
  
  const computed = crypto
    .createHmac('sha256', secret)
    .update(source)
    .digest('hex');
  
  // Constant-time comparison (prevent timing attacks)
  return crypto.timingSafeEqual(
    Buffer.from(hash),
    Buffer.from(computed)
  );
}
```

### Webhook Payload Example

```json
{
  "uid": "video-uid-123",
  "status": "ready",
  "pctComplete": 100,
  "statusDescription": "Video is ready to be played",
  "metadata": {
    "duration": 120.5
  }
}
```

OR (on error):

```json
{
  "uid": "video-uid-456",
  "status": "error",
  "statusDescription": "Video failed encoding - corrupted file",
  "metadata": {}
}
```

---

## 8. ENCODING ERRORS (Post-Upload Failures)

**Videos can FAIL encoding after successful upload:**

### Common Encoding Failure Reasons

| Error | Cause | Fix |
|-------|-------|-----|
| **Non-video file** | Uploaded file is not a video | Validate with ffprobe before upload |
| **Corrupted file** | File header/data damaged | Re-encode with ffmpeg |
| **Duration < 0.1s** | Video too short (minimum 0.1 seconds) | Ensure min 0.1 second duration |
| **Duration constraint exceeded** | Video longer than `maxDurationSeconds` | Upload failed, redo with larger quota |
| **Invalid download URL** | Link-based upload from bad URL | Verify URL returns valid video |
| **Unsupported codec** | H.265, VP9, or other non-H.264 | Transcode to H.264 |
| **Invalid frame rate** | >70 FPS | Ensure video ≤ 70 FPS |

### How to Detect Encoding Errors

**Method 1: Webhooks (Recommended)**
```javascript
app.post('/webhook/stream', (req, res) => {
  const { uid, status, statusDescription } = req.body;
  
  if (status === 'error') {
    console.error(`Video ${uid} failed: ${statusDescription}`);
    // Store error, notify user, retry or request reupload
    notifyUserOfEncodingFailure(uid, statusDescription);
  }
  
  res.json({ success: true });
});
```

**Method 2: Polling (Not Recommended)**
```javascript
async function pollVideoStatus(uid) {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/{account_id}/stream/${uid}`,
    { headers: { 'Authorization': 'Bearer {api_token}' } }
  );
  
  const video = await response.json();
  
  if (video.result.status === 'error') {
    console.error('Encoding failed:', video.result.statusDescription);
  }
}
```

### Prevention: Pre-Upload Validation

```javascript
import ffmpeg from 'fluent-ffmpeg';

async function validateVideoFile(file) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(file.path, (err, metadata) => {
      if (err) {
        reject(new Error('Invalid video file'));
        return;
      }
      
      const video = metadata.streams.find(s => s.codec_type === 'video');
      const audio = metadata.streams.find(s => s.codec_type === 'audio');
      
      // Validation checks
      if (!video) reject(new Error('No video stream'));
      if (video.codec_name !== 'h264') 
        reject(new Error('Must be H.264, got ' + video.codec_name));
      if (audio && audio.codec_name !== 'aac')
        reject(new Error('Must be AAC audio'));
      if (video.r_frame_rate && parseFloat(video.r_frame_rate) > 70)
        reject(new Error('Frame rate must be ≤70 FPS'));
      
      const duration = parseFloat(metadata.format.duration);
      if (duration < 0.1)
        reject(new Error('Video must be at least 0.1 seconds'));
      
      resolve({ video, audio, duration });
    });
  });
}
```

---

## 9. ERROR CODES & FIXES

### 400 Bad Request
**Causes:**
- ❌ Using POST method for file >200MB (use TUS instead)
- ❌ Wrong `Content-Type` header (use `application/octet-stream`)
- ❌ Multipart/form-data on basic upload (use binary)
- ❌ Missing `Upload-Length` in TUS (required)
- ❌ Invalid or expired upload token
- ❌ Malformed video file

**Fixes:**
```javascript
// ❌ WRONG
fetch(uploadUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'multipart/form-data' },
  body: formData,
});

// ✅ CORRECT
fetch(uploadUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/octet-stream' },
  body: arrayBuffer,
});

// ✅ FOR >200MB: USE TUS
// See TUS section above
```

### 402 Payment Required
**Causes:**
- ❌ Account quota exhausted
- ❌ `maxDurationSeconds` exceeds available quota
- ❌ Billing issue on account
- ❌ Storage limit exceeded

**Fixes:**
- Reduce `maxDurationSeconds` when creating upload URL
- Check account quota in Cloudflare dashboard
- Verify billing info
- Delete old videos to free quota

### 413 Payload Too Large
**Causes:**
- ❌ Single chunk > server limit (typically 100MB)
- ❌ Not using TUS for large files
- ❌ Chunk size misconfigured

**Fixes:**
```javascript
// ✅ Reduce chunk size
const upload = new tus.Upload(file, {
  chunkSize: 50 * 1024 * 1024, // 50 MB (not 100+)
});

// ✅ Always use TUS for >200MB
if (file.size > 200 * 1024 * 1024) {
  usesTusProtocol = true;
}
```

### 422 Unprocessable Entity
**Causes:**
- ❌ Video codec not H.264
- ❌ Audio codec not AAC
- ❌ Invalid frame rate (>70 FPS)
- ❌ Corrupted file header
- ❌ Metadata validation failed

**Fixes:**
```bash
# Convert to compliant format
ffmpeg -i input.mov \
  -c:v libx264 \
  -c:a aac \
  -fps_mode vfr \
  -r 60 \
  -q:v 5 \
  output.mp4
```

### 429 Too Many Requests
**Causes:**
- ❌ Exceeding rate limits
- ❌ Rapid retries without backoff
- ❌ Multiple simultaneous uploads to same account (>120 limit)
- ❌ API rate limiting on direct upload endpoint

**Fixes:**
- Implement exponential backoff: `[0, 3s, 5s, 10s, 30s, 60s]`
- Queue uploads (max 3-5 concurrent, not 120)
- Add delay between upload starts
- Check if hitting 120 concurrent limit

### 500 Internal Server Error (Temporary)
**Causes:**
- ❌ Cloudflare infrastructure issue
- ❌ Worker timeout during processing
- ❌ Temporary network issues

**Fixes:**
- Retry with exponential backoff
- Use TUS (auto-resumes from last chunk)
- Check status.cloudflare.com
- Contact Cloudflare support if persists

### 503 Service Unavailable
**Causes:**
- ❌ Cloudflare Stream service temporarily down
- ❌ Video encoding queue backlog

**Fixes:**
- Retry with exponential backoff (5-10 minute delay)
- Check status.cloudflare.com
- Queue for later retry

### Other HTTP Errors

| Code | Cause | Fix |
|------|-------|-----|
| **401 Unauthorized** | Invalid/expired Bearer token | Regenerate token on backend |
| **403 Forbidden** | Token lacks permission or account limit | Check account permissions, upgrade plan |
| **404 Not Found** | Video UID doesn't exist or invalid endpoint | Verify UID, use correct API version |
| **405 Method Not Allowed** | Wrong HTTP method (GET instead of POST) | Use correct HTTP method |
| **415 Unsupported Media Type** | Wrong Content-Type header | Use `application/octet-stream` |

---

## 10. CONTENT SECURITY POLICY (CSP) REQUIREMENTS

**CRITICAL:** If using Stream Player, CSP must include Stream domains.

### Required CSP Directives

```html
<!-- If using Cloudflare Stream Player -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' videodelivery.net;
  frame-src videodelivery.net;
  style-src 'self' 'unsafe-inline' videodelivery.net;
  media-src 'self' videodelivery.net;
  connect-src 'self' videodelivery.net;
  img-src 'self' data: videodelivery.net;
">

<!-- OR add to HTTP header -->
Content-Security-Policy: 
  script-src videodelivery.net; 
  frame-src videodelivery.net;
  connect-src videodelivery.net;
```

### Required Domains

- `videodelivery.net` - Stream uploads and delivery
- `*.cloudflarestream.com` - If using Stream Player

**ERROR:** If CSP blocks Stream, video upload or playback fails silently.

---

## 11. VIDEO ENCODING OPTIMIZATION

### Optimal Settings (For Best Results)

```bash
# Recommended ffmpeg command
ffmpeg -i input.mov \
  -c:v libx264 \
  -preset medium \
  -crf 23 \
  -c:a aac \
  -b:a 128k \
  -r 30 \
  -movflags +faststart \
  output.mp4
```

### Settings Explained

| Setting | Value | Why |
|---------|-------|-----|
| **Container** | MP4 | Required for Stream |
| **Video Codec** | H.264 (libx264) | Only supported |
| **Audio Codec** | AAC | Only supported |
| **Frame Rate** | 30 FPS | ≤60 FPS, 30 recommended |
| **Bitrate Video** | 1-8 Mbps | 1 Mbps (360p) to 8 Mbps (1080p) |
| **Bitrate Audio** | 128-256 kbps | AAC typical |
| **moov atom** | faststart | CRITICAL: Position at front for streaming |
| **HDR** | Auto-converted | HDR → SDR (automatic) |
| **Multi-channel audio** | Auto-downmixed | >2 channels → Stereo (automatic) |
| **Variable frame rate** | Auto-normalized | Duplicate frames dropped in 1/30s windows |

### Bitrate Recommendations

```
Resolution | Recommended Bitrate | Max Bitrate
360p       | 1-2 Mbps           | 2.5 Mbps
480p       | 2-3 Mbps           | 3.5 Mbps
720p       | 3-5 Mbps           | 6 Mbps
1080p      | 5-8 Mbps           | 10 Mbps
```

### moov Atom Positioning (CRITICAL)

```bash
# Check current position
ffprobe -of json input.mp4 | grep -i moov

# Fix with faststart (moves moov to front)
ffmpeg -i input.mp4 -c copy -movflags +faststart output.mp4

# ERROR: If moov at end, video may fail to start playback
```

---

## 12. VIDEO SUBSCRIPTION & RETENTION RULES

### Important Limits

- **Video retention:** 30 days after subscription cancellation
- **If subscription not renewed:** All videos deleted after 30 days
- **Account deletion:** All associated videos removed

**Rule:** Always have active subscription or download videos before cancellation.

---

## 13. RECOMMENDED IMPLEMENTATION CHECKLIST

### Backend Setup
- [ ] Store Cloudflare API token securely (use env vars, not hardcoded)
- [ ] Use Bearer token authentication (not API Key)
- [ ] Implement one-time upload URL generation
- [ ] Calculate `maxDurationSeconds` with 20% buffer
- [ ] Set upload token expiry to 24 hours
- [ ] Setup webhook endpoint (HTTPS only, public URL)
- [ ] Implement webhook signature verification (HMAC-SHA256)
- [ ] One webhook per account (cannot have multiple)

### Pre-Upload Client-Side Validation
- [ ] File size check: Show TUS UI for >200MB
- [ ] Format check: Validate `.mp4`, `.mkv`, `.mov` only
- [ ] Codec check: Run ffprobe to verify H.264 + AAC (CRITICAL for >200MB)
- [ ] Duration check: Ensure ≥0.1 seconds
- [ ] Frame rate check: Ensure ≤70 FPS
- [ ] Audio check: Mono/stereo only (multi-channel will be downmixed)
- [ ] moov atom: Verify positioned at front with `ffmpeg -movflags +faststart`
- [ ] Storage check: Request new upload token, verify 402 not returned
- [ ] Concurrent count: Ensure <120 uploads, recommend <5

### Upload Configuration
- [ ] Use TUS for files ≥200MB (non-negotiable)
- [ ] Use basic POST only for <200MB with reliable connection
- [ ] Chunk size: 50 MB for TUS (not 100+)
- [ ] Timeout per chunk: 5+ minutes (not 30 seconds)
- [ ] Retry logic: exponential backoff [0, 3s, 5s, 10s, 30s, 60s]
- [ ] Max retries: 7 attempts (up to ~2 minutes total)
- [ ] Content-Type: `application/octet-stream` (not multipart/form-data)
- [ ] Queue management: Max 3-5 concurrent (not 120)

### Error Handling by Status Code
- [ ] **400** → Show "Invalid file format", verify H.264/AAC, retry with conversion
- [ ] **401** → Regenerate Bearer token on backend
- [ ] **402** → Show "Account quota exceeded", reduce `maxDurationSeconds`
- [ ] **403** → Check account permissions, may need plan upgrade
- [ ] **404** → Verify UID/endpoint, check API version
- [ ] **405** → Use correct HTTP method
- [ ] **413** → Reduce chunk size to 50MB, retry
- [ ] **415** → Use correct Content-Type header
- [ ] **422** → Convert video to H.264/AAC via ffmpeg, retry
- [ ] **429** → Add exponential backoff, queue uploads, check 120 concurrent limit
- [ ] **500** → Retry with exponential backoff
- [ ] **503** → Service down, retry after 5-10 minutes

### Post-Upload (CRITICAL)
- [ ] Store returned video UID in database
- [ ] Setup webhook listener (or poll if webhook not available)
- [ ] **WAIT for encoding:** Don't show video as "ready" until webhook confirms
- [ ] Detect encoding errors: `status: "error"` in webhook
- [ ] On encoding error: Notify user with `statusDescription`
- [ ] On encoding error: Offer retry/reupload option
- [ ] CSP headers: Include `videodelivery.net` and `*.cloudflarestream.com`
- [ ] Never trust client-side success; verify via API/webhook

### Monitoring & Logging
- [ ] Log all upload attempts (file size, method, timestamp)
- [ ] Log all webhook events (UID, status, error)
- [ ] Monitor concurrent upload count (alert if approaching 120)
- [ ] Monitor account quota usage
- [ ] Setup alerts for encoding failures
- [ ] Track retry count per upload
- [ ] Monitor average upload time by file size

---

## 14. CLOUDFLARE STREAM WORKER (Optional Proxy for Debugging)

If direct upload fails, proxy through Cloudflare Worker:

```javascript
// worker.js
export default {
  async fetch(request, env) {
    const uploadUrl = request.headers.get('X-Upload-Url');
    
    return fetch(uploadUrl, {
      method: request.method,
      headers: {
        'Content-Type': 'application/offset+octet-stream',
        'Upload-Length': request.headers.get('Upload-Length'),
        'Upload-Offset': request.headers.get('Upload-Offset'),
        'Tus-Resumable': '1.0.0',
      },
      body: request.body,
      duplex: 'half', // Required for streaming
    });
  },
};
```

---

## 15. TESTING CHECKLIST FOR >200MB UPLOADS

### 1. Validate Input File

```bash
# Check format and codec
ffprobe -v error -select_streams v:0 \
  -show_entries stream=codec_name,r_frame_rate,duration \
  -of csv=p=0 video.mp4

# Expected output:
# h264,30,120.5

# Check moov atom position
ffmpeg -i video.mp4 -c copy -movflags +faststart test-fixed.mp4
```

### 2. Create Test Videos

```bash
# Small test (50MB, 200 seconds)
ffmpeg -f lavfi -i testsrc=s=1920x1080:d=200 \
  -f lavfi -i sine=f=1000:d=200 \
  -c:v libx264 -c:a aac -r 30 -b:v 2M \
  test-50mb.mp4

# Large test (500MB, 200 seconds)
ffmpeg -f lavfi -i testsrc=s=1920x1080:d=200 \
  -f lavfi -i sine=f=1000:d=200 \
  -c:v libx264 -c:a aac -r 30 -b:v 20M \
  test-500mb.mp4

# Edge case: Very short video (0.1 seconds, minimum)
ffmpeg -f lavfi -i testsrc=s=1920x1080:d=0.1 \
  -f lavfi -i sine=f=1000:d=0.1 \
  -c:v libx264 -c:a aac -r 30 \
  test-short.mp4
```

### 3. Test TUS Protocol Support

```bash
# Check if TUS server is online
curl -X OPTIONS https://upload.videodelivery.net/ \
  -H "Tus-Resumable: 1.0.0" \
  -H "Upload-Length: 524288000" \
  -v

# Expected response:
# HTTP/1.1 204 No Content
# Tus-Resumable: 1.0.0
# Tus-Version: 1.0.0
```

### 4. Test Upload URL Generation

```bash
# Backend test
curl -X POST https://api.cloudflare.com/client/v4/accounts/{account_id}/stream/direct_upload \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "maxDurationSeconds": 3600,
    "metadata": { "name": "test.mp4" }
  }' \
  -v

# Expected response:
# HTTP/1.1 200 OK
# { "uploadURL": "https://upload.videodelivery.net/...", "uid": "..." }
```

### 5. Test Client Upload

```javascript
// Monitor TUS upload progress
import * as tus from 'tus-js-client';

const file = document.getElementById('file').files[0];
const upload = new tus.Upload(file, {
  endpoint: 'https://upload.videodelivery.net',
  chunkSize: 50 * 1024 * 1024,
  onError(error) {
    console.error('Upload error:', error.message, error.cause);
  },
  onProgress(bytesUploaded, bytesTotal) {
    const pct = (bytesUploaded / bytesTotal * 100).toFixed(1);
    console.log(`Upload: ${pct}% (${bytesUploaded}/${bytesTotal})`);
  },
  onSuccess() {
    console.log('Upload complete!');
  },
});

upload.start();
```

### 6. Test Webhook Integration

```bash
# Simulate webhook signature for testing
curl -X POST http://localhost:3000/webhook/stream \
  -H "Content-Type: application/json" \
  -H "Webhook-Signature: ts=1234567890,sig=..." \
  -d '{
    "uid": "test-uid",
    "status": "ready",
    "pctComplete": 100
  }'

# Expected response: { "success": true }
```

### 7. Error Scenarios to Test

```javascript
// Test scenario matrix
const testCases = [
  { file: 'test-short.mp4',   expected: 'ERROR: Duration < 0.1s' },
  { file: 'test-50mb.mp4',    expected: 'SUCCESS with basic POST' },
  { file: 'test-500mb.mp4',   expected: 'SUCCESS with TUS' },
  { file: 'test-1gb.mp4',     expected: 'SUCCESS with TUS, multiple chunks' },
  { file: 'corrupted.mp4',    expected: 'ERROR: 422 Corrupted file' },
  { file: 'h265.mp4',         expected: 'ERROR: 422 Wrong codec' },
];

// Run tests and log results
```

---

## 16. QUOTA & BILLING RULES

| Item | Limit | Notes |
|------|-------|-------|
| **Max file size** | 30 GB | Hard limit, files >30GB rejected |
| **Max concurrent uploads** | 120 per account | Returns 429 if exceeded |
| **Max duration per upload URL** | Configurable in `maxDurationSeconds` | Custom per upload |
| **Upload URL validity** | Max 7 days | Recommended 24h default |
| **Storage quota** | Plan-dependent | Check account dashboard |
| **Video retention** | 30 days after cancellation | Deleted if not renewed |
| **Concurrent streams** | Unlimited | Limited by bandwidth |
| **Encoding bitrate** | 1-8 Mbps | Depends on resolution |
| **Moov atom position** | Must be at front | Auto-fixed with faststart |

**CRITICAL CALCULATION:** Always estimate `maxDurationSeconds` conservatively.

```javascript
// Formula: (File_Size_GB × 8 bits/byte) / 2.5 Mbps + 20% buffer
const fileSizeGB = file.size / (1024 * 1024 * 1024);
const baseSeconds = Math.ceil((fileSizeGB * 8) / 2.5);
const maxDurationSeconds = Math.ceil(baseSeconds * 1.2); // 20% buffer

// Examples:
// 500MB file → (0.5 × 8) / 2.5 × 1.2 = 1920 seconds ≈ 32 minutes
// 2GB file → (2 × 8) / 2.5 × 1.2 = 7680 seconds ≈ 128 minutes
// 5GB file → (5 × 8) / 2.5 × 1.2 = 19200 seconds ≈ 320 minutes
```

---

## 17. REAL-WORLD SCENARIO: 500MB Video Upload

**Problem:** User uploads 500MB video → 400 error

**Complete Debug Workflow:**

```javascript
// STEP 1: Validate file BEFORE requesting upload token
console.log('File size:', file.size); // 524288000 bytes = 500 MB

// STEP 2: Check if TUS required
const isTusRequired = file.size > 200 * 1024 * 1024; // true
console.log('TUS required:', isTusRequired); // true

// STEP 3: Validate file format
ffmpeg.ffprobe(file.path, (err, metadata) => {
  const video = metadata.streams.find(s => s.codec_type === 'video');
  const audio = metadata.streams.find(s => s.codec_type === 'audio');
  
  console.log('Video codec:', video.codec_name); // h264
  console.log('Audio codec:', audio.codec_name); // aac
  console.log('Frame rate:', video.r_frame_rate); // 30
  
  if (video.codec_name !== 'h264') {
    console.error('ERROR: Must convert to H.264');
    return;
  }
});

// STEP 4: Request upload token from backend
const response = await fetch('/api/stream/upload-url', {
  method: 'POST',
  body: JSON.stringify({
    fileName: file.name,
    fileSizeBytes: file.size,
    maxDurationSeconds: Math.ceil((file.size / (1024*1024*1024) * 8) / 2.5 * 1.2),
  }),
});

const { uploadURL, uid } = await response.json();
console.log('Upload URL:', uploadURL);
console.log('Video UID:', uid);

// STEP 5: Upload with TUS
const upload = new tus.Upload(file, {
  endpoint: 'https://upload.videodelivery.net',
  headers: {
    'Authorization': `Bearer ${uploadToken}` // if required
  },
  chunkSize: 50 * 1024 * 1024, // 50 MB chunks
  retryDelays: [0, 3000, 5000, 10000, 30000, 60000],
  metadata: {
    filename: file.name,
    filetype: file.type,
  },
  onError(error) {
    console.error('Upload error:', error);
    if (error.status === 400) {
      console.error('400 Bad Request - Check TUS headers');
    }
    if (error.status === 413) {
      console.error('413 Payload Too Large - Reduce chunk size');
    }
    if (error.status === 429) {
      console.error('429 Too Many Requests - Wait before retry');
    }
  },
  onProgress(bytesUploaded, bytesTotal) {
    const pct = ((bytesUploaded / bytesTotal) * 100).toFixed(1);
    console.log(`Upload progress: ${pct}% (${bytesUploaded}/${bytesTotal} bytes)`);
  },
  onSuccess() {
    console.log('Upload successful! UID:', uid);
    // Now wait for webhook or poll for encoding
    waitForEncodingWebhook(uid);
  },
});

upload.start();

// STEP 6: Wait for encoding via webhook (CRITICAL)
function waitForEncodingWebhook(uid) {
  // Don't show video as "ready" until webhook says so
  // Webhook should arrive within 1-5 minutes for typical videos
  console.log(`Waiting for encoding webhook for ${uid}...`);
}
```

---

## 18. SUMMARY: COMPLETE DO's & DON'Ts

### ✅ BACKEND RULES (DO)

- ✅ Use Bearer token (not API Key) for authentication
- ✅ Validate `maxDurationSeconds` won't exceed account quota
- ✅ Store video UID and webhook signature secret securely
- ✅ Implement HMAC-SHA256 signature verification on webhooks
- ✅ Generate one-time upload URLs only (never reuse)
- ✅ Set upload token expiry to 24 hours
- ✅ Calculate `maxDurationSeconds` with 20% buffer
- ✅ Setup webhook endpoint on HTTPS (not HTTP, not localhost)
- ✅ Verify webhook authenticity before processing
- ✅ Log all webhook events for debugging

### ✅ CLIENT-SIDE RULES (DO)

- ✅ Validate file format before requesting upload token
- ✅ Check file codec with ffprobe (H.264 + AAC required)
- ✅ Use TUS for ANY file ≥200MB (non-negotiable)
- ✅ Use basic POST only for <200MB with stable connection
- ✅ Set chunk size: 50 MB (never >100MB)
- ✅ Implement exponential backoff: [0, 3s, 5s, 10s, 30s, 60s]
- ✅ Queue uploads (max 3-5 concurrent, respect 120 account limit)
- ✅ Monitor upload progress and show progress bar
- ✅ Handle all error codes individually (not generic 400 handler)
- ✅ Add CSP headers for `videodelivery.net`

### ✅ POST-UPLOAD RULES (DO)

- ✅ Store returned video UID immediately in database
- ✅ Wait for webhook before showing video as "ready"
- ✅ Never trust client-side completion (verify via API/webhook)
- ✅ Detect encoding failures from webhook `status: "error"`
- ✅ Notify user with human-readable error from `statusDescription`
- ✅ Offer retry/reupload option if encoding failed
- ✅ Setup monitoring for encoding failures
- ✅ Log all webhook events for analytics
- ✅ Set alerts for videos in error state

### ❌ DON'T (Common Mistakes)

- ❌ DON'T use basic POST for >200MB (will fail with 400)
- ❌ DON'T use `multipart/form-data` (causes 400)
- ❌ DON'T forget `Content-Type: application/octet-stream`
- ❌ DON'T retry immediately without backoff (causes 429)
- ❌ DON'T ignore webhook and just poll API (inefficient)
- ❌ DON'T trust client-side "success" message
- ❌ DON'T use `maxDurationSeconds` larger than account quota
- ❌ DON'T set timeout < 5 minutes per TUS chunk
- ❌ DON'T upload without implementing error handlers
- ❌ DON'T show video as "ready" until encoding confirmed
- ❌ DON'T expose API token to client (use backend URL generation)
- ❌ DON'T skip webhook signature verification (security risk)
- ❌ DON'T assume all 400 errors are same (could be different causes)
- ❌ DON'T upload multiple 500MB+ files concurrently without queuing
- ❌ DON'T forget CSP headers (causes playback failures)

---

## 19. Quick Reference: 3-Step Implementation for >200MB

### Step 1: Backend - Generate Upload Token
```javascript
// Server endpoint: POST /api/stream/upload-url
app.post('/api/stream/upload-url', async (req, res) => {
  const { fileName, fileSizeBytes } = req.body;
  
  // Calculate quota needed
  const maxDurationSeconds = Math.ceil(
    (fileSizeBytes / (1024*1024*1024) * 8) / 2.5 * 1.2
  );
  
  // Generate upload URL
  const response = await fetch(
    'https://api.cloudflare.com/client/v4/accounts/{account_id}/stream/direct_upload',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        maxDurationSeconds,
        metadata: { name: fileName },
      }),
    }
  );
  
  const { uploadURL, uid } = await response.json();
  res.json({ uploadURL, uid });
});
```

### Step 2: Client - Upload with TUS
```javascript
import * as tus from 'tus-js-client';

// Get upload URL from backend
const { uploadURL } = await fetch('/api/stream/upload-url', {...}).then(r => r.json());

// Upload file
const upload = new tus.Upload(file, {
  endpoint: 'https://upload.videodelivery.net',
  chunkSize: 50 * 1024 * 1024,
  retryDelays: [0, 3000, 5000, 10000, 30000, 60000],
  onSuccess() {
    console.log('Upload complete!');
  },
});

upload.start();
```

### Step 3: Backend - Handle Webhook
```javascript
// Webhook endpoint: POST /webhook/stream
app.post('/webhook/stream', async (req, res) => {
  // Verify signature
  const signature = req.headers['webhook-signature'];
  if (!verifySignature(signature, req.body)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  const { uid, status, statusDescription } = req.body;
  
  if (status === 'ready') {
    // Video encoded successfully
    db.update('videos', { uid, status: 'ready' });
  } else if (status === 'error') {
    // Video encoding failed
    db.update('videos', { uid, status: 'error', error: statusDescription });
    notifyUser(uid, `Encoding failed: ${statusDescription}`);
  }
  
  res.json({ success: true });
});
```

---

Generated: 2026-04-22  
Source: Official Cloudflare Stream Documentation + Production Best Practices
