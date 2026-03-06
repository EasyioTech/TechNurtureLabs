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
import { Search, Zap, ChevronLeft, ChevronRight, GraduationCap, CheckCircle2, Users, X, Flame, FileDown, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

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
    const router = useRouter();

    const handleExport = () => {
        if (students.length === 0) return;

        const headers = ['Name', 'Email', 'Class', 'XP', 'Level', 'Streak', 'Lessons Completed', 'Status'];
        const csvRows = students.map(s => [
            s.full_name,
            s.email,
            s.class_name || 'N/A',
            s.total_xp,
            s.level,
            s.current_streak,
            s.lessons_completed,
            s.is_active ? 'Active' : 'Deactivated'
        ].map(val => `"${val}"`).join(','));

        const csvContent = [headers.join(','), ...csvRows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `students_roster_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Student roster exported successfully');
    };

    return (
        <div className="space-y-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className={`rounded-[32px] border overflow-hidden ${ts.card(isDark)}`}>

                {/* Header */}
                <div className={`px-8 py-8 border-b ${ts.border(isDark)} flex flex-col lg:flex-row items-start lg:items-center gap-6`}>
                    <div className="flex-1">
                        <h3 className={`font-black text-2xl tracking-tight mb-1 ${ts.textPrimary(isDark)}`}>Student Directory</h3>
                        <p className={`text-[13px] font-bold ${ts.textMuted(isDark)}`}>Managing {students.length} enrolled learners</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                        <div className={`flex items-center rounded-2xl px-5 py-3 gap-3 border w-full sm:w-80 transition-all focus-within:ring-4 focus-within:ring-indigo-500/10 ${isDark ? 'bg-white/[0.03] border-white/5 focus-within:bg-white/[0.05]' : 'bg-slate-50 border-slate-200 focus-within:bg-white focus-within:border-indigo-200'
                            }`}>
                            <Search size={16} className="text-indigo-500" />
                            <input type="text" placeholder="Search by name, email..."
                                value={studentSearch} onChange={e => { setStudentSearch(e.target.value); setStudentsPage(0); }}
                                className={`bg-transparent text-[13px] font-bold outline-none flex-1 placeholder:text-slate-400 dark:placeholder:text-slate-600 ${ts.textPrimary(isDark)}`} />
                            {studentSearch && (
                                <button onClick={() => setStudentSearch('')} className={`p-1 rounded-md hover:bg-slate-200 dark:hover:bg-white/10 transition-colors`}>
                                    <X size={12} className={ts.textMuted(isDark)} />
                                </button>
                            )}
                        </div>

                        <Button
                            onClick={handleExport}
                            className={`rounded-2xl h-12 px-6 font-black text-[13px] ${ts.btnPrimary(isDark)}`}>
                            <FileDown size={16} className="mr-2" />
                            Export Roster
                        </Button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className={`border-b ${ts.border(isDark)} bg-slate-500/[0.02]`}>
                                {['Student', 'Class', 'XP / Level', 'Activity', 'Status', 'Actions'].map((h, i) => (
                                    <th key={h} className={`px-8 py-5 text-[10px] font-black uppercase tracking-widest ${i === 0 ? 'text-left' : 'text-right'} ${ts.textMuted(isDark)}`}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className={ts.divider(isDark)}>
                            {pagedStudents.map((s, i) => (
                                <motion.tr key={s.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.03 }}
                                    className={`group transition-all ${ts.cardHover(isDark)}`}>

                                    {/* Student Info */}
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-[14px] font-black flex-shrink-0 transition-transform group-hover:scale-105 shadow-lg ${isDark ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                                                }`}>
                                                {s.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <p className={`font-black text-[14px] tracking-tight truncate ${ts.textPrimary(isDark)}`}>{s.full_name}</p>
                                                <p className={`text-[11px] font-bold truncate ${ts.textMuted(isDark)}`}>{s.email}</p>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Class */}
                                    <td className="px-8 py-5 text-right">
                                        <Badge className={`px-3 py-1 rounded-full border-0 text-[10px] font-black ${ts.accentSoft(isDark)}`}>
                                            {s.class_name || 'NOT ASSIGNED'}
                                        </Badge>
                                    </td>

                                    {/* Progress */}
                                    <td className="px-8 py-5 text-right">
                                        <div className="inline-flex flex-col items-end">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-[15px] font-black ${ts.textPrimary(isDark)}`}>{s.total_xp.toLocaleString()}</span>
                                                <Zap size={12} className="text-amber-500" fill="currentColor" />
                                            </div>
                                            <p className={`text-[10px] font-black tracking-widest uppercase ${ts.textMuted(isDark)}`}>LEVEL {s.level}</p>
                                        </div>
                                    </td>

                                    {/* Metrics */}
                                    <td className="px-8 py-5 text-right">
                                        <div className="inline-flex flex-col items-end">
                                            <p className={`text-[13px] font-black ${ts.textPrimary(isDark)}`}>{s.lessons_completed} Lessons</p>
                                            <p className="text-[11px] font-bold text-orange-500 flex items-center gap-1">
                                                <Flame size={12} /> {s.current_streak}d streak
                                            </p>
                                        </div>
                                    </td>

                                    {/* Status */}
                                    <td className="px-8 py-5 text-right">
                                        <Badge className={`px-3 py-1 rounded-full border-0 text-[10px] font-black ${s.is_active ? ts.live(isDark) : ts.danger(isDark)}`}>
                                            {s.is_active ? 'ACTIVE' : 'DEACTIVATED'}
                                        </Badge>
                                    </td>

                                    {/* Actions */}
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <Switch
                                                checked={s.is_active}
                                                onCheckedChange={val => onToggleStudent(s.id, val)}
                                                className="data-[state=checked]:bg-indigo-500 scale-90"
                                            />
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => router.push(`/school-admin/student/${s.id}`)}
                                                className={`w-9 h-9 rounded-xl ${ts.btnOutline(isDark)} border-0`}>
                                                <ExternalLink size={18} />
                                            </Button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>

                    {pagedStudents.length === 0 && (
                        <div className="py-24 text-center">
                            <div className={`w-16 h-16 rounded-3xl mx-auto mb-4 flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
                                <Users size={32} className={ts.textMuted(isDark)} />
                            </div>
                            <h4 className={`text-lg font-black mb-1 ${ts.textPrimary(isDark)}`}>No students found</h4>
                            <p className={`text-[13px] font-bold ${ts.textMuted(isDark)}`}>Try adjusting your search filters</p>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {totalStudentPages > 1 && (
                    <div className={`px-8 py-6 border-t ${ts.border(isDark)} flex items-center justify-between bg-slate-500/[0.01]`}>
                        <p className={`text-[12px] font-bold ${ts.textMuted(isDark)}`}>
                            Showing <span className={ts.textPrimary(isDark)}>{studentsPage * SCHOOL_STUDENT_PAGE_SIZE + 1}–{Math.min((studentsPage + 1) * SCHOOL_STUDENT_PAGE_SIZE, filteredStudents.length)}</span> of {filteredStudents.length} learners
                        </p>
                        <div className="flex items-center gap-3">
                            <Button variant="ghost" size="sm" disabled={studentsPage === 0} onClick={() => setStudentsPage(studentsPage - 1)}
                                className={`rounded-xl h-10 px-4 text-[12px] font-black transition-all ${ts.btnOutline(isDark)} disabled:opacity-30`}>
                                <ChevronLeft size={16} className="mr-2" /> Previous
                            </Button>
                            <div className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-black text-[12px] ${isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
                                {studentsPage + 1} <span className="opacity-30 mx-1">/</span> {totalStudentPages}
                            </div>
                            <Button variant="ghost" size="sm" disabled={studentsPage >= totalStudentPages - 1} onClick={() => setStudentsPage(studentsPage + 1)}
                                className={`rounded-xl h-10 px-4 text-[12px] font-black transition-all ${ts.btnOutline(isDark)} disabled:opacity-30`}>
                                Next <ChevronRight size={16} className="ml-2" />
                            </Button>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
