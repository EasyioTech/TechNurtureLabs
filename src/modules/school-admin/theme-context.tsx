'use client';

import React, { createContext, useContext, useState } from 'react';

interface SchoolThemeCtx { isDark: boolean; toggle: () => void; }
const SchoolThemeContext = createContext<SchoolThemeCtx>({ isDark: true, toggle: () => { } });

export function SchoolThemeProvider({ children }: { children: React.ReactNode }) {
    const [isDark, setIsDark] = useState(true);
    return (
        <SchoolThemeContext.Provider value={{ isDark, toggle: () => setIsDark(d => !d) }}>
            {children}
        </SchoolThemeContext.Provider>
    );
}

export function useSchoolTheme() { return useContext(SchoolThemeContext); }

// Unified theme token helper (mirrors super-admin pattern)
export const ts = {
    pageBg: (d: boolean) => d ? 'bg-[#080c14]' : 'bg-neutral-50',
    headerBg: (d: boolean) => d ? 'bg-[#080c14]/95 border-b border-white/[0.06]' : 'bg-white/95 border-b border-neutral-200/70',
    card: (d: boolean) => d ? 'bg-[#0f1219] border-white/[0.06]' : 'bg-white border-neutral-200/70',
    cardHover: (d: boolean) => d ? 'hover:bg-white/[0.02]' : 'hover:bg-neutral-50/80',
    border: (d: boolean) => d ? 'border-white/[0.06]' : 'border-neutral-200/70',
    divider: (d: boolean) => d ? 'divide-y divide-white/[0.04]' : 'divide-y divide-neutral-100',
    textPrimary: (d: boolean) => d ? 'text-white' : 'text-[#1a1a1a]',
    textSecondary: (d: boolean) => d ? 'text-slate-300' : 'text-[#3d3d3d]',
    textMuted: (d: boolean) => d ? 'text-slate-500' : 'text-neutral-400',
    btnPrimary: (d: boolean) => d ? 'bg-lime-400 text-slate-900 hover:bg-lime-300' : 'bg-[#1a1a1a] text-white hover:bg-[#2a2a2a]',
    btnOutline: (d: boolean) => d ? 'border-white/10 text-white hover:bg-white/[0.06] hover:border-white/20' : 'border-neutral-300 text-[#1a1a1a] hover:bg-neutral-100 hover:border-neutral-400',
    navInactive: (d: boolean) => d ? 'text-slate-500 hover:text-white' : 'text-neutral-500 hover:text-[#1a1a1a]',
    accentBadge: (d: boolean) => d ? 'bg-lime-400/10 text-lime-400' : 'bg-[#1a1a1a]/5 text-[#1a1a1a]',
    accentSoft: (d: boolean) => d ? 'bg-lime-400/10 text-lime-400' : 'bg-emerald-50 text-emerald-700',
    live: (d: boolean) => d ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' : 'bg-emerald-50 text-emerald-700 border-emerald-100',
    draft: (d: boolean) => d ? 'bg-white/[0.04] text-slate-500' : 'bg-slate-100 text-slate-500',
    danger: (d: boolean) => d ? 'bg-rose-500/10 text-rose-400' : 'bg-rose-50 text-rose-600',
};
