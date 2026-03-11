'use client';

import React from 'react';
import { GraduationCap } from 'lucide-react';

interface DashboardLoaderProps {
    message?: string;
}

export function StudentDashboardLoader({ message = 'Initializing Portal' }: DashboardLoaderProps) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-8 font-sans">
            <div className="relative w-32 h-32">
                <div className="absolute inset-0 border-[6px] border-slate-100 rounded-full" />
                <div className="absolute inset-0 border-[6px] border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <GraduationCap size={40} className="text-slate-900" />
                </div>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 animate-pulse">{message}</p>
        </div>
    );
}
