'use client';

import { SchoolInfo, Stats, PaymentPlan, SchoolClass } from '../../types';

// Modular Components
import { SchoolStats } from './schools/school-stats';
import { SchoolList } from './schools/school-list';
import { SchoolEditDialog } from './schools/school-edit-dialog';

interface SchoolsTabProps {
    stats: Stats;
    schoolsList: SchoolInfo[];
    paymentPlans?: PaymentPlan[];
    onToggleStatus: (schoolId: string, isActive: boolean) => void;
    onSaveSchool: (data: Partial<SchoolInfo>) => void;
    onAssignPlan?: (schoolId: string, planId: string) => void;
    showEditDialog: boolean;
    setShowEditDialog: (v: boolean) => void;
    editingSchool: Partial<SchoolInfo> | null;
    setEditingSchool: (s: Partial<SchoolInfo> | null) => void;
    searchQuery?: string;
    classes: SchoolClass[];

    onSync?: () => void;
    page?: number;
    setPage?: (p: number) => void;
    totalPages?: number;
    hasMore?: boolean;
    loadingMore?: boolean;
    onLoadMore?: () => void;
}

export function SchoolsTab({
    stats, schoolsList, paymentPlans = [], onToggleStatus, onSaveSchool, onAssignPlan,
    showEditDialog, setShowEditDialog, editingSchool, setEditingSchool, searchQuery = '',
    classes, onSync, page = 0, setPage, totalPages = 1,
    hasMore = false, loadingMore = false, onLoadMore
}: SchoolsTabProps) {

    function openEdit(school: SchoolInfo) { 
        setEditingSchool({ ...school }); 
        setShowEditDialog(true); 
    }

    function handleSave() { 
        if (editingSchool) { 
            onSaveSchool(editingSchool); 
        } 
    }

    function handleAssignPlan(schoolId: string, planId: string) {
        if (onAssignPlan) {
            onAssignPlan(schoolId, planId);
        }
    }

    const filteredSchools = searchQuery
        ? schoolsList.filter(s =>
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (s.city || '').toLowerCase().includes(searchQuery.toLowerCase())
        )
        : schoolsList;

    return (
        <div className="space-y-4">
            <SchoolStats stats={stats} />

            <SchoolList 
                schools={filteredSchools}
                paymentPlans={paymentPlans}
                onToggleStatus={onToggleStatus}
                onEdit={openEdit}
                onRegister={() => {
                    setEditingSchool({ is_active: true, classIds: [] });
                    setShowEditDialog(true);
                }}
                onAssignPlan={handleAssignPlan}
                page={page}
                searchQuery={searchQuery}
                hasMore={hasMore}
                loadingMore={loadingMore}
                onLoadMore={onLoadMore || (() => {})}
            />

            <SchoolEditDialog 
                open={showEditDialog}
                onOpenChange={setShowEditDialog}
                editingSchool={editingSchool}
                setEditingSchool={setEditingSchool}
                classes={classes}
                onSave={handleSave}
            />
        </div>
    );
}
