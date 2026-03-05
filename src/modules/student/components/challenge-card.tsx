'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface ChallengeCardProps {
    title: string;
    progress: number;
    total: number;
    reward: number;
    icon: any;
    unit?: string;
    color: string;
}

export function ChallengeCard({ title, progress, total, reward, icon: Icon, unit = '', color }: ChallengeCardProps) {
    const percentage = Math.min((progress / total) * 100, 100);
    const isComplete = progress >= total;

    const barColor: Record<string, string> = {
        emerald: 'bg-emerald-500',
        amber: 'bg-amber-500',
        sky: 'bg-sky-500',
        violet: 'bg-violet-500',
    };

    const iconBg: Record<string, string> = {
        emerald: 'bg-emerald-100 text-emerald-600',
        amber: 'bg-amber-100 text-amber-600',
        sky: 'bg-sky-100 text-sky-600',
        violet: 'bg-violet-100 text-violet-600',
    };

    return (
        <Card className={`bg-white border border-slate-200 shadow-sm ${isComplete ? 'border-emerald-200 bg-emerald-50/30' : ''}`}>
            <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg[color] || iconBg.emerald}`}>
                        <Icon size={18} />
                    </div>
                    <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                        +{reward} XP
                    </span>
                </div>

                <h4 className="font-semibold text-slate-800 mb-3 leading-snug">{title}</h4>

                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-500">
                            {progress}{unit} / {total}{unit}
                        </span>
                        <span className={`font-medium ${isComplete ? 'text-emerald-600' : 'text-slate-700'}`}>
                            {isComplete ? 'Done ✓' : `${Math.round(percentage)}%`}
                        </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-[width] duration-500 ${isComplete ? 'bg-emerald-500' : barColor[color] || barColor.emerald}`}
                            style={{ width: `${percentage}%` }}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
