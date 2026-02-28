'use client';

import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Star } from 'lucide-react';

interface Student {
    id: string;
    full_name: string;
    total_xp: number;
    class_name?: string;
}

export function TopPerformerRow({ student, rank }: { student: Student; rank: number }) {
    const rankColors = ['bg-amber-100 text-amber-700', 'bg-slate-100 text-slate-600', 'bg-orange-100 text-orange-700'];
    return (
        <div className="flex items-center gap-3">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${rankColors[rank - 1] || 'bg-slate-100 text-slate-500'}`}>
                {rank}
            </div>
            <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-violet-100 text-violet-600 text-xs text-center flex items-center justify-center">
                    {student.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-slate-700 truncate">{student.full_name}</p>
                <p className="text-xs text-slate-500">{student.class_name || 'No Class'}</p>
            </div>
            <div className="flex items-center gap-1 text-amber-500">
                <Star size={14} fill="currentColor" />
                <span className="text-sm font-bold">{student.total_xp}</span>
            </div>
        </div>
    );
}
