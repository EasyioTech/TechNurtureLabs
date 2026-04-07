'use server';

import { db } from '@/lib/db';
import { academicSessions, schoolClassMapping, classes, studentAcademicRecords } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifySchoolAdminContext } from './shared';
import { invalidateSchoolCache } from './profile-actions';
import { createAuditLog } from '@/lib/audit';
import { verifySession } from '@/lib/auth';

export async function fetchSchoolClasses(schoolId: string) {
    const mappings = await db.query.schoolClassMapping.findMany({
        where: and(
            eq(schoolClassMapping.school_id, schoolId),
            eq(schoolClassMapping.is_active, true)
        )
    });
    return mappings.map(m => m.class_id);
}

export async function updateSchoolClasses(schoolId: string, classIds: string[]) {
    await verifySchoolAdminContext(schoolId);

    return await db.transaction(async (tx) => {
        await tx.update(schoolClassMapping)
            .set({ is_active: false })
            .where(eq(schoolClassMapping.school_id, schoolId));

        if (classIds.length > 0) {
            for (const classId of classIds) {
                const existing = await tx.query.schoolClassMapping.findFirst({
                    where: and(
                        eq(schoolClassMapping.school_id, schoolId),
                        eq(schoolClassMapping.class_id, classId)
                    )
                });

                if (existing) {
                    await tx.update(schoolClassMapping)
                        .set({ is_active: true })
                        .where(eq(schoolClassMapping.id, existing.id));
                } else {
                    await tx.insert(schoolClassMapping)
                        .values({
                            school_id: schoolId,
                            class_id: classId,
                            is_active: true
                        } as any);
                }
            }
        }

        const session = await verifySession();
        if (session) {
            await createAuditLog({
                userId: session.userId,
                userType: session.userType,
                schoolId: schoolId,
                action: 'update',
                entityType: 'setting',
                entityId: schoolId,
                metadata: { action: 'update_school_classes', classIds },
                tx
            });
        }

        await invalidateSchoolCache(schoolId);
        return { success: true, message: 'School classes updated successfully' };
    });
}

export async function promoteStudentsAction(schoolId: string, newSessionName: string = 'Next Academic Year') {
    await verifySchoolAdminContext(schoolId);

    const currentSession = await db.query.academicSessions.findFirst({
        where: and(eq(academicSessions.school_id, schoolId), eq(academicSessions.is_current, true))
    });
    if (!currentSession) throw new Error('No active academic session found.');

    const allClasses = await db.query.classes.findMany();
    const classLevelMap = new Map(allClasses.map(c => [c.id, c.level]));
    const levelClassMap = new Map(allClasses.map(c => [c.level, c.id]));

    const schoolClassesMap = await db.query.schoolClassMapping.findMany({
        where: and(eq(schoolClassMapping.school_id, schoolId), eq(schoolClassMapping.is_active, true))
    });
    const schoolClassIds = new Set(schoolClassesMap.map(c => c.class_id));

    const records = await db.query.studentAcademicRecords.findMany({
        where: and(
            eq(studentAcademicRecords.school_id, schoolId),
            eq(studentAcademicRecords.session_id, currentSession.id),
            eq(studentAcademicRecords.is_promoted, false)
        )
    });

    if (records.length === 0) throw new Error('No eligible students for promotion.');

    await db.update(academicSessions)
        .set({ is_current: false })
        .where(eq(academicSessions.id, currentSession.id));

    const newSessionStartDate = new Date();
    const newSessionEndDate = new Date(newSessionStartDate);
    newSessionEndDate.setFullYear(newSessionEndDate.getFullYear() + 1);

    const [newSession] = await db.insert(academicSessions).values({
        school_id: schoolId,
        name: newSessionName,
        start_date: newSessionStartDate.toISOString(),
        end_date: newSessionEndDate.toISOString(),
        is_current: true,
    } as any).returning();

    const newRecords = [];
    for (const record of records) {
        await db.update(studentAcademicRecords)
            .set({ is_promoted: true, promoted_at: new Date() })
            .where(eq(studentAcademicRecords.id, record.id));

        const currentLevel = classLevelMap.get(record.class_id);
        if (currentLevel !== undefined) {
            const nextLevel = currentLevel + 1;
            const nextClassId = levelClassMap.get(nextLevel);

            if (nextClassId && schoolClassIds.has(nextClassId)) {
                newRecords.push({
                    user_id: record.user_id,
                    school_id: schoolId,
                    session_id: newSession.id,
                    class_id: nextClassId,
                    is_promoted: false,
                });
            }
        }
    }

    if (newRecords.length > 0) {
        await db.insert(studentAcademicRecords).values(newRecords as any);
    }

    const session = await verifySession();
    if (session) {
        await createAuditLog({
            userId: session.userId,
            userType: session.userType,
            schoolId: schoolId,
            action: 'update',
            entityType: 'user',
            entityId: schoolId,
            metadata: { 
                action: 'promote_students', 
                newSessionName, 
                studentCount: records.length 
            }
        });
    }

    await invalidateSchoolCache(schoolId);

    return { success: true, message: `Successfully ended session and processed ${records.length} students into the new '${newSessionName}' session.` };
}
