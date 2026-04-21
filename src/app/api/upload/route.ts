import { NextRequest, NextResponse } from 'next/server';
import { uploadFile, getAssetType, s3Client, isCloudflareConfigured, getFolderPrefix } from '@/lib/storage';
import { db } from '@/lib/db';
import { mediaAssets } from '@/db/schema';
import { verifySession } from '@/lib/auth';
import { rateLimitService } from '@/lib/services/rate-limit';
import { processImage } from '@/lib/image-processor';
import path from 'path';

// 50 MB in bytes — hard cap for a single upload request body
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024 * 1024; // 2 GB (matches storage.ts)

// Allowed MIME types for admin uploads
const ALLOWED_MIME_TYPES = new Set([
    'video/mp4', 'video/webm', 'video/quicktime',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-powerpoint',
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/heic', 'image/heif', 'image/bmp', 'image/tiff',
    'audio/mpeg', 'audio/ogg', 'audio/wav',
]);

async function validateR2Connectivity(): Promise<{ ok: boolean; error?: string }> {
    if (!isCloudflareConfigured || !s3Client) {
        return { ok: false, error: 'R2 not configured' };
    }
    try {
        const { HeadBucketCommand } = await import('@aws-sdk/client-s3');
        const { serverEnv } = await import('@/lib/env.server');
        const headCmd = new HeadBucketCommand({ Bucket: serverEnv.CLOUDFLARE_BUCKET_NAME });
        await s3Client.send(headCmd);
        return { ok: true };
    } catch (err: any) {
        return { ok: false, error: `R2 unavailable: ${err?.message}` };
    }
}

