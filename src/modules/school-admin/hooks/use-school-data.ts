import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
    getSchoolStats, getSchoolStudentsPaginated, getSchoolCourseAnalytics,
    getSchoolLeaderboard, toggleStudentStatus, getGlobalClasses, fetchSchoolClasses,
    getPendingStudents, verifyStudentAction, getSchoolPinRequests, resolvePinRequest
} from '../actions';
import { SchoolStats, SchoolStudentMetric, SchoolCourseMetric, SchoolLeaderboardEntry } from '../types';

export const SCHOOL_STUDENT_PAGE_SIZE = 10;

export function useSchoolData(schoolId: string) {
    const [loading, setLoading] = useState(true);
    const [studentsLoading, setStudentsLoading] = useState(false);
    const [pendingLoading, setPendingLoading] = useState(false);
    const [pinLoading, setPinLoading] = useState(false);
    
    const [stats, setStats] = useState<SchoolStats>({
        totalStudents: 0, activeStudents: 0, avgXp: 0, totalXp: 0,
        enrolledCourses: 0, totalLessonsCompleted: 0, totalQuizzesTaken: 0,
        avgCompletionRate: 0, pendingStudents: 0, planName: null, subscriptionStatus: null, planExpiry: null,
    });
    
    const [pagedStudents, setPagedStudents] = useState<SchoolStudentMetric[]>([]);
    const [pendingStudents, setPendingStudents] = useState<SchoolStudentMetric[]>([]);
    const [pinRequests, setPinRequests] = useState<any[]>([]);
    const [totalStudentPages, setTotalStudentPages] = useState(0);
    const [totalStudentsCount, setTotalStudentsCount] = useState(0);
    
    const [courseMetrics, setCourseMetrics] = useState<SchoolCourseMetric[]>([]);
    const [leaderboard, setLeaderboard] = useState<SchoolLeaderboardEntry[]>([]);
    const [classesData, setClassesData] = useState<{ id: string; name: string }[]>([]);
    const [globalClasses, setGlobalClasses] = useState<{ id: string; name: string; level: number }[]>([]);
    
    const [studentsPage, setStudentsPage] = useState(0);
    const [studentSearch, setStudentSearch] = useState('');

    const loadCoreData = useCallback(async () => {
        if (!schoolId) return;
        setLoading(true);
        try {
            const [statsData, metricsData, boardData, allGlobalClasses, schoolClassIds] = await Promise.all([
                getSchoolStats(schoolId),
                getSchoolCourseAnalytics(schoolId),
                getSchoolLeaderboard(schoolId, 10),
                getGlobalClasses(),
                fetchSchoolClasses(schoolId),
            ]);

            setStats(statsData as SchoolStats);
            setCourseMetrics(metricsData as SchoolCourseMetric[]);
            setLeaderboard(boardData as SchoolLeaderboardEntry[]);
            setGlobalClasses(allGlobalClasses as any);

            const schoolClasses = (allGlobalClasses as any[]).filter(gc => schoolClassIds.includes(gc.id));
            setClassesData(schoolClasses);
        } catch (err) {
            console.error('Core school data error:', err);
            toast.error('Failed to load core school data');
        } finally {
            setLoading(false);
        }
    }, [schoolId]);

    const loadStudents = useCallback(async () => {
        if (!schoolId) return;
        setStudentsLoading(true);
        try {
            const data = await getSchoolStudentsPaginated(
                schoolId, 
                studentsPage + 1, 
                SCHOOL_STUDENT_PAGE_SIZE, 
                studentSearch
            );
            setPagedStudents(data.students as any);
            setTotalStudentPages(data.pages);
            setTotalStudentsCount(data.total);
        } catch (err) {
            console.error('Students fetch error:', err);
        } finally {
            setStudentsLoading(false);
        }
    }, [schoolId, studentsPage, studentSearch]);

    const loadPending = useCallback(async () => {
        if (!schoolId) return;
        setPendingLoading(true);
        try {
            const data = await getPendingStudents(schoolId);
            setPendingStudents(data as any);
        } catch (err) {
            console.error('Pending students fetch error:', err);
        } finally {
            setPendingLoading(false);
        }
    }, [schoolId]);

    const loadPinRequests = useCallback(async () => {
        if (!schoolId) return;
        setPinLoading(true);
        try {
            const data = await getSchoolPinRequests(schoolId);
            if (data.success) {
                setPinRequests(data.requests as any);
            }
        } catch (err) {
            console.error('PIN requests fetch error:', err);
        } finally {
            setPinLoading(false);
        }
    }, [schoolId]);

    useEffect(() => { loadCoreData(); }, [loadCoreData]);
    useEffect(() => { loadStudents(); }, [loadStudents]);
    useEffect(() => { loadPending(); }, [loadPending]);
    useEffect(() => { loadPinRequests(); }, [loadPinRequests]);

    async function toggleStudent(userId: string, isActive: boolean) {
        try {
            await toggleStudentStatus(userId, isActive);
            setPagedStudents(prev => prev.map(s => s.id === userId ? { ...s, is_active: isActive } : s));
            toast.success(isActive ? 'Student activated' : 'Student deactivated');
        } catch { toast.error('Failed to update student status'); }
    }

    async function verifyStudent(userId: string, isVerified: boolean) {
        try {
            await verifyStudentAction(userId, isVerified);
            if (isVerified) {
                toast.success('Student verified successfully');
                // Move from pending to paged if we're on the first page and it matches search
                // But simpler to just refresh all
                loadPending();
                loadStudents();
                loadCoreData();
            } else {
                toast.success('Student verification rejected');
                loadPending();
                loadCoreData();
            }
        } catch { toast.error('Failed to verify student'); }
    }

    return {
        loading, 
        studentsLoading,
        pendingLoading,
        stats, 
        courseMetrics, 
        leaderboard,
        classesData, 
        globalClasses,
        studentsPage, 
        setStudentsPage, 
        studentSearch, 
        setStudentSearch,
        pagedStudents, 
        pendingStudents,
        pinLoading,
        pinRequests,
        totalStudentPages,
        totalStudentsCount,
        toggleStudent, 
        verifyStudent,
        handlePinReset: async (requestId: string, action: 'approved' | 'rejected', newPin?: string) => {
            try {
                const res = await resolvePinRequest(requestId, action, newPin);
                if (res.success) {
                    toast.success(action === 'approved' ? 'PIN updated successfully.' : 'Request rejected.');
                    loadPinRequests();
                } else { toast.error(res.error || 'Failed to process request'); }
            } catch { toast.error('Connection error.'); }
        },
        refreshData: () => { loadCoreData(); loadStudents(); loadPending(); loadPinRequests(); },
    };
}
