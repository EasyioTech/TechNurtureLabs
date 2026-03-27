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

    useEffect(() => {
        const saved = localStorage.getItem('student-sidebar-collapsed');
        if (saved === 'true') setIsSidebarCollapsed(true);

        const handleToggle = (e: any) => setIsSidebarCollapsed(e.detail);
        window.addEventListener('sidebar-toggle', handleToggle);
        return () => window.removeEventListener('sidebar-toggle', handleToggle);
    }, []);

    return (
        <div 
            onContextMenu={(e) => e.preventDefault()}
            className="flex min-h-screen bg-slate-50 overflow-x-hidden select-none"
        >
            {!isLessonPage && sidebar}
            {/*
              * transition-[padding-left] instead of transition-all — only the padding
              * property participates in the transition, preventing layout recalculations
              * on every unrelated style change (color, opacity, etc.).
              */}
            <div className={cn(
                "flex-1 flex flex-col min-w-0 transition-[padding-left] duration-300 ease-out pb-20 lg:pb-0",
                !isLessonPage
                    ? (isSidebarCollapsed ? "lg:pl-24" : "lg:pl-64")
                    : "w-full"
            )}>
                {/*
                  * key={pathname} causes React to unmount/remount the div on every
                  * route change, which re-triggers the animate-in CSS animation.
                  * No Framer Motion needed — one GPU-composited opacity animation
                  * instead of a JS-driven layout recalculation on every navigation.
                  */}
                <div key={pathname} className="flex-1 flex flex-col animate-in fade-in duration-300">
                    {!isLessonPage && (
                        <div className="lg:hidden">
                            <StudentHeader
                                profile={profile}
                                school={school}
                                stats={stats || { xp: 0, streak: 0, level: 1 }}
                                settings={settings}
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
