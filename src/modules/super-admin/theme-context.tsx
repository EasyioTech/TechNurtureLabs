'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

type Theme = 'dark' | 'light';

interface ThemeCtx {
    theme: Theme;
    isDark: boolean;
    toggle: () => void;
}

const Ctx = createContext<ThemeCtx>({ theme: 'dark', isDark: true, toggle: () => { } });

export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>('dark');
    const toggle = useCallback(() => setTheme(t => t === 'dark' ? 'light' : 'dark'), []);
    return <Ctx.Provider value={{ theme, isDark: theme === 'dark', toggle }}>{children}</Ctx.Provider>;
}

export const useAdminTheme = () => useContext(Ctx);

/* ── Shared style helpers ── */
export const t = {
    // Page background
    pageBg: (d: boolean) => d ? 'bg-[#09090b]' : 'bg-[#f8f9fb]',
    // Cards
    card: (d: boolean) => d ? 'bg-[#121214] border-white/[0.06]' : 'bg-white border-slate-100',
    cardHover: (d: boolean) => d ? 'hover:bg-[#18181b]' : 'hover:bg-slate-50/60',
    // Text
    textPrimary: (d: boolean) => d ? 'text-white' : 'text-slate-800',
    textSecondary: (d: boolean) => d ? 'text-slate-400' : 'text-slate-500',
    textMuted: (d: boolean) => d ? 'text-slate-500' : 'text-slate-400',
    // Borders
    border: (d: boolean) => d ? 'border-white/[0.06]' : 'border-slate-100',
    divider: (d: boolean) => d ? 'divide-white/[0.04]' : 'divide-slate-50',
    // Nav/Header
    headerBg: (d: boolean) => d ? 'bg-[#09090b]/80' : 'bg-white/80',
    navPillBg: (d: boolean) => d ? 'bg-white/[0.04]' : 'bg-slate-100/80',
    navActive: (d: boolean) => d ? 'bg-white text-slate-900' : 'bg-slate-900 text-white',
    navInactive: (d: boolean) => d ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-700',
    // Input
    inputBg: (d: boolean) => d ? 'bg-white/[0.06] text-white placeholder:text-slate-500' : 'bg-slate-100/80 text-slate-600 placeholder:text-slate-400',
    // Accent
    accent: 'bg-lime-400 text-slate-900',
    accentSoft: (d: boolean) => d ? 'bg-lime-400/10 text-lime-400 border-lime-400/20' : 'bg-lime-100 text-lime-700 border-lime-200',
    accentBadge: (d: boolean) => d ? 'text-lime-400 bg-lime-400/10' : 'text-lime-700 bg-lime-100',
    // Status badges
    live: (d: boolean) => d ? 'bg-emerald-500/10 text-emerald-400 border-emerald-400/20' : 'bg-emerald-50 text-emerald-600 border-emerald-200',
    draft: (d: boolean) => d ? 'bg-white/[0.06] text-slate-500 border-white/10' : 'bg-slate-100 text-slate-400 border-slate-200',
    danger: (d: boolean) => d ? 'bg-rose-500/10 text-rose-400 border-rose-400/20' : 'bg-red-50 text-red-500 border-red-200',
    // Buttons
    btnPrimary: (d: boolean) => d ? 'bg-lime-400 hover:bg-lime-300 text-slate-900 border-0' : 'bg-slate-900 hover:bg-slate-800 text-white border-0',
    btnOutline: (d: boolean) => d ? 'bg-transparent border-white/20 text-white hover:bg-white/10' : 'bg-transparent border-slate-200 text-slate-600 hover:bg-slate-50',
    // Icon container
    iconBg: (d: boolean) => d ? 'bg-white/[0.06]' : 'bg-slate-100',
    iconText: (d: boolean) => d ? 'text-slate-400' : 'text-slate-500',
};
