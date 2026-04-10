'use server';

import { db } from '@/lib/db';
import { students, studentAcademicRecords, schoolClassMapping, courseProgress, auditLogs, schoolSubscriptions, userSessions, classes } from '@/db/schema';
import { eq, and, sql, or, count, isNull, desc, inArray, isNotNull, gt } from 'drizzle-orm';
import { verifySession } from '@/lib/auth';
import { verifySchoolAdminContext, verifyStudentContext } from './shared';
import { calculateTrueStreak } from '../utils/streak';

import { calculateLevel } from '@/lib/gamification';
import { cacheService } from '@/lib/cache';
import { invalidateSchoolCache } from './profile-actions';
import { redirect } from 'next/navigation';
import { redis } from '@/lib/redis';
import { requireAnySchoolAdmin } from '@/lib/admin-guard';
import { createAuditLog } from '@/lib/audit';

export async function getSchoolStudentDetails(userId: string) {
    await verifyStudentContext(userId);
    const student = await db.query.students.findFirst({
        where: and(eq(students.id, userId), isNull(students.deleted_at)),
        with: {
            academicRecords: {
                with: { academicClass: true },
                orderBy: [desc(studentAcademicRecords.created_at)]
            },
            courseProgress: {
                with: { course: true },
                orderBy: [desc(courseProgress.updated_at)]
            }
        }
    });

    if (!student) return null;

    const xp = Number(student.cumulative_xp) || 0;
    const levelData = calculateLevel(xp);

    return {
        ...student,
        full_name: `${student.first_name} ${student.last_name}`,
        total_xp: xp,
        level: levelData.level,
        levelProgress: levelData.progress,
        current_streak: calculateTrueStreak(student),
        academicRecords: student.academicRecords.map((r) => ({
            ...r,
            class_name: r.academicClass?.name || 'N/A'
        })),
    };
}

export async function getSchoolStudentsPaginated(schoolId: string, page: number = 1, limit: number = 10, search: string = '') {
    await verifySchoolAdminContext(schoolId);
    const offset = (page - 1) * limit;

    const whereClause = and(
        eq(students.school_id, schoolId),
        isNull(students.deleted_at),
        eq(students.is_verified, true),
        search ? or(
            sql`${students.first_name} ILIKE ${'%' + search + '%'}`,
            sql`${students.last_name} ILIKE ${'%' + search + '%'}`,
            sql`${students.email} ILIKE ${'%' + search + '%'}`,
            sql`${students.phone} ILIKE ${'%' + search + '%'}`
        ) : undefined
    );

    const [studentsData, totalCount] = await Promise.all([
        db.query.students.findMany({
            where: whereClause,
            limit,
            offset,
            orderBy: [desc(students.cumulative_xp)],
            with: {
                academicRecords: {
                    with: { academicClass: true },
                    limit: 1
                }
            }
        }),
        db.select({ count: count() }).from(students).where(whereClause)
    ]);

    return {
        students: studentsData.map(s => {
            const xp = Number(s.cumulative_xp) || 0;
            const levelData = calculateLevel(xp);
            return {
                ...s,
                full_name: `${s.first_name} ${s.last_name}`,
                total_xp: xp,
                level: levelData.level,
                levelProgress: levelData.progress,
                class_name: (s.academicRecords?.[0] as any)?.academicClass?.name || 'N/A'
            };
        }),
        total: totalCount[0].count,
        pages: Math.ceil(totalCount[0].count / limit)
    };
}

export async function getPendingStudents(schoolId: string) {
    await verifySchoolAdminContext(schoolId);
    
    const studentsData = await db.query.students.findMany({
        where: and(
            eq(students.school_id, schoolId),
            isNull(students.deleted_at),
            eq(students.is_verified, false)
        ),
        orderBy: [desc(students.created_at)],
        with: {
            academicRecords: {
                with: { academicClass: true },
                limit: 1
            }
        }
    });

    return studentsData.map(s => ({
        ...s,
        full_name: `${s.first_name} ${s.last_name}`,
        class_name: (s.academicRecords?.[0] as any)?.academicClass?.name || 'N/A'
    }));
}

