'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

export function QuickStatCard({ icon: Icon, value, label }: any) {
    return (
        <div className="group bg-white border border-slate-100 p-6 rounded-[2rem] hover:border-indigo-100 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-300">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 group-hover:bg-indigo-50 flex items-center justify-center flex-shrink-0 transition-colors">
                    <Icon size={20} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
                </div>
                <div>
                    <p className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1.5">{value}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
                </div>
            </div>
        </div>
    );
}
