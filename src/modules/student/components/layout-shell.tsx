'use client';

import React from 'react';
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

    return (
        <div className="flex min-h-screen bg-slate-50 overflow-x-hidden">
            {!isLessonPage && sidebar}
            <div className={cn(
                "flex-1 flex flex-col min-w-0 transition-all duration-500 pb-20 lg:pb-0",
                !isLessonPage ? "lg:pl-64" : "w-full"
            )}>
                {!isLessonPage && (
                    <div className="md:hidden">
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
            {!isLessonPage && <StudentBottomNav />}
        </div>
    );
}
