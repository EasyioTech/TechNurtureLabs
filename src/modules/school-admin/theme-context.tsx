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
    pageBg: (d: boolean) => d ? 'bg-[#0a0c10]' : 'bg-[#f8fafc]',
    headerBg: (d: boolean) => d ? 'bg-[#0a0c10]/80 border-b border-white/[0.05] backdrop-blur-xl' : 'bg-white/80 border-b border-slate-200/60 backdrop-blur-xl',
    card: (d: boolean) => d ? 'bg-[#11151c] border-white/[0.05] shadow-2xl shadow-black/20' : 'bg-white border-slate-200/60 shadow-sm shadow-slate-200/50',
    cardHover: (d: boolean) => d ? 'hover:bg-white/[0.02] hover:border-indigo-500/30' : 'hover:bg-slate-50/50 hover:border-indigo-200',
    border: (d: boolean) => d ? 'border-white/[0.05]' : 'border-slate-200/60',
    divider: (d: boolean) => d ? 'divide-y divide-white/[0.03]' : 'divide-y divide-slate-100',

    // Typography
    textPrimary: (d: boolean) => d ? 'text-slate-50' : 'text-slate-900',
    textSecondary: (d: boolean) => d ? 'text-slate-400' : 'text-slate-600',
    textMuted: (d: boolean) => d ? 'text-slate-500' : 'text-slate-400',

    // Buttons
    btnPrimary: (d: boolean) => d ? 'bg-indigo-500 text-white hover:bg-indigo-400 shadow-lg shadow-indigo-500/20' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/20',
    btnOutline: (d: boolean) => d ? 'border-white/10 text-white hover:bg-white/[0.05]' : 'border-slate-200 text-slate-700 hover:bg-slate-50',

    // States & Badges
    navActive: (d: boolean) => d ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-700',
    navInactive: (d: boolean) => d ? 'text-slate-500 hover:text-slate-200 hover:bg-white/[0.03]' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50',
    accentSoft: (d: boolean) => d ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600',

    // Status
    live: (d: boolean) => d ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200',
    draft: (d: boolean) => d ? 'bg-slate-500/10 text-slate-400 border-slate-500/20' : 'bg-slate-50 text-slate-600 border-slate-200',
    danger: (d: boolean) => d ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-rose-50 text-rose-600 border-rose-200',
    warning: (d: boolean) => d ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-700 border-amber-200',
};
