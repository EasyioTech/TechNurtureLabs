'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
    getSchoolStats, getSchoolStudents, getSchoolCourseAnalytics,
    getSchoolLeaderboard, toggleStudentStatus
} from '../actions';
import { SchoolStats, SchoolStudentMetric, SchoolCourseMetric, SchoolLeaderboardEntry } from '../types';

export const SCHOOL_STUDENT_PAGE_SIZE = 25;

export function useSchoolData(schoolId: string) {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<SchoolStats>({
        totalStudents: 0, activeStudents: 0, avgXp: 0, totalXp: 0,
        enrolledCourses: 0, totalLessonsCompleted: 0, totalQuizzesTaken: 0,
        avgCompletionRate: 0, planName: null, subscriptionStatus: null, planExpiry: null,
    });
    const [students, setStudents] = useState<SchoolStudentMetric[]>([]);
    const [courseMetrics, setCourseMetrics] = useState<SchoolCourseMetric[]>([]);
    const [leaderboard, setLeaderboard] = useState<SchoolLeaderboardEntry[]>([]);
    const [studentsPage, setStudentsPage] = useState(0);
    const [studentSearch, setStudentSearch] = useState('');

    const fetchAll = useCallback(async () => {
        if (!schoolId) return;
        setLoading(true);
        try {
            const [statsData, studentsData, metricsData, boardData] = await Promise.all([
                getSchoolStats(schoolId),
                getSchoolStudents(schoolId),
                getSchoolCourseAnalytics(schoolId),
                getSchoolLeaderboard(schoolId, 10),
            ]);
            setStats(statsData as SchoolStats);
            setStudents(studentsData as SchoolStudentMetric[]);
            setCourseMetrics(metricsData as SchoolCourseMetric[]);
            setLeaderboard(boardData as SchoolLeaderboardEntry[]);
            setStudentsPage(0);
        } catch (err) {
            console.error('School data fetch error:', err);
            toast.error('Failed to load school data');
        } finally {
            setLoading(false);
        }
    }, [schoolId]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    async function toggleStudent(userId: string, isActive: boolean) {
        try {
            await toggleStudentStatus(userId, isActive);
            setStudents(prev => prev.map(s => s.id === userId ? { ...s, is_active: isActive } : s));
            toast.success(isActive ? 'Student activated' : 'Student deactivated');
        } catch { toast.error('Failed to update student status'); }
    }

    const filteredStudents = studentSearch
        ? students.filter(s =>
            s.full_name.toLowerCase().includes(studentSearch.toLowerCase()) ||
            s.email.toLowerCase().includes(studentSearch.toLowerCase()) ||
            (s.grade_name || '').toLowerCase().includes(studentSearch.toLowerCase())
        )
        : students;

    const pagedStudents = filteredStudents.slice(studentsPage * SCHOOL_STUDENT_PAGE_SIZE, (studentsPage + 1) * SCHOOL_STUDENT_PAGE_SIZE);
    const totalStudentPages = Math.ceil(filteredStudents.length / SCHOOL_STUDENT_PAGE_SIZE);

    return {
        loading, stats, students, courseMetrics, leaderboard,
        studentsPage, setStudentsPage, studentSearch, setStudentSearch,
        filteredStudents, pagedStudents, totalStudentPages,
        toggleStudent, refreshData: fetchAll,
    };
}
