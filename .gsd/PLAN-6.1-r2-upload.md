---
phase: 6
plan: 1
wave: 1
depends_on: []
files_modified: 
  - .env.example
  - docker-compose.yml
  - package.json
  - src/lib/storage.ts
  - src/app/api/upload/route.ts
  - src/app/api/media/[...path]/route.ts
  - src/app/admin/page.tsx
  - src/app/school-admin/page.tsx
autonomous: true
user_setup:
  - service: cloudflare
    why: "Object storage for media files"
    env_vars:
      - name: CLOUDFLARE_ACCOUNT_ID
        source: "Cloudflare Dashboard -> R2 -> Overview"
      - name: CLOUDFLARE_ACCESS_KEY_ID
        source: "Cloudflare Dashboard -> R2 -> Manage R2 API Tokens"
      - name: CLOUDFLARE_SECRET_ACCESS_KEY
        source: "Cloudflare Dashboard -> R2 -> Manage R2 API Tokens"
      - name: CLOUDFLARE_BUCKET_NAME
        source: "Create bucket in R2"
      - name: CLOUDFLARE_PUBLIC_DOMAIN
        source: "Cloudflare Dashboard -> R2 -> Settings -> Public URL"

must_haves:
  truths:
    - "System falls back to local storage if R2 variables are missing."
    - "Local storage persists across docker restarts via named volume."
    - "Admin can upload files, and users can load those media files."
  artifacts:
    - "src/lib/storage.ts exists with unified upload/delivery interface."
    - "src/app/api/upload/route.ts handles multipart uploads safely."
---

# Plan 6.1: Cloudflare R2 Upload & Local Fallback

<objective>
Implement dynamic file storage supporting both Cloudflare R2 (primary) and local VPS volume (fallback).
Purpose: Safely store and deliver video/audio/slide content for courses without losing files on container restart.
Output: Storage utility, upload API, delivery API for local files, updated admin components.
</objective>

<context>
Load for context:
- .gsd/SPEC.md
- docker-compose.yml
- src/app/admin/page.tsx
</context>

<tasks>

<task type="auto">
  <name>Foundation & Local Volume Config</name>
  <files>package.json, docker-compose.yml, .env.example</files>
  <action>
    Install `@aws-sdk/client-s3` and `uuid`.
    Add `storage_data:/app/local_storage` volume mount to `app` service in `docker-compose.yml` to persist files locally.
    Add CLOUDFLARE_* env vars to `.env.example`.
    AVOID: using `public/` directory for runtime uploads, as Next.js standalone build loses them. Use persistent volume.
  </action>
  <verify>docker-compose config validates correctly, npm list @aws-sdk/client-s3 succeeds.</verify>
  <done>Dependencies added and local volume defined.</done>
</task>

<task type="auto">
  <name>Storage Utility Provider</name>
  <files>src/lib/storage.ts</files>
  <action>
    Create a storage utility that checks for `CLOUDFLARE_ACCOUNT_ID` && `CLOUDFLARE_ACCESS_KEY_ID`.
    If present, construct S3 client.
    Implement `uploadFile(buffer, filename, mimetype)`:
      - If R2: PutObject to bucket, return `{ url: CLOUDFLARE_PUBLIC_DOMAIN + /filename, path: filename }`.
      - If local: fs.promises.writeFile to `./local_storage/${filename}`, return `{ url: /api/media/${filename}, path: filename }`.
    AVOID: hardcoding bucket name, read from env.
  </action>
  <verify>Unit test or file compiles with type safety.</verify>
  <done>storage.ts exports upload and delivery utilities.</done>
</task>

<task type="auto">
  <name>Upload and Delivery API Endpoints</name>
  <files>src/app/api/upload/route.ts, src/app/api/media/[...path]/route.ts</files>
  <action>
    Create POST `/api/upload` to receive `multipart/form-data`, extract file, call `storage.uploadFile`, and return JSON with url and path.
    Create GET `/api/media/[...path]` to read from `./local_storage/` using `fs.createReadStream` and return a NextResponse with appropriate Content-Type for local fallback delivery.
  </action>
  <verify>Endpoint accepts file payloads and returns correct structure.</verify>
  <done>API endpoints operational.</done>
</task>

<task type="auto">
  <name>Connect UI to Upload API</name>
  <files>src/app/admin/page.tsx, src/app/school-admin/page.tsx</files>
  <action>
    Replace the mock upload toast in `admin/page.tsx` line ~1194.
    FormData -> append file -> fetch('/api/upload', { method: 'POST' }).
    On success, set `content_url` and `file_path` in `editingLesson` state.
    AVOID: blocking the main thread, use async/await with loading states.
  </action>
  <verify>UI compiles, logic properly constructs FormData and awaits response.</verify>
  <done>Admin panel physically uploads files instead of mocking.</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] Local fallback stores file in `./local_storage` and serves it via `/api/media`.
- [ ] When `.env` has R2 credentials, S3 client successfully pushes.
- [ ] Admin panel upload flow handles loading states and captures the true URL.
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
