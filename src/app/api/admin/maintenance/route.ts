import { NextRequest, NextResponse } from 'next/server';
import { maintenanceService } from '@/lib/services/maintenance-service';

/**
 * Maintenance API Gateway
 * 
 * Target: /api/admin/maintenance
 * Security: CRON_SECRET header verification
 */

export async function POST(request: NextRequest) {
    const authHeader = request.headers.get('Authorization');
    const secret = process.env.CRON_SECRET;

    if (!secret || authHeader !== `Bearer ${secret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const results = await maintenanceService.purgeOldSessions(30);
        
        // Add more maintenance tasks here (e.g. analytics sync)
        
        return NextResponse.json({
            status: 'success',
            tasks: {
                sessionPurge: results
            }
        });
    } catch (error: any) {
        return NextResponse.json({
            status: 'error',
            message: error.message
        }, { status: 500 });
    }
}
