'use server';

import { db } from '@/lib/db';
import { students, studentAcademicRecords } from '@/db/schema';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { verifySession } from '@/lib/auth';

export async function getStudentLeaderboard(scope: 'school' | 'class') {
    const session = await verifySession();
    if (!session) throw new Error('Unauthorized');
    const userId = session.userId;

    const currentUser = await db.query.students.findFirst({
        where: eq(students.id, userId),
        with: {
            academicRecords: {
                with: { academicClass: true },
                limit: 1,
            }
        }
    });

    if (!currentUser) throw new Error('User not found');

    const schoolId = currentUser.school_id;
    if (!schoolId) {
        const allStudents = await db.query.students.findMany({
            orderBy: [desc(students.cumulative_xp)],
            limit: 50
        });
        return { scope: 'global', data: serializeLeaderboard(allStudents, userId), title: 'Global' };
    }

    if (scope === 'school') {
        const schoolStudents = await db.query.students.findMany({
            where: eq(students.school_id, schoolId),
            orderBy: [desc(students.cumulative_xp)],
            limit: 50
        });
        return { scope: 'school', data: serializeLeaderboard(schoolStudents, userId), title: 'School Rank' };
    }

    if (scope === 'class') {
        const currentRecord = currentUser.academicRecords?.[0];
        if (!currentRecord?.class_id) {
            const schoolStudents = await db.query.students.findMany({
                where: eq(students.school_id, schoolId),
                orderBy: [desc(students.cumulative_xp)],
                limit: 50
            });
            return { scope: 'school', data: serializeLeaderboard(schoolStudents, userId), title: 'School Rank (Class unset)' };
        }

        const classRecords = await db.query.studentAcademicRecords.findMany({
            where: eq(studentAcademicRecords.class_id, currentRecord.class_id),
        });

        const classUserIds = classRecords.map(r => r.user_id);

        if (classUserIds.length === 0) {
            return { scope: 'class', data: [], title: currentRecord.academicClass?.name || 'Class Rank' };
        }

        const classStudents = await db.query.students.findMany({
            where: inArray(students.id, classUserIds),
            orderBy: [desc(students.cumulative_xp)],
            limit: 50
        });

        const sorted = classStudents.sort((a: any, b: any) => (Number(b.cumulative_xp) || 0) - (Number(a.cumulative_xp) || 0));

        return { scope: 'class', data: serializeLeaderboard(sorted, userId), title: currentRecord.academicClass?.name || 'Class Rank' };
    }

    return { scope: 'unknown', data: [], title: 'Unknown' };
}

function serializeLeaderboard(usersList: any[], currentUserId: string) {
    return usersList.map((u, i) => ({
        rank: i + 1,
        id: u.id,
        first_name: u.first_name,
        last_name: u.last_name,
        full_name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'Student',
        initials: (u.first_name?.[0] || 'S') + (u.last_name?.[0] || ''),
        xp: Number(u.cumulative_xp) || 0,
        level: Math.floor((Number(u.cumulative_xp) || 0) / 1000) + 1,
        isCurrentUser: u.id === currentUserId
    }));
}
