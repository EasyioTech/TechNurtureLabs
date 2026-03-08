'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function StudentLayoutShell({
    sidebar,
    children
}: {
    sidebar: React.ReactNode;
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const isLessonPage = pathname?.includes('/student/lesson/');

    return (
        <div className="flex min-h-screen bg-slate-50 overflow-x-hidden">
            {!isLessonPage && sidebar}
            <div className={cn(
                "flex-1 flex flex-col min-w-0 transition-all duration-500",
                !isLessonPage ? "lg:pl-64" : "w-full"
            )}>
                {children}
            </div>
        </div>
    );
}