export async function POST(request: NextRequest) {
    try {
        // ─── STEP 1: AUTH FIRST — before touching the body ──────────────────────
        let uploadedBy: string;
        const session = await verifySession();
        const adminRoles = ['super_admin', 'school_admin', 'admin'];
        const isStudent = session?.userType === 'student';
        const isAdmin = session && adminRoles.includes(session.role as string || session.userType as string);

        if (!session || (!isAdmin && !isStudent)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        uploadedBy = session.userId;

        // ─── STEP 1a: VALIDATE R2 EARLY (if in production) ─────────────────────────
        // In production only, check R2 connectivity upfront
        if (process.env.NODE_ENV === 'production' && isCloudflareConfigured) {
            const r2Status = await validateR2Connectivity();
            if (!r2Status.ok) {
                console.error('[Upload] R2 unavailable in production:', r2Status.error);
                return NextResponse.json({ error: r2Status.error, code: 'STORAGE_UNAVAILABLE' }, { status: 503 });
            }
        }

        // Dynamic Cap based on role
        const maxSizeBytes = isAdmin ? 2048 * 1024 * 1024 : 20 * 1024 * 1024; // 2GB vs 20MB
        const limitDisplay = isAdmin ? '2 GB' : '20 MB';

        // ─── STEP 1b: RATE LIMIT — 20 uploads per 5 minutes per user ────────────
        const { allowed: uploadAllowed, reset: uploadReset } = await rateLimitService.checkUserLimit(
            uploadedBy, 'upload', 20, 300
        );
        if (!uploadAllowed) {
            return NextResponse.json(
                { error: 'Too many uploads. Please wait before uploading again.' },
                { status: 429, headers: { 'Retry-After': uploadReset.toString() } }
            );
        }

        // ─── STEP 2: CONTENT-LENGTH PRE-CHECK ───────────────────────────────────
        const contentLength = request.headers.get('content-length');
        if (contentLength && parseInt(contentLength, 10) > maxSizeBytes) {
            return NextResponse.json({ error: `File too large (max ${limitDisplay})` }, { status: 413 });
        }

        // ─── STEP 3: PARSE FORM DATA ─────────────────────────────────────────────
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // ─── STEP 4: FILE SIZE CHECK (actual) ───────────────────────────────────
        if (file.size > maxSizeBytes) {
            return NextResponse.json({ error: `File too large (max ${limitDisplay})` }, { status: 413 });
        }

        // ─── STEP 5: MIME TYPE ALLOWLIST ─────────────────────────────────────────
        if (!ALLOWED_MIME_TYPES.has(file.type)) {
            return NextResponse.json(
                { error: `File type '${file.type}' is not allowed` },
                { status: 415 }
            );
        }

        // ─── STEP 5a: ENFORCE CLOUDFLARE STREAM ONLY FOR VIDEOS ──────────────────
        // Videos MUST NOT be uploaded to R2 — they must be uploaded to Cloudflare Stream
        const isVideo = file.type.startsWith('video/');
        if (isVideo) {
            return NextResponse.json(
                {
                    error: 'Videos must be uploaded to Cloudflare Stream only, not R2. Use the dedicated VideoUpload component or /api/media/stream-upload endpoint.',
                    code: 'VIDEO_STORAGE_MISMATCH'
                },
                { status: 400 }
            );
        }

        const contextType = formData.get('contextType') as 'course' | 'lesson' | null;
        const contextId = formData.get('contextId') as string | null;
        const storagePreference = formData.get('storagePreference') as 'r2' | null;
        const targetFolder = formData.get('folder') as string | null;
        const context = (contextType && contextId) ? { type: contextType as 'course' | 'lesson', id: contextId } : undefined;

        const folderHint = targetFolder || (context ? context.type : 'library');

        // Process image: auto-convert to WebP for optimal web delivery
        const rawBuffer = Buffer.from(await file.arrayBuffer());
        const { buffer, mimeType: processedMimeType, filename: processedFilename } = await processImage(rawBuffer, file.type, file.name);

        const result = await uploadFile(
            buffer,
            processedFilename,
            processedMimeType,
            context,
            storagePreference || undefined,
            folderHint
        );

        const fileName = path.basename(result.path);

        const assetType = getAssetType(result.mimeType);
        const isPptx =
            result.mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
            result.mimeType === 'application/vnd.ms-powerpoint';

        const correctFolder = getFolderPrefix(file.type);

        // CRITICAL FIX: Resolve school_id from uploader (polymorphic)
        let schoolId: string | null = null;
        if (isStudent && session?.userType === 'student') {
            // Students upload within their school context
            const { students } = await import('@/db/schema');
            const { eq } = await import('drizzle-orm');
            const student = await db.query.students.findFirst({
                where: eq(students.id, session.userId),
                columns: { school_id: true }
            });
            schoolId = student?.school_id || null;
        } else if (isAdmin && session?.userType === 'school_admin') {
            // School admins upload within their school context
            const { schoolAdmins } = await import('@/db/schema');
            const { eq } = await import('drizzle-orm');
            const admin = await db.query.schoolAdmins.findFirst({
                where: eq(schoolAdmins.id, session.userId),
                columns: { school_id: true }
            });
            schoolId = admin?.school_id || null;
        } else if (isAdmin && session?.userType === 'super_admin') {
            // Super admins upload platform-wide media (assign to first school)
            const { schools } = await import('@/db/schema');
            const firstSchool = await db.query.schools.findFirst({
                columns: { id: true }
            });
            schoolId = firstSchool?.id || null;
        }

        // Fallback: ensure schoolId is assigned
        if (!schoolId) {
            const { schools } = await import('@/db/schema');
            const firstSchool = await db.query.schools.findFirst({
                columns: { id: true }
            });
            schoolId = firstSchool?.id || null;
        }

        if (!schoolId) {
            return NextResponse.json(
                { error: 'No schools configured - cannot register media' },
                { status: 503 }
            );
        }

        // Persist to media library
        const [asset] = await db.insert(mediaAssets).values({
            file_name: fileName,
            original_name: file.name,
            file_url: result.url,
            file_path: result.path,
            mime_type: result.mimeType,
            file_size: result.fileSize,
            storage_type: result.storageType,
            asset_type: assetType,
            uploaded_by: uploadedBy || undefined,
            school_id: schoolId, // CRITICAL FIX: Include school_id
            folder: correctFolder,
            // Videos are handled via Cloudflare Stream, no server-side processing needed
            processing_status: 'completed',
        } as any).returning();



        // Compute the final URL using the standard utility
        const { computeMediaUrl } = await import('@/lib/media');
        const finalUrl = computeMediaUrl(asset);

        const response = NextResponse.json({
            url: finalUrl,
            path: result.path,
            assetId: asset.id,
            storageType: result.storageType,
            processingStatus: asset.processing_status,
            asset: {
                id: asset.id,
                file_name: asset.file_name,
                original_name: asset.original_name,
                file_path: asset.file_path,
                mime_type: asset.mime_type,
                file_size: asset.file_size,
                storage_type: asset.storage_type,
                asset_type: asset.asset_type,
                created_at: asset.created_at
            },
            refreshRequired: true
        });

        // Force fresh responses — don't cache upload responses
        response.headers.set('Cache-Control', 'no-store, max-age=0');
        response.headers.set('Pragma', 'no-cache');
        return response;
    } catch (error: any) {
        const errorDetails = {
            message: error?.message || String(error),
            code: error?.code || error?.$metadata?.httpStatusCode,
            name: error?.name,
            statusCode: error?.statusCode,
        };
        console.error('[Upload] Error:', errorDetails);
        console.error('[Upload] Full error:', error);

        // Return detailed error to client for debugging
        return NextResponse.json({
            error: errorDetails.message || 'Failed to upload file',
            code: errorDetails.code,
            details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
        }, { status: 500 });
    }
}
