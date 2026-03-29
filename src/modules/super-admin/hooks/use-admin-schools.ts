'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
    fetchAdminStudents,
    fetchAdminSchools,
    toggleSchoolStatus as toggleSchoolStatusAction,
    saveSchoolAdmin,
    assignPlanToSchool,
} from '../actions';
import { SchoolInfo, UserMetric } from '../types';

export const USER_METRICS_PAGE_SIZE = 25;

export function useAdminSchools() {
    const [schoolsList, setSchoolsList] = useState<SchoolInfo[]>([]);
    const [userMetrics, setUserMetrics] = useState<UserMetric[]>([]);
    const [schoolsPage, setSchoolsPage] = useState(0);
    const [totalSchoolsPages, setTotalSchoolsPages] = useState(0);
    const [userMetricsPage, setUserMetricsPage] = useState(0);
    const [totalStudentsCount, setTotalStudentsCount] = useState(0);
    const [totalStudentPages, setTotalStudentPages] = useState(0);
    const [studentsLoading, setStudentsLoading] = useState(false);

    // Dialog state
    const [showSchoolDialog, setShowSchoolDialog] = useState(false);
    const [editingSchoolItem, setEditingSchoolItem] = useState<Partial<SchoolInfo> | null>(null);

    async function loadStudents(page = 0, search?: string) {
        setStudentsLoading(true);
        try {
            const data = await fetchAdminStudents(page, USER_METRICS_PAGE_SIZE, search);
            setUserMetrics(data.students.map((s: any) => ({
                id: s.id, full_name: s.full_name,
                email: s.email || '', school_name: s.school_name ?? 'Unknown',
                total_xp: s.total_xp, level: s.level,
                current_streak: s.current_streak || 0,
                longest_streak: s.longest_streak || 0,
                lessons_completed: s.lessons_completed ?? 0,
                last_activity: s.last_active_at ? new Date(s.last_active_at).toISOString() : null,
            })));
            setTotalStudentsCount(data.total);
            setTotalStudentPages(data.pages);
        } catch (err: any) {
            if (err?.message === 'UNAUTHORIZED') { window.location.href = '/admin-portal/login'; return; }
            toast.error('Failed to load students');
        }
        finally { setStudentsLoading(false); }
    }

    async function loadSchools(page = 0, search?: string) {
        try {
            const res = await fetchAdminSchools(page, 50, search);
            setSchoolsList(res.data as any);
            setSchoolsPage(page);
            setTotalSchoolsPages(res.pages);
        } catch (err: any) {
            if (err?.message === 'UNAUTHORIZED') { window.location.href = '/admin-portal/login'; return; }
            toast.error('Failed to load schools');
        }
    }

    async function toggleSchoolStatus(schoolId: string, isActive: boolean) {
        try {
            await toggleSchoolStatusAction(schoolId, isActive);
            toast.success(`School ${isActive ? 'activated' : 'deactivated'}`);
            // Optimistic update — no full reload needed
            setSchoolsList(prev => prev.map(s =>
                s.id === schoolId ? { ...s, is_active: isActive } : s
            ));
        } catch { toast.error('Failed to update school status'); }
    }

    async function assignPlan(schoolId: string, planId: string, billingMonths = 12) {
        try {
            await assignPlanToSchool(schoolId, planId, billingMonths);
            toast.success('Plan assigned successfully');
            await loadSchools(schoolsPage); // only reload schools
        } catch { toast.error('Failed to assign plan'); }
    }

    async function saveSchool(schoolData: Partial<SchoolInfo>) {
        if (!schoolData.name || !schoolData.email) {
            toast.error('Name and Email are required'); return;
        }
        try {
            await saveSchoolAdmin(schoolData);
            toast.success(schoolData.id ? 'Institution updated' : 'Institution created');
            setShowSchoolDialog(false);
            setEditingSchoolItem(null);
            await loadSchools(schoolsPage);
        } catch (err: any) {
            if (err?.message === 'UNAUTHORIZED') { window.location.href = '/admin-portal/login'; return; }
            toast.error(err?.message || 'Failed to save institution');
        }
    }

    return {
        schoolsList, userMetrics,
        schoolsPage, setSchoolsPage, totalSchoolsPages,
        userMetricsPage, setUserMetricsPage,
        totalStudentsCount, totalStudentPages, studentsLoading,
        showSchoolDialog, setShowSchoolDialog, editingSchoolItem, setEditingSchoolItem,
        loadStudents, loadSchools, toggleSchoolStatus, assignPlan, saveSchool,
    };
}
