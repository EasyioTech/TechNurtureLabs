'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

export function QuickStatCard({ icon: Icon, value, label }: any) {
    return (
        <div className="group bg-white border border-slate-100 p-5 rounded-3xl hover:border-indigo-100 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-300">
            <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-slate-50 group-hover:bg-indigo-50 flex items-center justify-center flex-shrink-0 transition-colors">
                    <Icon size={18} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
                </div>
                <div>
                    <p className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1.5">{value}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
                </div>
            </div>
        </div>
    );
}
