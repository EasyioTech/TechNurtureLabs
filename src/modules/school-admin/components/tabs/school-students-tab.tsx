'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { SchoolStudentMetric } from '../../types';
import { useSchoolTheme, ts } from '../../theme-context';
import { SCHOOL_STUDENT_PAGE_SIZE } from '../../hooks/use-school-data';
import { Search, Zap, ChevronLeft, ChevronRight, GraduationCap, CheckCircle2, Users } from 'lucide-react';

interface StudentsTabProps {
    students: SchoolStudentMetric[];
    filteredStudents: SchoolStudentMetric[];
    pagedStudents: SchoolStudentMetric[];
    totalStudentPages: number;
    studentsPage: number;
    setStudentsPage: (p: number) => void;
    studentSearch: string;
    setStudentSearch: (s: string) => void;
    onToggleStudent: (id: string, active: boolean) => void;
}

export function SchoolStudentsTab({
    students, filteredStudents, pagedStudents, totalStudentPages,
    studentsPage, setStudentsPage, studentSearch, setStudentSearch, onToggleStudent
}: StudentsTabProps) {
    const { isDark } = useSchoolTheme();

    return (
        <div className="space-y-4">
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                className={`rounded-[24px] border overflow-hidden shadow-xl shadow-black/5 ${ts.card(isDark)}`}>

                {/* Header */}
                <div className={`px-6 py-5 border-b ${ts.border(isDark)} flex flex-col sm:flex-row items-start sm:items-center gap-4`}>
                    <div className="flex-1">
                        <h3 className={`font-black text-lg tracking-tight ${ts.textPrimary(isDark)}`}>Student Roster</h3>
                        <p className={`text-[12px] font-medium ${ts.textMuted(isDark)}`}>{students.length} students enrolled</p>
                    </div>
                    <div className={`flex items-center rounded-full px-4 py-2 gap-3 border w-full sm:w-72 ${ts.border(isDark)} ${isDark ? 'bg-white/[0.04] focus-within:bg-white/[0.06]' : 'bg-white shadow-sm'} transition-all focus-within:ring-2 focus-within:ring-lime-400/30`}>
                        <Search size={14} className={ts.textMuted(isDark)} />
                        <input type="text" placeholder="Search by name, email, grade..."
                            value={studentSearch} onChange={e => { setStudentSearch(e.target.value); setStudentsPage(0); }}
                            className={`bg-transparent text-[12px] font-bold outline-none flex-1 ${ts.textPrimary(isDark)}`} />
                        {studentSearch && <button onClick={() => setStudentSearch('')} className={`text-[10px] ${ts.textMuted(isDark)}`}>✕</button>}
                    </div>
                </div>

                {/* Table header */}
                <div className={`px-6 py-3 grid grid-cols-12 gap-2 border-b ${ts.border(isDark)} bg-slate-500/[0.02]`}>
                    {['Student', 'Grade', 'Level / XP', 'Lessons Done', 'Streak', 'Last Active', 'Status'].map((h, i) => (
                        <div key={h} className={`text-[9px] font-black uppercase tracking-widest ${ts.textMuted(isDark)} ${[0].includes(i) ? 'col-span-3' : [5].includes(i) ? 'col-span-2' : 'col-span-1'} ${i > 0 ? 'text-right' : ''}`}>{h}</div>
                    ))}
                    <div className="col-span-1" />
                </div>

                {/* Rows */}
                <div className={ts.divider(isDark)}>
                    {pagedStudents.map((s, i) => (
                        <motion.div key={s.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                            className={`px-6 py-3.5 grid grid-cols-12 gap-2 items-center transition-all ${ts.cardHover(isDark)}`}>
                            {/* Name */}
                            <div className="col-span-3 flex items-center gap-3 min-w-0">
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-black flex-shrink-0
                                    ${isDark ? 'bg-lime-400/10 text-lime-400' : 'bg-slate-100 text-slate-700'}`}>
                                    {s.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <p className={`font-black text-[12px] truncate ${ts.textPrimary(isDark)}`}>{s.full_name}</p>
                                    <p className={`text-[10px] truncate ${ts.textMuted(isDark)}`}>{s.email}</p>
                                </div>
                            </div>
                            {/* Grade */}
                            <div className="col-span-1 text-right">
                                <span className={`text-[10px] font-black ${ts.textSecondary(isDark)}`}>{s.grade_name || '—'}</span>
                            </div>
                            {/* Level/XP */}
                            <div className="col-span-1 text-right">
                                <p className={`text-[12px] font-black ${isDark ? 'text-lime-400' : 'text-slate-900'}`}>{s.total_xp.toLocaleString()}</p>
                                <p className={`text-[9px] font-bold ${ts.textMuted(isDark)}`}>LVL {s.level}</p>
                            </div>
                            {/* Lessons */}
                            <div className="col-span-1 text-right">
                                <span className={`text-[12px] font-black ${ts.textPrimary(isDark)}`}>{s.lessons_completed}</span>
                            </div>
                            {/* Streak */}
                            <div className="col-span-1 text-right">
                                <span className="text-[12px] font-black text-orange-500 flex items-center justify-end gap-0.5">
                                    <Zap size={10} fill="currentColor" />{s.current_streak}d
                                </span>
                            </div>
                            {/* Last active */}
                            <div className="col-span-2 text-right">
                                <span className={`text-[10px] font-bold ${ts.textMuted(isDark)}`}>
                                    {s.last_active_at ? new Date(s.last_active_at).toLocaleDateString('en-IN') : 'Never'}
                                </span>
                            </div>
                            {/* Status badge */}
                            <div className="col-span-1 flex justify-end">
                                <Badge className={`text-[9px] font-black px-2 ${s.is_active ? ts.live(isDark) : ts.danger(isDark)}`}>
                                    {s.is_active ? 'ACTIVE' : 'OFF'}
                                </Badge>
                            </div>
                            {/* Toggle */}
                            <div className="col-span-1 flex justify-end">
                                <Switch checked={s.is_active} onCheckedChange={val => onToggleStudent(s.id, val)} className="data-[state=checked]:bg-lime-400 scale-75" />
                            </div>
                        </motion.div>
                    ))}
                    {pagedStudents.length === 0 && (
                        <div className="py-14 text-center">
                            <Users size={28} className={`mx-auto mb-2 ${ts.textMuted(isDark)}`} />
                            <p className={`text-[11px] ${ts.textMuted(isDark)}`}>
                                {studentSearch ? `No students match "${studentSearch}"` : 'No students enrolled'}
                            </p>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {totalStudentPages > 1 && (
                    <div className={`px-6 py-4 border-t ${ts.border(isDark)} flex items-center justify-between`}>
                        <p className={`text-[11px] font-bold ${ts.textMuted(isDark)}`}>
                            {studentsPage * SCHOOL_STUDENT_PAGE_SIZE + 1}–{Math.min((studentsPage + 1) * SCHOOL_STUDENT_PAGE_SIZE, filteredStudents.length)} of {filteredStudents.length}
                        </p>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" disabled={studentsPage === 0} onClick={() => setStudentsPage(studentsPage - 1)}
                                className={`rounded-full h-8 px-3 text-[11px] font-black disabled:opacity-30 ${isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-slate-100 text-slate-700'}`}>
                                <ChevronLeft size={14} className="mr-1" />Prev
                            </Button>
                            <span className={`text-[11px] font-black px-2 ${ts.textMuted(isDark)}`}>{studentsPage + 1}/{totalStudentPages}</span>
                            <Button variant="ghost" size="sm" disabled={studentsPage >= totalStudentPages - 1} onClick={() => setStudentsPage(studentsPage + 1)}
                                className={`rounded-full h-8 px-3 text-[11px] font-black disabled:opacity-30 ${isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-slate-100 text-slate-700'}`}>
                                Next<ChevronRight size={14} className="ml-1" />
                            </Button>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
