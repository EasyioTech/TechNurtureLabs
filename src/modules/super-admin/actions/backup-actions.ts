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
        const fileName = await uploadBackupToR2(data, 'course');
        revalidatePath('/super-admin');
        return { success: true, fileName };
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
        const fileName = await uploadBackupToR2(data, 'course');
        revalidatePath('/super-admin');
        return { success: true, fileName };
    } catch (error: any) {
        console.error('[Backup Course Action] Error:', error);
        return { success: false, error: error.message };
    }
}

export async function performLessonBackupAction(lessonId: string) {
    const session = await verifySession();
    if (session?.role !== 'super_admin') throw new Error('Unauthorized');

    try {
        const data = await exportLesson(lessonId);
        const fileName = await uploadBackupToR2(data, 'lesson');
        return { success: true, fileName };
    } catch (error: any) {
        console.error('[Backup Lesson Action] Error:', error);
        return { success: false, error: error.message };
    }
}

export async function listBackupsAction(type: 'course' | 'lesson' = 'course') {
    const session = await verifySession();
    if (session?.role !== 'super_admin') throw new Error('Unauthorized');

    if (!isCloudflareConfigured || !s3Client) return [];

    try {
        const prefix = type === 'course' ? 'backups/courses/' : 'backups/lessons/';
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
        revalidatePath('/super-admin');
        return { success: true, result };
    } catch (error: any) {
        console.error('[Backup Action] Lesson Restore Error:', error);
        return { success: false, error: error.message };
    }
}
