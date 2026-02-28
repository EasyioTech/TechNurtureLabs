'use client';

import React from 'react';
import { Trophy } from 'lucide-react';

interface AchievementBadgeProps {
    title: string;
    description: string;
    unlocked?: boolean;
    locked?: boolean;
}

export function AchievementBadge({ title, description, unlocked, locked }: AchievementBadgeProps) {
    return (
        <div className={`flex-shrink-0 w-36 text-center p-4 rounded-2xl ${locked ? 'opacity-50' : 'bg-white border border-stone-200 shadow-sm'}`}>
            <div className={`w-16 h-16 mx-auto mb-3 rounded-2xl flex items-center justify-center shadow-md ${unlocked ? 'bg-amber-500' : 'bg-stone-200'
                }`}>
                <Trophy size={28} className={unlocked ? 'text-white' : 'text-slate-400'} />
            </div>
            <p className="text-sm font-bold text-slate-800 truncate">{title}</p>
            <p className="text-xs text-slate-500 truncate mt-0.5">{description}</p>
        </div>
    );
}