export async function verifyStudentAction(userId: string, isVerified: boolean) {
    try {
        const session = await verifySession();
        if (!session) {
            redirect('/school-portal/login');
        }
        await verifyStudentContext(userId);

        const student = await db.query.students.findFirst({ where: eq(students.id, userId) });
        if (!student) throw new Error('Student not found');

        if (isVerified) {
            const subscription = await db.query.schoolSubscriptions.findFirst({
                where: and(
                    eq(schoolSubscriptions.school_id, student.school_id!),
                    eq(schoolSubscriptions.status, 'active')
                ),
                with: { plan: true }
            });

            if (subscription && subscription.plan && subscription.plan.max_students !== null) {
                const maxStudents = subscription.plan.max_students;
                const verifiedCountRes = await db.select({
                    count: count()
                }).from(students).where(
                    and(
                        eq(students.school_id, student.school_id!),
                        eq(students.is_verified, true),
                        isNull(students.deleted_at)
                    )
                );

                const currentVerifiedCount = verifiedCountRes[0]?.count || 0;

                if (currentVerifiedCount >= maxStudents) {
                    throw new Error(
                        `Your school has reached its student limit of ${maxStudents} for the current plan. ` +
                        `To verify more students, please upgrade your subscription plan.`
                    );
                }
            }

            await db.update(students)
                .set({ is_verified: true, updated_at: new Date() })
                .where(eq(students.id, userId));

            await createAuditLog({
                userId: session.userId,
                userType: session.userType,
                schoolId: student.school_id!,
                action: 'approved',
                entityType: 'student',
                entityId: userId,
                oldValues: { is_verified: false },
                newValues: { is_verified: true },
                metadata: { field: 'is_verified' }
            });
        } else {
            await db.update(students)
                .set({
                    deleted_at: new Date(),
                    is_active: false,
                    updated_at: new Date()
                })
                .where(eq(students.id, userId));

            await createAuditLog({
                userId: session.userId,
                userType: session.userType,
                schoolId: student.school_id!,
                action: 'rejected',
                entityType: 'student',
                entityId: userId,
                metadata: { reason: 'verification_rejected' }
            });
        }

        try {
            await cacheService.invalidateTag(`user:${userId}:profile`);
            await cacheService.invalidateTag(`user:${userId}:dashboard`);
            await invalidateSchoolCache(student.school_id!);
        } catch (err) {}

        return { success: true };
    } catch (err: any) {
        if (err.digest?.startsWith('NEXT_REDIRECT')) throw err;
        console.error('[Verify Student Action Failure]:', err);
        return { 
            success: false, 
            error: err.message || 'Failed to process verification' 
        };
    }
}

export async function toggleStudentStatus(userId: string, isActive: boolean) {
    const session = await verifySession();
    if (!session) redirect('/school-portal/login');
    await verifyStudentContext(userId);
    const oldStudent = await db.query.students.findFirst({ where: eq(students.id, userId) });

    const [updated] = await db.update(students).set({ is_active: isActive }).where(eq(students.id, userId)).returning();

    if (oldStudent && session) {
        await createAuditLog({
            userId: session.userId,
            userType: session.userType,
            schoolId: oldStudent.school_id!,
            action: 'update',
            entityType: 'student',
            entityId: userId,
            oldValues: oldStudent,
            newValues: updated,
            metadata: { field: 'is_active' }
        });
        invalidateSchoolCache(oldStudent.school_id!);
    }
    return updated;
}

export async function deleteStudent(userId: string) {
    const session = await verifySession();
    if (!session) redirect('/school-portal/login');
    await verifyStudentContext(userId);
    const student = await db.query.students.findFirst({ where: eq(students.id, userId) });

    if (!student) throw new Error('Student not found');

    await db.transaction(async (tx) => {
        await tx.update(students)
            .set({
                deleted_at: new Date(),
                is_active: false,
                updated_at: new Date()
            })
            .where(eq(students.id, userId));

        await tx.update(userSessions)
            .set({ revoked_at: new Date() })
            .where(eq(userSessions.user_id, userId));

        const userSess = await tx.query.userSessions.findMany({ where: eq(userSessions.user_id, userId) });
        for (const s of userSess) {
            await redis.del(`session:${s.id}`);
        }

        if (session) {
            await createAuditLog({
                userId: session.userId,
                userType: session.userType,
                schoolId: student.school_id!,
                action: 'delete',
                entityType: 'student',
                entityId: userId,
                oldValues: student,
                metadata: {},
                tx
            });
        }
        invalidateSchoolCache(student.school_id!);
    });

    return { success: true };
}

export async function getGlobalClasses() {
    await requireAnySchoolAdmin();
    return await db.query.classes.findMany({
        orderBy: (classes, { asc }) => [asc(classes.level)]
    });
}
