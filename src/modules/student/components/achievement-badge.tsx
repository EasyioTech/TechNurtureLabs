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
        <div className={`flex-shrink-0 w-28 sm:w-32 text-center ${locked ? 'opacity-40' : ''}`}>
            <div className={`w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-2 rounded-xl flex items-center justify-center ${unlocked ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-300'
                }`}>
                <Trophy size={24} />
            </div>
            <p className={`text-xs font-medium truncate ${unlocked ? 'text-slate-800' : 'text-slate-400'}`}>
                {title}
            </p>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">{description}</p>
        </div>
    );
}
