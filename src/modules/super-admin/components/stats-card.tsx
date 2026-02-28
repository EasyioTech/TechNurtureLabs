'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatCardProps {
    icon: any;
    label: string;
    value: string;
    change: string;
    trend: 'up' | 'down';
    gradient: string;
}

export function StatCard({ icon: Icon, label, value, change, trend, gradient }: StatCardProps) {
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-white border-stone-200 shadow-sm hover:shadow-md transition-all">
                <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
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

interface MiniStatCardProps {
    icon: any;
    label: string;
    value: number | string;
    color: string;
}

export function MiniStatCard({ icon: Icon, label, value, color }: MiniStatCardProps) {
    const colors: Record<string, string> = {
        sky: 'from-sky-500 to-blue-500',
        emerald: 'from-emerald-500 to-teal-500',
        amber: 'from-amber-500 to-orange-500',
        rose: 'from-rose-500 to-pink-500',
    };

    return (
        <Card className="bg-white border-stone-200 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center`}>
                    <Icon className="text-white" size={18} />
                </div>
                <div>
                    <p className="text-xl font-bold text-slate-800">{typeof value === 'number' ? value.toLocaleString() : value}</p>
                    <p className="text-xs text-slate-500">{label}</p>
                </div>
            </CardContent>
        </Card>
    );
}
