'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';

/* ── Mode: dark | light ── */
type Theme = 'dark' | 'light';

/* ── Accent Color Schemes ── */
export type ColorScheme = 'lime' | 'violet' | 'ocean' | 'rose' | 'amber' | 'emerald' | 'indigo';

interface AccentPalette {
    bg: string;
    bgHover: string;
    text: string;
    softDark: string;
    softLight: string;
    badgeDark: string;
    badgeLight: string;
    ring: string;
    name: string;
    label: string;
    swatchDark: string;
    swatchLight: string;
    /** CSS custom property values (raw hex) */
    hoverText: string;
}

export const COLOR_SCHEMES: Record<ColorScheme, AccentPalette> = {
    lime: {
        bg: 'bg-lime-400', bgHover: 'hover:bg-lime-300', text: 'text-lime-400',
        softDark: 'bg-lime-400/10 text-lime-400 border-lime-400/20',
        softLight: 'bg-lime-100/60 text-lime-800 border-lime-200',
        badgeDark: 'text-lime-400 bg-lime-400/10', badgeLight: 'text-lime-700 bg-lime-50',
        ring: 'ring-lime-400/20', name: 'lime', label: 'Lime',
        swatchDark: '#a3e635', swatchLight: '#65a30d', hoverText: 'hover:text-lime-400',
    },
    violet: {
        bg: 'bg-violet-400', bgHover: 'hover:bg-violet-300', text: 'text-violet-400',
        softDark: 'bg-violet-400/10 text-violet-400 border-violet-400/20',
        softLight: 'bg-violet-100/60 text-violet-800 border-violet-200',
        badgeDark: 'text-violet-400 bg-violet-400/10', badgeLight: 'text-violet-700 bg-violet-50',
        ring: 'ring-violet-400/20', name: 'violet', label: 'Violet',
        swatchDark: '#a78bfa', swatchLight: '#7c3aed', hoverText: 'hover:text-violet-400',
    },
    ocean: {
        bg: 'bg-cyan-400', bgHover: 'hover:bg-cyan-300', text: 'text-cyan-400',
        softDark: 'bg-cyan-400/10 text-cyan-400 border-cyan-400/20',
        softLight: 'bg-cyan-100/60 text-cyan-800 border-cyan-200',
        badgeDark: 'text-cyan-400 bg-cyan-400/10', badgeLight: 'text-cyan-700 bg-cyan-50',
        ring: 'ring-cyan-400/20', name: 'cyan', label: 'Ocean',
        swatchDark: '#22d3ee', swatchLight: '#0891b2', hoverText: 'hover:text-cyan-400',
    },
    rose: {
        bg: 'bg-rose-400', bgHover: 'hover:bg-rose-300', text: 'text-rose-400',
        softDark: 'bg-rose-400/10 text-rose-400 border-rose-400/20',
        softLight: 'bg-rose-100/60 text-rose-800 border-rose-200',
        badgeDark: 'text-rose-400 bg-rose-400/10', badgeLight: 'text-rose-700 bg-rose-50',
        ring: 'ring-rose-400/20', name: 'rose', label: 'Rose',
        swatchDark: '#fb7185', swatchLight: '#e11d48', hoverText: 'hover:text-rose-400',
    },
    amber: {
        bg: 'bg-amber-400', bgHover: 'hover:bg-amber-300', text: 'text-amber-400',
        softDark: 'bg-amber-400/10 text-amber-400 border-amber-400/20',
        softLight: 'bg-amber-100/60 text-amber-800 border-amber-200',
        badgeDark: 'text-amber-400 bg-amber-400/10', badgeLight: 'text-amber-700 bg-amber-50',
        ring: 'ring-amber-400/20', name: 'amber', label: 'Amber',
        swatchDark: '#fbbf24', swatchLight: '#d97706', hoverText: 'hover:text-amber-400',
    },
    emerald: {
        bg: 'bg-emerald-400', bgHover: 'hover:bg-emerald-300', text: 'text-emerald-400',
        softDark: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
        softLight: 'bg-emerald-100/60 text-emerald-800 border-emerald-200',
        badgeDark: 'text-emerald-400 bg-emerald-400/10', badgeLight: 'text-emerald-700 bg-emerald-50',
        ring: 'ring-emerald-400/20', name: 'emerald', label: 'Emerald',
        swatchDark: '#34d399', swatchLight: '#059669', hoverText: 'hover:text-emerald-400',
    },
    indigo: {
        bg: 'bg-indigo-400', bgHover: 'hover:bg-indigo-300', text: 'text-indigo-400',
        softDark: 'bg-indigo-400/10 text-indigo-400 border-indigo-400/20',
        softLight: 'bg-indigo-100/60 text-indigo-800 border-indigo-200',
        badgeDark: 'text-indigo-400 bg-indigo-400/10', badgeLight: 'text-indigo-700 bg-indigo-50',
        ring: 'ring-indigo-400/20', name: 'indigo', label: 'Indigo',
        swatchDark: '#818cf8', swatchLight: '#4f46e5', hoverText: 'hover:text-indigo-400',
    },
};

