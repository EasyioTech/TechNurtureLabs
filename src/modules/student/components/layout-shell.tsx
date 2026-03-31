'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

import { StudentBottomNav } from './bottom-nav';
import { StudentHeader } from './header';

export function StudentLayoutShell({
    sidebar,
    children,
    profile,
    school,
    stats,
    settings
}: {
    sidebar: React.ReactNode;
    children: React.ReactNode;
    profile?: any;
    school?: any;
    stats?: any;
    settings?: any;
}) {
    const pathname = usePathname();
    const isLessonPage = pathname?.includes('/student/lesson/');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const saved = localStorage.getItem('student-sidebar-collapsed');
        if (saved === 'true') setIsSidebarCollapsed(true);

        const handleToggle = (e: any) => setIsSidebarCollapsed(e.detail);
        const handleSearchSync = (e: any) => setSearchQuery(e.detail);

        window.addEventListener('sidebar-toggle', handleToggle);
        window.addEventListener('search-sync', handleSearchSync);

        return () => {
            window.removeEventListener('sidebar-toggle', handleToggle);
            window.removeEventListener('search-sync', handleSearchSync);
        };
    }, []);

    const updateSearch = (q: string) => {
        setSearchQuery(q);
        window.dispatchEvent(new CustomEvent('search-sync', { detail: q }));
    };

    return (
        <div 
            onContextMenu={(e) => e.preventDefault()}
            className="flex min-h-screen bg-slate-50 overflow-x-hidden select-none"
        >
            {!isLessonPage && sidebar}
            <div className={cn(
                "flex-1 flex flex-col min-w-0 transition-[padding-left] duration-300 ease-out pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-0",
                !isLessonPage
                    ? (isSidebarCollapsed ? "lg:pl-24" : "lg:pl-64")
                    : "w-full"
            )}>
                <div key={pathname} className="flex-1 flex flex-col animate-in fade-in duration-300">
                    {!isLessonPage && (
                        <div className="lg:hidden">
                            <StudentHeader
                                profile={profile}
                                school={school}
                                stats={stats || { xp: 0, streak: 0, level: 1 }}
                                settings={settings}
                                searchQuery={searchQuery}
                                setSearchQuery={updateSearch}
                            />
                        </div>
                    )}
                    {children}
                </div>
            </div>
            {!isLessonPage && <StudentBottomNav />}
        </div>
    );
}
