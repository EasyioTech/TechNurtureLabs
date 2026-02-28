'use client';

import React from 'react';

interface ActivityRowProps {
    action: string;
    user: string;
    time: string;
    icon: any;
    color: string;
}

export function ActivityRow({ action, user, time, icon: Icon, color }: ActivityRowProps) {
    const colors: Record<string, string> = {
        emerald: 'bg-emerald-100 text-emerald-600',
        amber: 'bg-amber-100 text-amber-600',
        violet: 'bg-violet-100 text-violet-600',
        orange: 'bg-orange-100 text-orange-600',
        sky: 'bg-sky-100 text-sky-600',
    };

    return (
        <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colors[color] || colors.sky}`}>
                <Icon size={18} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700">{action}</p>
                <p className="text-xs text-slate-500">{user}</p>
            </div>
            <span className="text-xs text-slate-400 whitespace-nowrap">{time}</span>
        </div>
    );
}