/* ── LocalStorage keys ── */
const LS_THEME_KEY = 'sa-theme-mode';
const LS_COLOR_KEY = 'sa-color-scheme';

/* ── Context shape ── */
interface ThemeCtx {
    theme: Theme;
    isDark: boolean;
    toggle: () => void;
    colorScheme: ColorScheme;
    setColorScheme: (c: ColorScheme) => void;
    accent: AccentPalette;
}

const Ctx = createContext<ThemeCtx>({
    theme: 'dark', isDark: true, toggle: () => { },
    colorScheme: 'lime', setColorScheme: () => { },
    accent: COLOR_SCHEMES.lime,
});

export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>('dark');
    const [colorScheme, setColorSchemeState] = useState<ColorScheme>('lime');
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        try {
            const savedTheme = localStorage.getItem(LS_THEME_KEY) as Theme | null;
            const savedColor = localStorage.getItem(LS_COLOR_KEY) as ColorScheme | null;
            if (savedTheme && (savedTheme === 'dark' || savedTheme === 'light')) setTheme(savedTheme);
            if (savedColor && savedColor in COLOR_SCHEMES) setColorSchemeState(savedColor);
        } catch { }
        setHydrated(true);
    }, []);

    useEffect(() => { if (hydrated) try { localStorage.setItem(LS_THEME_KEY, theme); } catch { } }, [theme, hydrated]);
    useEffect(() => { if (hydrated) try { localStorage.setItem(LS_COLOR_KEY, colorScheme); } catch { } }, [colorScheme, hydrated]);

    const toggle = useCallback(() => setTheme(t => t === 'dark' ? 'light' : 'dark'), []);
    const setColorScheme = useCallback((c: ColorScheme) => setColorSchemeState(c), []);
    const accent = COLOR_SCHEMES[colorScheme];

    return (
        <Ctx.Provider value={{ theme, isDark: theme === 'dark', toggle, colorScheme, setColorScheme, accent }}>
            {children}
        </Ctx.Provider>
    );
}

export const useAdminTheme = () => useContext(Ctx);

