'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Star } from 'lucide-react';

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
    const percentage = (progress / total) * 100;
    const isComplete = progress >= total;

    const colors: any = {
        emerald: { bg: 'bg-emerald-50', border: 'border-emerald-300', progress: 'from-emerald-400 to-teal-500', icon: 'from-emerald-400 to-teal-500', text: 'text-emerald-600' },
        amber: { bg: 'bg-amber-50', border: 'border-amber-200', progress: 'from-amber-400 to-orange-500', icon: 'from-amber-400 to-orange-500', text: 'text-amber-600' },
        sky: { bg: 'bg-sky-50', border: 'border-sky-200', progress: 'from-sky-400 to-blue-500', icon: 'from-sky-400 to-blue-500', text: 'text-sky-600' },
    };

    const c = colors[color] || colors.emerald;

    return (
        <Card className={`${isComplete ? 'bg-emerald-50 border-emerald-300' : 'bg-white border-slate-200'} shadow-lg hover:shadow-xl transition-all`}>
            <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${c.icon} flex items-center justify-center shadow-md`}>
                        <Icon size={20} className="text-white" />
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-600">
                        <Star size={12} fill="currentColor" />
                        <span className="text-xs font-bold">+{reward}</span>
                    </div>
                </div>
                <h4 className="font-bold text-slate-800 mb-3">{title}</h4>
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-500">{progress}{unit} / {total}{unit}</span>
                        <span className={`font-semibold ${isComplete ? 'text-emerald-600' : c.text}`}>
                            {isComplete ? 'Complete!' : `${Math.round(percentage)}%`}
                        </span>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.5 }}
                            className={`h-full rounded-full bg-gradient-to-r ${isComplete ? 'from-emerald-400 to-teal-500' : c.progress}`}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
