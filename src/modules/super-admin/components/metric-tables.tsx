'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserMetric } from '../types';
import { useAdminTheme, t } from '../theme-context';
import { USER_METRICS_PAGE_SIZE } from '../hooks/use-admin-data';
import { Zap, Trophy, CheckCircle2, ChevronLeft, ChevronRight, ArrowUpDown, Search } from 'lucide-react';

interface MetricTablesProps {
    userMetrics: UserMetric[];
    page?: number;
    setPage?: (p: number) => void;
}

type UserSortField = 'full_name' | 'total_xp' | 'level' | 'lessons_completed';

export function MetricTables({ userMetrics, page = 0, setPage }: MetricTablesProps) {
    const { isDark, accent } = useAdminTheme();
    
    // M-7: Added local sorting and filtering for enhanced report usability
    const [userSort, setUserSort] = useState<{ field: UserSortField, direction: 'asc' | 'desc' }>({ field: 'total_xp', direction: 'desc' });
    const [studentSearch, setStudentSearch] = useState('');

    const filteredAndSortedUsers = useMemo(() => {
        let result = [...userMetrics];
        if (studentSearch) {
            const query = studentSearch.toLowerCase();
            result = result.filter(u => u.full_name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query));
        }
        result.sort((a, b) => {
            const aVal = a[userSort.field];
            const bVal = b[userSort.field];
            if (aVal < bVal) return userSort.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return userSort.direction === 'asc' ? 1 : -1;
            return 0;
        });
        return result;
    }, [userMetrics, userSort, studentSearch]);

    const totalPages = Math.ceil(filteredAndSortedUsers.length / USER_METRICS_PAGE_SIZE);
    const pagedMetrics = filteredAndSortedUsers.slice(page * USER_METRICS_PAGE_SIZE, (page + 1) * USER_METRICS_PAGE_SIZE);

    const toggleUserSort = (field: UserSortField) => {
        setUserSort(prev => ({ field, direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc' }));
        if (setPage) setPage(0);
    };

    return (
        <div className="space-y-6">
            {userMetrics.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                    className={`rounded-[24px] border overflow-hidden transition-all duration-300 shadow-xl shadow-black/5 ${t.card(isDark)}`}>
                    <div className={`px-6 py-5 border-b ${t.border(isDark)} flex items-center justify-between flex-wrap gap-4`}>
                        <div className="flex-1">
                            <h3 className={`font-black text-lg tracking-tight ${t.textPrimary(isDark)}`}>Student Leaderboard</h3>
                            <p className={`text-[12px] font-medium ${t.textMuted(isDark)}`}>
                                Engagement rankings based on {userSort.field.replace('_', ' ')}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative group">
                                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${t.textMuted(isDark)}`} />
                                <Input 
                                    placeholder="Find student..."
                                    value={studentSearch}
                                    onChange={(e) => { setStudentSearch(e.target.value); if (setPage) setPage(0); }}
                                    className={`h-9 w-48 pl-9 rounded-full text-[11px] font-bold border-2 ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}
                                />
                            </div>
                            <Button variant="outline" size="sm" onClick={() => toggleUserSort('total_xp')}
                                className={`h-9 rounded-full px-4 text-[11px] font-black border-2 ${userSort.field === 'total_xp' ? t.btnPrimary(isDark, accent) : t.btnOutline(isDark)}`}>
                                XP <ArrowUpDown size={12} className="ml-1.5 opacity-60" />
                            </Button>
                        </div>
                    </div>
                    <div className={t.divider(isDark)}>
                        {pagedMetrics.map((u, i) => {
                            const globalRank = page * USER_METRICS_PAGE_SIZE + i;
                            const isTop3 = !studentSearch && globalRank < 3;
                            return (
                                <motion.div key={u.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                                    className={`px-6 py-4 flex items-center gap-4 transition-all group ${t.cardHover(isDark)}`}>
                                    <div className="relative">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-[12px] font-black flex-shrink-0
                                            ${isTop3 ? (isDark ? `${accent.bg} text-slate-900 ${accent.ring.replace('ring-', 'ring-4 ring-')}` : 'bg-slate-900 text-white shadow-lg shadow-slate-900/20') : isDark ? 'bg-white/[0.12] text-slate-200 border border-white/10 shadow-inner' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                                            {u.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                        </div>
                                        {isTop3 && (
                                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center border-2 border-white dark:border-[#0f1219]">
                                                <Trophy size={10} className="text-slate-900" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className={`font-black text-sm tracking-tight ${t.textPrimary(isDark)}`}>{u.full_name}</p>
                                            <Badge className={`text-[9px] font-black h-4 px-1.5 ${isDark ? accent.softDark.split(' ').slice(0, 2).join(' ') : accent.softLight.split(' ').slice(0, 2).join(' ')}`}>LVL {u.level}</Badge>
                                        </div>
                                        <p className={`text-[11px] font-medium leading-none mt-0.5 ${t.textMuted(isDark)}`}>{u.email}</p>
                                    </div>
                                    <div className="hidden md:flex flex-col items-end mr-6">
                                        <p className={`text-[10px] font-black tracking-widest uppercase mb-1 ${t.textMuted(isDark)}`}>School</p>
                                        <p className={`text-[11px] font-bold ${t.textSecondary(isDark)}`}>{u.school_name}</p>
                                    </div>
                                    <div className="flex flex-col items-end min-w-[100px]">
                                        <p className={`text-lg font-[900] tracking-tighter ${isDark ? accent.text : 'text-slate-900'}`}>{u.total_xp.toLocaleString()} XP</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] text-orange-500 font-black flex items-center gap-0.5"><Zap size={10} fill="currentColor" />{u.current_streak}D</span>
                                            <span className={`text-[10px] ${isDark ? accent.text : `text-${accent.name}-600`} font-black flex items-center gap-0.5`}><CheckCircle2 size={10} />{u.lessons_completed}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Pagination Footer */}
                    {totalPages > 1 && setPage && (
                        <div className={`px-6 py-4 border-t ${t.border(isDark)} flex items-center justify-between`}>
                            <p className={`text-[11px] font-bold ${t.textMuted(isDark)}`}>
                                Showing {page * USER_METRICS_PAGE_SIZE + 1}–{Math.min((page + 1) * USER_METRICS_PAGE_SIZE, filteredAndSortedUsers.length)} of {filteredAndSortedUsers.length} students
                            </p>
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm" disabled={page === 0}
                                    onClick={() => setPage(page - 1)}
                                    className={`rounded-full h-8 px-4 text-[11px] font-black disabled:opacity-30 ${isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-slate-100 text-slate-700'}`}>
                                    <ChevronLeft size={14} className="mr-1" /> Prev
                                </Button>
                                <span className={`text-[11px] font-black px-2 ${t.textMuted(isDark)}`}>{page + 1} / {totalPages}</span>
                                <Button variant="ghost" size="sm" disabled={page >= totalPages - 1}
                                    onClick={() => setPage(page + 1)}
                                    className={`rounded-full h-8 px-4 text-[11px] font-black disabled:opacity-30 ${isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-slate-100 text-slate-700'}`}>
                                    Next <ChevronRight size={14} className="ml-1" />
                                </Button>
                            </div>
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    );
}
