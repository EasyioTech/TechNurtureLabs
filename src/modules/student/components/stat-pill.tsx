'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';

export function StatPill({ icon: Icon, value, label, color, pulse }: any) {
    const colors: any = {
        orange: 'bg-orange-100 text-orange-600 border-orange-200',
        amber: 'bg-amber-100 text-amber-600 border-amber-200',
        sky: 'bg-sky-100 text-sky-600 border-sky-200',
    };

    return (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${colors[color]} shadow-sm`}>
            <motion.div animate={pulse ? { scale: [1, 1.2, 1] } : {}} transition={{ duration: 1.5, repeat: Infinity }}>
                <Icon size={16} fill="currentColor" />
            </motion.div>
            <span className="font-bold text-sm">{value}</span>
            <span className="text-xs opacity-70 hidden sm:inline">{label}</span>
        </div>
    );
}

export function QuickStatCard({ icon: Icon, value, label, gradient, bgColor }: any) {
    return (
        <Card className={`${bgColor} border-0 shadow-lg hover:shadow-xl transition-all group`}>
            <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center group-hover:scale-110 transition-transform shadow-md`}>
                    <Icon size={20} className="text-white" />
                </div>
                <div>
                    <p className="text-2xl font-black text-slate-800">{value}</p>
                    <p className="text-xs text-slate-500 font-medium">{label}</p>
                </div>
            </CardContent>
        </Card>
    );
}
