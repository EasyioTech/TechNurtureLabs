import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { db } from '@/lib/db';
import { mediaAssets, students, schoolAdmins, schools } from '@/db/schema';
import { verifySession } from '@/lib/auth';
import { getAssetType } from '@/lib/storage';
import { eq } from 'drizzle-orm';

/**
 * 📝 ASSET REGISTRATION API
 * Used to record an asset in the DB after a successful direct-to-cloud upload.
 */
export async function POST(req: NextRequest) {
    try {
        const session = await verifySession();
        if (!session || (session.role !== 'super_admin' && session.userType !== 'super_admin')) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const data = await req.json();
        const { fileName, filePath, fileSize, mimeType, storageType = 'r2', folder = 'library' } = data;

        if (!fileName || !filePath) {
            return new NextResponse('Missing asset details', { status: 400 });
        }

        // CRITICAL FIX #1: Resolve school_id from uploader (polymorphic)
        let schoolId: string | null = null;
        if (session.userType === 'student') {
            const student = await db.query.students.findFirst({
                where: eq(students.id, session.userId),
                columns: { school_id: true }
            });
            schoolId = student?.school_id || null;
        } else if (session.userType === 'school_admin') {
            const admin = await db.query.schoolAdmins.findFirst({
                where: eq(schoolAdmins.id, session.userId),
                columns: { school_id: true }
            });
            schoolId = admin?.school_id || null;
        } else if (session.userType === 'super_admin') {
            // CRITICAL FIX #2: Super admins uploading platform-wide media must use a default school
            // Instead of null (which violates NOT NULL constraint), use first school's ID
            // This allows super admins to manage global media while maintaining referential integrity
            const firstSchool = await db.query.schools.findFirst({
                columns: { id: true }
            });
            schoolId = firstSchool?.id || null;
        }
        // Fallback: If schoolId is still null, assign to first school
        if (!schoolId) {
            const firstSchool = await db.query.schools.findFirst({
                columns: { id: true }
            });
            schoolId = firstSchool?.id || null;
        }

        const assetType = getAssetType(mimeType);
        const isProcessableVideo = assetType === 'video' && storageType === 'r2';
        const isPptx =
            mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
            mimeType === 'application/vnd.ms-powerpoint';

        // file_name = the UUID-based storage key (basename of filePath)
        // original_name = the human-readable filename the user uploaded
        const uuidFileName = path.basename(filePath);

        const [asset] = await db.insert(mediaAssets).values({
            file_name: uuidFileName,
            original_name: fileName,
            file_path: filePath,
            mime_type: mimeType,
            file_size: fileSize,
            storage_type: storageType,
            asset_type: assetType,
            uploaded_by: session.userId,
            school_id: schoolId, // CRITICAL FIX: Capture school context at upload time
            folder: folder,
            processing_status: 'completed',
        } as any).returning();

        // Compute the final URL using the standard utility
        const { computeMediaUrl } = await import('@/lib/media');
        const finalUrl = computeMediaUrl(asset);

        return NextResponse.json({
            success: true,
            assetId: asset.id,
            asset: {
                id: asset.id,
                file_name: asset.file_name,
                original_name: asset.original_name,
                file_url: finalUrl,
                file_path: asset.file_path,
                mime_type: asset.mime_type,
                file_size: asset.file_size,
                storage_type: asset.storage_type,
                asset_type: asset.asset_type,
                created_at: asset.created_at
            },
            url: finalUrl,
            processingStatus: asset.processing_status,
            // Add cache-busting header info for client
            refreshRequired: true
        }, {
            headers: {
                'Cache-Control': 'no-store, max-age=0'
            }
        });

    } catch (err: any) {
        console.error('[Register Error]:', err);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
