'use server';

import { exportAllCourses, exportLesson, exportCourse, uploadBackupToR2, downloadBackupFromR2, restoreBackup, restoreLessonBackup, performInstantSave } from '@/lib/services/backup-service';
import { verifySession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { s3Client, isCloudflareConfigured } from '@/lib/storage';
import { ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { serverEnv } from '@/lib/env.server';

export async function performBackupAction() {
    const session = await verifySession();
    if (session?.role !== 'super_admin') throw new Error('Unauthorized');

    try {
        const data = await exportAllCourses();
        const result = await uploadBackupToR2(data, 'course');

        if (!result.isNew) {
            return {
                success: true,
                fileName: result.fileName,
                isNew: false,
                message: 'No changes detected. Using existing backup.'
            };
        }

        revalidatePath('/super-admin');
        return { success: true, fileName: result.fileName, isNew: true, message: 'New backup created successfully' };
    } catch (error: any) {
        console.error('[Backup Action] Error:', error);
        return { success: false, error: error.message };
    }
}

export async function performCourseBackupAction(courseId: string) {
    const session = await verifySession();
    if (session?.role !== 'super_admin') throw new Error('Unauthorized');

    try {
        const data = await exportCourse(courseId);
        const result = await uploadBackupToR2(data, 'course');

        if (!result.isNew) {
            return {
                success: true,
                fileName: result.fileName,
                isNew: false,
                message: 'No changes detected. Using existing backup.'
            };
        }

        revalidatePath('/super-admin');
        return { success: true, fileName: result.fileName, isNew: true, message: 'Course backup created successfully' };
    } catch (error: any) {
        console.error('[Backup Course Action] Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * DEPRECATED: Lesson backups removed - all backups are now course-level
 * To restore individual lessons, restore the entire course backup
 */
export async function performLessonBackupAction(lessonId: string) {
    throw new Error('Lesson backups have been deprecated. Please use course-level backups instead.');
}

export async function listBackupsAction(type: 'course' | 'lesson' = 'course') {
    const session = await verifySession();
    if (session?.role !== 'super_admin') throw new Error('Unauthorized');

    if (!isCloudflareConfigured || !s3Client) return [];

    try {
        // Only list course backups - lesson backups are deprecated
        if (type === 'lesson') {
            console.warn('[Backup Action] Lesson backups are deprecated. Returning course backups instead.');
            // Return empty array for lesson backups to show "no backups" message
            return [];
        }

        const prefix = 'backups/courses/';
        const command = new ListObjectsV2Command({
            Bucket: serverEnv.CLOUDFLARE_BUCKET_NAME,
            Prefix: prefix,
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

export async function performInstantSaveAction() {
    const session = await verifySession();
    if (session?.role !== 'super_admin') throw new Error('Unauthorized');

    try {
        const backup = await performInstantSave();
        return { 
            success: true, 
            count: backup.count, 
            fileName: backup.fileName,
            message: backup.message
        };
    } catch (error: any) {
        console.error('[Instant Save Action] Error:', error);
        return { success: false, error: error.message };
    }
}

export async function checkForRestorePointAction() {
    const session = await verifySession();
    if (session?.role !== 'super_admin') return { hasRestorePoint: false };

    try {
        const backups = await listBackupsAction('course');
        const instantBackup = backups.find(b => b.key.includes('/courses/instant_save_'));
        
        if (instantBackup) {
            const now = new Date();
            const backupTime = new Date(instantBackup.lastModified!);
            // If backup is less than 30 minutes old
            const isRecent = (now.getTime() - backupTime.getTime()) < 30 * 60 * 1000;
            
            return { 
                hasRestorePoint: isRecent, 
                key: instantBackup.key,
                timestamp: instantBackup.lastModified,
                fileName: instantBackup.key
            };
        }
    } catch (e) {
        return { hasRestorePoint: false };
    }
    
    return { hasRestorePoint: false };
}

export async function deleteRestorePointAction(key: string) {
    const session = await verifySession();
    if (session?.role !== 'super_admin') throw new Error('Unauthorized');

    if (!isCloudflareConfigured || !s3Client) return { success: false };

    try {
        const command = new DeleteObjectCommand({
            Bucket: serverEnv.CLOUDFLARE_BUCKET_NAME,
            Key: key,
        });
        await s3Client.send(command);
        return { success: true };
    } catch (error) {
        console.error('[Delete Restore Point] Error:', error);
        return { success: false };
    }
}

export async function restoreFromBackupAction(fileName: string) {
    const session = await verifySession();
    if (session?.role !== 'super_admin') throw new Error('Unauthorized');

    try {
        const backupData = await downloadBackupFromR2(fileName);
        let result;
        if (fileName.includes('/courses/')) {
            result = await restoreBackup(backupData, session.userId);

            // Invalidate student dashboard caches after restore
            try {
                const { invalidateAllStudentDashboardCaches } = await import('@/modules/student/actions/course-actions');
                const cacheResult = await invalidateAllStudentDashboardCaches();
                console.log('[Backup Action] Cache invalidation:', cacheResult);
            } catch (cacheErr) {
                console.warn('[Backup Action] Cache invalidation warning:', cacheErr);
            }
        } else if (fileName.includes('/lessons/')) {
            throw new Error("Generic lesson restore not implemented. Use specific course target.");
        }
        revalidatePath('/super-admin');
        return { success: true, result };
    } catch (error: any) {
        console.error('[Backup Action] Restore Error:', error);
        return { success: false, error: error.message };
    }
}

export async function restoreLessonFromBackupAction(fileName: string, targetCourseId: string) {
    const session = await verifySession();
    if (session?.role !== 'super_admin') throw new Error('Unauthorized');

    try {
        const backupData = await downloadBackupFromR2(fileName);
        const result = await restoreLessonBackup(backupData, targetCourseId);

        // Invalidate student dashboard caches after restore
        try {
            const { invalidateAllStudentDashboardCaches } = await import('@/modules/student/actions/course-actions');
            const cacheResult = await invalidateAllStudentDashboardCaches();
            console.log('[Backup Action] Lesson restore cache invalidation:', cacheResult);
        } catch (cacheErr) {
            console.warn('[Backup Action] Lesson restore cache invalidation warning:', cacheErr);
        }

        revalidatePath('/super-admin');
        return { success: true, result };
    } catch (error: any) {
        console.error('[Backup Action] Lesson Restore Error:', error);
        return { success: false, error: error.message };
    }
}
