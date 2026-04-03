import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { cleanupOldBackups, getBackupStatistics } from '@/lib/services/backup-cleanup-service';

/**
 * POST /api/admin/backup-cleanup
 * Manually trigger backup cleanup (admin only)
 */
export async function POST(request: NextRequest) {
    try {
        const session = await verifySession();
        if (!session || session.role !== 'super_admin') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const result = await cleanupOldBackups();
        return NextResponse.json(result);
    } catch (error: any) {
        console.error('[Backup Cleanup API] Error:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

/**
 * GET /api/admin/backup-cleanup
 * Get backup storage statistics
 */
export async function GET(request: NextRequest) {
    try {
        const session = await verifySession();
        if (!session || session.role !== 'super_admin') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const result = await getBackupStatistics();
        return NextResponse.json(result);
    } catch (error: any) {
        console.error('[Backup Stats API] Error:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
