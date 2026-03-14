'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface CourseHeaderProps {
  title: string;
  progress: number;
}

export function CourseDetailsHeader({ title, progress }: CourseHeaderProps) {
  return (
    <header className="sticky top-0 z-[60] bg-white/80 backdrop-blur-xl border-b border-slate-100 lg:px-12 px-6 py-5 flex items-center justify-between shadow-sm shadow-slate-200/50">
      <div className="flex items-center gap-6">
        <Link href="/student">
          <button className="w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all active:scale-95 shadow-sm">
            <ArrowLeft size={18} strokeWidth={2.5} />
          </button>
        </Link>
        <div className="h-6 w-px bg-slate-100" />
        <div>
          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-0.5 opacity-80">Course Details</p>
          <p className="text-sm font-black text-slate-900 uppercase tracking-tight truncate max-w-[150px] sm:max-w-none">
            {title}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex flex-col items-end">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Course Progress</p>
          <p className="text-xs font-black text-slate-900">{Math.round(progress)}% Complete</p>
        </div>
        <div className="w-10 h-10 rounded-full border-2 border-slate-50 flex p-0.5">
          <div
            className="h-full bg-indigo-600 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(79,70,229,0.3)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </header>
  );
}
