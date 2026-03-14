'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatBoxProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  color: 'indigo' | 'sky' | 'amber' | 'emerald';
}

const ACCENT_COLORS = {
    indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100/50',
    sky: 'text-sky-600 bg-sky-50 border-sky-100/50',
    amber: 'text-amber-600 bg-amber-50 border-amber-100/50',
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100/50',
};

export function StatBox({ icon: Icon, label, value, color }: StatBoxProps) {
  return (
    <div className="bg-white border border-slate-100 p-6 rounded-[2.5rem] hover:border-indigo-200 hover:shadow-2xl hover:shadow-slate-200/50 transition-all group">
      <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center mb-5 border border-slate-100 transition-transform group-hover:scale-110 duration-500", ACCENT_COLORS[color])}>
        <Icon size={18} strokeWidth={2.5} />
      </div>
      <p className="text-xl font-black text-slate-900 tracking-tight leading-none mb-2">{value}</p>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] group-hover:text-slate-900 transition-colors">{label}</p>
    </div>
  );
}
