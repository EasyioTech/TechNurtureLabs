import { NextRequest, NextResponse } from 'next/server';
import { performSystemWideBackupAdmin } from '@/app/(super-admin)/admin-portal/actions/backup-actions';
import { serverEnv } from '@/lib/env.server';
import { createAuditLog } from '@/lib/audit';

/**
 * GET /api/admin/backups/cron
 * Automated System-Wide Backup CRON Endpoint
 * 
 * Secure header: Authorization: Bearer <CRON_SECRET>
 */
export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    
    // Safety check: CRON_SECRET must be configured
    if (!serverEnv.CRON_SECRET) {
        return NextResponse.json(
            { error: 'CRON_SECRET not configured on server' },
            { status: 500 }
        );
    }

    if (authHeader !== `Bearer ${serverEnv.CRON_SECRET}`) {
        return NextResponse.json(
            { error: 'Unauthorized: Invalid CRON secret' },
            { status: 401 }
        );
    }

    console.log('[CRON] Starting automated system-wide backup sequence...');

    try {
        const result = await performSystemWideBackupAdmin();
        
        // Log the automated execution
        await createAuditLog({
            userId: 'system-cron',
            userType: 'system',
            action: 'backup',
            entityType: 'backup',
            entityId: 'automated-cron',
            metadata: {
                trigger: 'cron-job',
                success: result.success,
                message: result.message
            }
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('[CRON] Backup sequence failed:', error);
        
        await createAuditLog({
            userId: 'system-cron',
            userType: 'system',
            action: 'backup',
            entityType: 'backup',
            entityId: 'automated-cron-failed',
            metadata: {
                trigger: 'cron-job',
                success: false,
                error: error.message
            }
        });

        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
