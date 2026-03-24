'use client';

import React from 'react';
import { useSchoolContext } from '@/modules/school-admin/providers/school-data-provider';
import { SchoolOverviewTab } from '@/modules/school-admin/components/tabs/school-overview-tab';

export default function SchoolAdminPage() {
    const { stats, leaderboard, courseMetrics, loading } = useSchoolContext();

    if (loading) {
        return (
            <div className="py-20 flex items-center justify-center">
                <p className="text-slate-500 font-bold animate-pulse">Loading overview data...</p>
            </div>
        );
    }

    return (
        <SchoolOverviewTab 
            stats={stats} 
            leaderboard={leaderboard} 
            courseMetrics={courseMetrics} 
        />
    );
}
