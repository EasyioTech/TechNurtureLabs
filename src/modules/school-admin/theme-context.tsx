'use client';

import React, { createContext, useContext, useState } from 'react';

interface SchoolThemeCtx { isDark: boolean; toggle: () => void; }
const SchoolThemeContext = createContext<SchoolThemeCtx>({ isDark: false, toggle: () => { } });

export function SchoolThemeProvider({ children }: { children: React.ReactNode }) {
    const [isDark, setIsDark] = useState(false);
    return (
        <SchoolThemeContext.Provider value={{ isDark, toggle: () => setIsDark(d => !d) }}>
            {children}
        </SchoolThemeContext.Provider>
    );
}

export function useSchoolTheme() { return useContext(SchoolThemeContext); }

// Unified theme token helper (mirrors super-admin pattern but with school-specific flair)
export const ts = {
    pageBg: (d: boolean) => d ? 'bg-[#0f1115]' : 'bg-[#fcfdfe]',
    headerBg: (d: boolean) => d ? 'bg-[#0f1115]/80 border-b border-white/[0.03] backdrop-blur-xl' : 'bg-white/80 border-b border-slate-200/50 backdrop-blur-xl',
    card: (d: boolean) => d ? 'bg-[#161921] border-white/[0.04] shadow-sm shadow-black/20' : 'bg-white border-slate-200/60 shadow-sm shadow-slate-200/40',
    cardHover: (d: boolean) => d ? 'hover:bg-white/[0.01] hover:border-indigo-500/20' : 'hover:bg-slate-50/50 hover:border-slate-200',
    border: (d: boolean) => d ? 'border-white/[0.05]' : 'border-slate-200/60',
    divider: (d: boolean) => d ? 'divide-y divide-white/[0.03]' : 'divide-y divide-slate-100/80',

    // Typography
    textPrimary: (d: boolean) => d ? 'text-slate-100' : 'text-slate-900',
    textSecondary: (d: boolean) => d ? 'text-slate-400' : 'text-slate-600',
    textMuted: (d: boolean) => d ? 'text-slate-500' : 'text-slate-400',

    // Buttons
    btnPrimary: (d: boolean) => d ? 'bg-indigo-600 text-white hover:bg-indigo-500 transition-all font-semibold' : 'bg-indigo-600 text-white hover:bg-indigo-700 transition-all font-semibold',
    btnOutline: (d: boolean) => d ? 'border-white/10 text-slate-300 hover:bg-white/[0.05] font-semibold' : 'border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold',

    // States & Badges
    navActive: (d: boolean) => d ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600 font-bold',
    navInactive: (d: boolean) => d ? 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.02]' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50',
    accentSoft: (d: boolean) => d ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-indigo-50 text-indigo-600 border border-indigo-100',

    // Status
    live: (d: boolean) => d ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    draft: (d: boolean) => d ? 'bg-slate-500/10 text-slate-400 border border-slate-500/20' : 'bg-slate-50 text-slate-600 border border-slate-200',
    danger: (d: boolean) => d ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-rose-50 text-rose-600 border border-rose-200',
    warning: (d: boolean) => d ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-amber-50 text-amber-700 border border-amber-200',
};
