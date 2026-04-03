'use server';

import { exportAllCourses, uploadBackupToR2, restoreBackup, downloadBackupFromR2, CourseBackupData } from '@/lib/services/backup-service';
import { verifySession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { s3Client, isCloudflareConfigured } from '@/lib/storage';
import { ListObjectsV2Command } from '@aws-sdk/client-s3';
import { serverEnv } from '@/lib/env.server';

export async function performBackupAction() {
    const session = await verifySession();
    if (session?.role !== 'super_admin') {
        throw new Error('Unauthorized');
    }

    try {
        const data = await exportAllCourses();
        const fileName = await uploadBackupToR2(data);
        revalidatePath('/super-admin');
        return { success: true, fileName };
    } catch (error: any) {
        console.error('[Backup Action] Error:', error);
        return { success: false, error: error.message };
    }
}

export async function listBackupsAction() {
    const session = await verifySession();
    if (session?.role !== 'super_admin') {
        throw new Error('Unauthorized');
    }

    if (!isCloudflareConfigured || !s3Client) {
        return [];
    }

    try {
        const command = new ListObjectsV2Command({
            Bucket: serverEnv.CLOUDFLARE_BUCKET_NAME,
            Prefix: 'backups/courses/',
        });

        const response = await s3Client.send(command);
        return (response.Contents || [])
            .map(item => ({
                key: item.Key!,
                size: item.Size,
                lastModified: item.LastModified,
            }))
            .sort((a, b) => (b.lastModified?.getTime() || 0) - (a.lastModified?.getTime() || 0));
    } catch (error) {
        console.error('[Backup Action] List Error:', error);
        return [];
    }
}

export async function restoreFromBackupAction(fileName: string) {
    const session = await verifySession();
    if (session?.role !== 'super_admin') {
        throw new Error('Unauthorized');
    }

    try {
        const backupData = await downloadBackupFromR2(fileName);
        await restoreBackup(backupData, session.userId);
        revalidatePath('/super-admin');
        return { success: true };
    } catch (error: any) {
        console.error('[Backup Action] Restore Error:', error);
        return { success: false, error: error.message };
    }
}
