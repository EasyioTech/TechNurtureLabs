'use client';

import React from 'react';
import { useSchoolContext } from '@/modules/school-admin/providers/school-data-provider';
import { SchoolSettingsTab } from '@/modules/school-admin/components/tabs/school-settings-tab';
import { Loader2 } from 'lucide-react';

export default function SettingsPage() {
    const { 
        schoolId, stats, classesData, globalClasses, refreshData, setIsProfileModalOpen, loading 
    } = useSchoolContext();

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 gap-6">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="text-indigo-500/40" size={24} />
                    </div>
                </div>
                <div className="text-center">
                    <p className="text-sm font-black uppercase tracking-widest text-slate-500 animate-pulse">Synchronizing Settings</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-1">Preparing your institution dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <SchoolSettingsTab 
            stats={stats}
            schoolId={schoolId} 
            classesData={classesData}
            globalClasses={globalClasses}
            onRefresh={refreshData}
            onOpenSchoolProfile={() => setIsProfileModalOpen(true)}
        />
    );
}
