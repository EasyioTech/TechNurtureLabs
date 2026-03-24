import { NextRequest, NextResponse } from 'next/server';
import { uploadFile, getAssetType } from '@/lib/storage';
import { db } from '@/lib/db';
import { mediaAssets } from '@/db/schema';
import { verifySession } from '@/lib/auth';
import { rateLimitService } from '@/lib/services/rate-limit';
import path from 'path';

// 50 MB in bytes — hard cap for a single upload request body
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024 * 1024; // 2 GB (matches storage.ts)

// Allowed MIME types for admin uploads
const ALLOWED_MIME_TYPES = new Set([
    'video/mp4', 'video/webm', 'video/quicktime',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-powerpoint',
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'audio/mpeg', 'audio/ogg', 'audio/wav',
]);

export async function POST(request: NextRequest) {
    try {
        // ─── STEP 1: AUTH FIRST — before touching the body ──────────────────────
        let uploadedBy: string;
        const session = await verifySession();
        const allowedRoles = ['super_admin', 'school_admin', 'admin'];

        if (!session || !session.userId || (
            !allowedRoles.includes(session.role as string) &&
            !allowedRoles.includes(session.userType as string)
        )) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        uploadedBy = session.userId;

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
        if (contentLength && parseInt(contentLength, 10) > MAX_FILE_SIZE_BYTES) {
            return NextResponse.json({ error: 'File too large' }, { status: 413 });
        }

        // ─── STEP 3: PARSE FORM DATA ─────────────────────────────────────────────
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // ─── STEP 4: FILE SIZE CHECK (actual) ───────────────────────────────────
        if (file.size > MAX_FILE_SIZE_BYTES) {
            return NextResponse.json({ error: 'File too large (max 2 GB)' }, { status: 413 });
        }

        // ─── STEP 5: MIME TYPE ALLOWLIST ─────────────────────────────────────────
        if (!ALLOWED_MIME_TYPES.has(file.type)) {
            return NextResponse.json(
                { error: `File type '${file.type}' is not allowed` },
                { status: 415 }
            );
        }

        const contextType = formData.get('contextType') as 'course' | 'lesson' | null;
        const contextId = formData.get('contextId') as string | null;
        const storagePreference = formData.get('storagePreference') as 'r2' | 'local' | null;
        const targetFolder = formData.get('folder') as string | null;
        const context = (contextType && contextId) ? { type: contextType as 'course' | 'lesson', id: contextId } : undefined;

        const folderHint = targetFolder || (context ? context.type : 'library');

        const buffer = Buffer.from(await file.arrayBuffer());
        const result = await uploadFile(
            buffer,
            file.name,
            file.type,
            context,
            storagePreference || undefined,
            folderHint
        );

        const fileName = path.basename(result.path);

        const assetType = getAssetType(result.mimeType);
        const isPptx =
            result.mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
            result.mimeType === 'application/vnd.ms-powerpoint';

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
            folder: folderHint,
            // Videos are handled via Cloudflare Stream, no server-side processing needed
            processing_status: 'completed',
        } as any).returning();





        return NextResponse.json({
            url: result.url,
            path: result.path,
            assetId: asset.id,
            storageType: result.storageType,
            processingStatus: asset.processing_status,
        });
    } catch (error: any) {
        console.error('[Upload] CRITICAL ERROR:', {
            message: error.message,
            stack: error.stack,
            error
        });
        return NextResponse.json({
            error: 'Failed to upload file'
        }, { status: 500 });
    }
}
