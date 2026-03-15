import { NextRequest, NextResponse } from 'next/server';
import { uploadFile, getAssetType } from '@/lib/storage';
import { db } from '@/lib/db';
import { mediaAssets } from '@/db/schema';
import { verifySession } from '@/lib/auth';
import path from 'path';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const contextType = formData.get('contextType') as 'course' | 'lesson' | null;
        const contextId = formData.get('contextId') as string | null;
        const storagePreference = formData.get('storagePreference') as 'r2' | 'local' | null;
        const targetFolder = formData.get('folder') as string | null;
        const context = (contextType && contextId) ? { type: contextType as 'course' | 'lesson', id: contextId } : undefined;

        // Optimization: Determine logical folder grouping for the library
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

        // Derive the bare filename from the path (e.g. "videos/uuid.mp4" → "uuid.mp4")
        const fileName = path.basename(result.path);

        // Enforce authentication for administrative roles
        let uploadedBy: string | null = null;
        try {
            const session = await verifySession();
            const allowedRoles = ['super_admin', 'school_admin', 'admin'];

            if (!session || !session.userId || (
                !allowedRoles.includes(session.role as string) &&
                !allowedRoles.includes(session.userType as string)
            )) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
            uploadedBy = session.userId;
        } catch {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
            asset_type: getAssetType(result.mimeType),
            uploaded_by: uploadedBy || undefined,
            folder: folderHint,
        } as any).returning();

        return NextResponse.json({
            url: result.url,
            path: result.path,
            assetId: asset.id,
            storageType: result.storageType,
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
