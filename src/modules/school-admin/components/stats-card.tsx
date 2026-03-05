'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatCardProps {
    icon: any;
    label: string;
    value: string | number;
    change: string;
    trend: 'up' | 'down';
    color: string;
}

export function StatCard({ icon: Icon, label, value, change, trend, color }: StatCardProps) {
    const colors: Record<string, string> = {
        violet: 'from-violet-500 to-indigo-500 shadow-violet-200',
        emerald: 'from-emerald-500 to-teal-500 shadow-emerald-200',
        sky: 'from-sky-500 to-blue-500 shadow-sky-200',
        amber: 'from-amber-500 to-orange-500 shadow-amber-200',
        rose: 'from-rose-500 to-pink-500 shadow-rose-200',
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-white/80 backdrop-blur-xl border-slate-200/60 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${colors[color] || colors.sky} flex items-center justify-center shadow-lg`}>
                            <Icon className="text-white" size={20} />
                        </div>
                        <div className={`flex items-center gap-1 text-sm font-medium ${trend === 'up' ? 'text-emerald-600' : 'text-red-500'}`}>
                            {trend === 'up' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                            {change}
                        </div>
                    </div>
                    <div className="mt-4">
                        <p className="text-2xl font-black text-slate-800">{value}</p>
                        <p className="text-sm text-slate-500">{label}</p>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