/* ── Shared style helpers ── */
export const t = {
    pageBg: (d: boolean) => d ? 'bg-[#09090b]' : 'bg-[#fafafa]',
    card: (d: boolean) => d ? 'bg-[#121214] border-white/[0.08]' : 'bg-white border-neutral-200 shadow-sm shadow-black/[0.01]',
    cardHover: (d: boolean) => d ? 'hover:bg-[#18181b] hover:border-white/20' : 'hover:bg-neutral-50/30',
    textPrimary: (d: boolean) => d ? 'text-white' : 'text-[#171717]',
    textSecondary: (d: boolean) => d ? 'text-slate-200' : 'text-[#4b5563]',
    textMuted: (d: boolean) => d ? 'text-slate-400' : 'text-[#6b7280]',
    border: (d: boolean) => d ? 'border-white/[0.12]' : 'border-neutral-200',
    divider: (d: boolean) => d ? 'divide-white/[0.08]' : 'divide-neutral-100',
    headerBg: (d: boolean) => d ? 'bg-[#09090b]/90' : 'bg-white/95',
    navPillBg: (d: boolean) => d ? 'bg-white/[0.06]' : 'bg-neutral-100',
    navActive: (d: boolean) => d ? 'bg-white text-slate-950' : 'bg-[#171717] text-white',
    navInactive: (d: boolean) => d ? 'text-slate-300 hover:text-white' : 'text-neutral-500 hover:text-[#171717]',
    inputBg: (d: boolean) => d ? 'bg-white/[0.06] text-white placeholder:text-slate-500' : 'bg-[#f5f5f5] text-[#262626] border-neutral-200/60 placeholder:text-neutral-400',

    /* ── Accent-aware helpers ── */
    accent: 'bg-lime-400 text-slate-900',                                       // static fallback
    accentDynamic: (a: AccentPalette) => `${a.bg} text-slate-900`,
    accentSoft: (d: boolean, a: AccentPalette) => d ? a.softDark : a.softLight,
    accentBadge: (d: boolean, a: AccentPalette) => d ? a.badgeDark : a.badgeLight,
    accentText: (d: boolean, a: AccentPalette) => d ? a.text : a.softLight.split(' ')[1] || a.text, // e.g. 'text-lime-700'

    /* Primary button uses accent in BOTH modes */
    btnPrimary: (d: boolean, a: AccentPalette) =>
        d ? `${a.bg} ${a.bgHover} text-slate-900 border-0`
            : `${a.bg} ${a.bgHover} text-slate-900 border-0`,

    btnOutline: (d: boolean) => d ? 'bg-transparent border-white/20 text-white hover:bg-white/10' : 'bg-transparent border-neutral-200 text-neutral-600 hover:bg-neutral-50',

    /* Status badges – these stay semantic, NOT accent-colored */
    live: (d: boolean) => d ? 'bg-emerald-500/10 text-emerald-400 border-emerald-400/20' : 'bg-emerald-50 text-emerald-700 border-emerald-100',
    draft: (d: boolean) => d ? 'bg-white/[0.06] text-slate-500 border-white/10' : 'bg-neutral-100/80 text-neutral-500 border-neutral-200/60',
    danger: (d: boolean) => d ? 'bg-rose-500/10 text-rose-400 border-rose-400/20' : 'bg-rose-50 text-rose-700 border-rose-100',

    iconBg: (d: boolean) => d ? 'bg-white/[0.08]' : 'bg-neutral-100',
    iconText: (d: boolean) => d ? 'text-slate-200' : 'text-neutral-600',

    /* Input focus ring - accent aware */
    inputFocus: (a: AccentPalette) => {
        const color = a.name;
        return `focus-visible:ring-${color}-400/50 focus-visible:border-${color}-400/50`;
    },

    /* Switch accent (data-[state=checked]) */
    switchAccent: (a: AccentPalette) => `data-[state=checked]:${a.bg}`,

    /* Hover accent for icon buttons */
    hoverAccent: (d: boolean, a: AccentPalette) => d ? `${a.hoverText} hover:bg-white/[0.06]` : `hover:text-neutral-800 hover:bg-neutral-50`,

    /* Shadow using accent color */
    shadowAccent: (d: boolean, a: AccentPalette) => d ? {} : {},  // use glowStyle instead
    glowStyle: (d: boolean, a: AccentPalette): React.CSSProperties =>
        d ? { boxShadow: `0 10px 25px -5px ${a.swatchDark}33` } : { boxShadow: `0 10px 25px -5px ${a.swatchLight}33` },

    /** Notification dot glow */
    dotGlow: (d: boolean, a: AccentPalette): React.CSSProperties =>
        ({ boxShadow: `0 0 10px ${d ? a.swatchDark : a.swatchLight}80` }),

    /** Progress bar glow in dark mode */
    barGlow: (d: boolean, a: AccentPalette): React.CSSProperties =>
        d ? { boxShadow: `0 0 10px ${a.swatchDark}4D` } : {},

    /* Card hover border with accent */
    cardHoverAccent: (d: boolean, a: AccentPalette) =>
        d ? `border-transparent hover:border-${a.name}-400/20` : `border-transparent hover:border-${a.name}-400/20`,

    /* Featured card ring */
    featuredCard: (d: boolean, a: AccentPalette) =>
        d ? `bg-[#1a1f2e] border-${a.name}-400/30 ring-4 ring-${a.name}-400/5`
            : `bg-white border-${a.name}-400/10 ring-8 ring-${a.name}-400/[0.02]`,

    /* Selected course/item highlight */
    selectedBg: (d: boolean, a: AccentPalette) =>
        d ? `${a.softDark.split(' ')[0]} ring-1 ring-${a.name}-400/20 shadow-lg shadow-black/20`
            : `${a.bg} text-slate-900 shadow-xl shadow-black/10`,

    /* Avatar circle */
    avatarBg: (d: boolean, a: AccentPalette) => d ? `${a.bg} text-slate-900` : 'bg-[#171717] text-white',

    /* School initial circle */
    initialCircle: (d: boolean, a: AccentPalette) => d ? `${a.softDark}` : 'bg-slate-100 text-slate-900 border border-slate-200',
};
