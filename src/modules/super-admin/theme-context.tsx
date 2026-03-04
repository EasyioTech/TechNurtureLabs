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
    // Page background: A soft, airy off-white
    pageBg: (d: boolean) => d ? 'bg-[#09090b]' : 'bg-[#fafafa]',
    // Cards: Paper-white with subtle depth
    card: (d: boolean) => d ? 'bg-[#121214] border-white/[0.06]' : 'bg-white border-neutral-200/50 shadow-sm shadow-black/[0.01]',
    cardHover: (d: boolean) => d ? 'hover:bg-[#18181b]' : 'hover:bg-neutral-50/30',
    // Text: Deep graphite instead of pure black for a softer feel
    textPrimary: (d: boolean) => d ? 'text-white' : 'text-[#262626]',
    textSecondary: (d: boolean) => d ? 'text-slate-400' : 'text-[#666666]',
    textMuted: (d: boolean) => d ? 'text-slate-500' : 'text-[#a3a3a3]',
    // Borders: Delicate and light
    border: (d: boolean) => d ? 'border-white/[0.06]' : 'border-neutral-200/50',
    divider: (d: boolean) => d ? 'divide-white/[0.04]' : 'divide-neutral-100/80',
    // Nav/Header: Semi-transparent blur
    headerBg: (d: boolean) => d ? 'bg-[#09090b]/80' : 'bg-white/90',
    navPillBg: (d: boolean) => d ? 'bg-white/[0.04]' : 'bg-neutral-100/80',
    navActive: (d: boolean) => d ? 'bg-white text-slate-900' : 'bg-[#262626] text-white',
    navInactive: (d: boolean) => d ? 'text-slate-400 hover:text-white' : 'text-neutral-500 hover:text-[#262626]',
    // Input: Softer interaction states
    inputBg: (d: boolean) => d ? 'bg-white/[0.06] text-white placeholder:text-slate-500' : 'bg-[#f5f5f5] text-[#262626] border-neutral-200/60 placeholder:text-neutral-400',
    // Accent: Lime remains vibrant but grounded
    accent: 'bg-lime-400 text-slate-900',
    accentSoft: (d: boolean) => d ? 'bg-lime-400/10 text-lime-400 border-lime-400/20' : 'bg-[#f7fee7] text-[#3f6212] border-[#d9f99d]',
    accentBadge: (d: boolean) => d ? 'text-lime-400 bg-lime-400/10' : 'text-[#4d7c0f] bg-[#f7fee7]',
    // Status badges: Vibrant but soft
    live: (d: boolean) => d ? 'bg-emerald-500/10 text-emerald-400 border-emerald-400/20' : 'bg-emerald-50 text-emerald-700 border-emerald-100',
    draft: (d: boolean) => d ? 'bg-white/[0.06] text-slate-500 border-white/10' : 'bg-neutral-100/80 text-neutral-500 border-neutral-200/60',
    danger: (d: boolean) => d ? 'bg-rose-500/10 text-rose-400 border-rose-400/20' : 'bg-rose-50 text-rose-700 border-rose-100',
    // Buttons: Deep graphite for authority without the harshness of black
    btnPrimary: (d: boolean) => d ? 'bg-lime-400 hover:bg-lime-300 text-slate-900 border-0' : 'bg-[#262626] hover:bg-[#1a1a1a] text-white border-0',
    btnOutline: (d: boolean) => d ? 'bg-transparent border-white/20 text-white hover:bg-white/10' : 'bg-transparent border-neutral-200 text-neutral-600 hover:bg-neutral-50',
    // Icon container
    iconBg: (d: boolean) => d ? 'bg-white/[0.06]' : 'bg-neutral-100',
    iconText: (d: boolean) => d ? 'text-slate-400' : 'text-neutral-500',
};
