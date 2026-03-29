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
    totalStudentsCount: number;
    pagedStudents: SchoolStudentMetric[];
    totalStudentPages: number;
    studentsPage: number;
    setStudentsPage: (p: number) => void;
    studentSearch: string;
    setStudentSearch: (s: string) => void;
    onToggleStudent: (id: string, active: boolean) => void;
    studentsLoading?: boolean;
}

export function SchoolStudentsTab({
    totalStudentsCount, pagedStudents, totalStudentPages,
    studentsPage, setStudentsPage, studentSearch, setStudentSearch, onToggleStudent,
    studentsLoading = false
}: StudentsTabProps) {
    const { isDark } = useSchoolTheme();
    const router = useRouter();

    const handleExport = () => {
        if (pagedStudents.length === 0) return;
        // In a real app we would fetch all for export, but for now export current page

        const headers = ['Name', 'Email', 'Class', 'XP', 'Level', 'Streak', 'Lessons Completed', 'Status'];
        const csvRows = pagedStudents.map(s => [
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
                <div className={`px-10 py-10 border-b ${ts.border(isDark)} flex flex-col xl:flex-row items-start xl:items-center gap-8`}>
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                             <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-lg shadow-indigo-500/5' : 'bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm'}`}>
                                <Users size={20} strokeWidth={2.5} />
                            </div>
                            <h3 className={`font-black text-2xl tracking-tight leading-none ${ts.textPrimary(isDark)}`}>Student Directory</h3>
                        </div>
                        <p className={`text-[13px] font-bold ${ts.textMuted(isDark)} ml-1.5`}>
                            {studentsLoading ? 'Refreshing database...' : `Managing ${totalStudentsCount.toLocaleString()} enrolled learners across all classes`}
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
                        <div className={`flex items-center rounded-2xl px-6 py-3.5 gap-4 border w-full sm:w-96 transition-all focus-within:ring-4 focus-within:ring-indigo-500/10 ${isDark ? 'bg-white/[0.03] border-white/5 focus-within:bg-white/[0.05]' : 'bg-slate-50 border-slate-200 focus-within:bg-white focus-within:border-indigo-200'
                            }`}>
                            <Search size={18} className="text-indigo-500" strokeWidth={2.5} />
                            <input type="text" placeholder="Search by name, email or ID..."
                                value={studentSearch} onChange={e => { setStudentSearch(e.target.value); setStudentsPage(0); }}
                                className={`bg-transparent text-[14px] font-black outline-none flex-1 placeholder:text-slate-400 dark:placeholder:text-slate-600 ${ts.textPrimary(isDark)} whitespace-nowrap overflow-hidden text-ellipsis`} />
                            {studentSearch && (
                                <button onClick={() => setStudentSearch('')} className={`p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 transition-colors`}>
                                    <X size={14} className={ts.textMuted(isDark)} />
                                </button>
                            )}
                        </div>

                        <Button
                            onClick={handleExport}
                            className={`rounded-2xl h-[52px] px-8 font-black text-[13px] tracking-tight transition-all duration-300 w-full sm:w-auto ${isDark ? 'bg-white/5 text-slate-100 border border-white/10 hover:bg-white/10' : 'bg-white text-slate-800 border-2 border-slate-100 hover:border-slate-200 shadow-sm'}`}>
                            <FileDown size={18} className="mr-2" />
                            EXPORT DATA
                        </Button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className={`border-b ${ts.border(isDark)} bg-slate-500/[0.02]`}>
                                <th className={`px-4 sm:px-8 py-5 text-[10px] font-black uppercase tracking-widest text-left ${ts.textMuted(isDark)}`}>Student</th>
                                <th className={`hidden sm:table-cell px-8 py-5 text-[10px] font-black uppercase tracking-widest text-right ${ts.textMuted(isDark)}`}>Class</th>
                                <th className={`px-4 sm:px-8 py-5 text-[10px] font-black uppercase tracking-widest text-right ${ts.textMuted(isDark)}`}>Growth</th>
                                <th className={`hidden md:table-cell px-8 py-5 text-[10px] font-black uppercase tracking-widest text-right ${ts.textMuted(isDark)}`}>Activity</th>
                                <th className={`hidden sm:table-cell px-8 py-5 text-[10px] font-black uppercase tracking-widest text-right ${ts.textMuted(isDark)}`}>Status</th>
                                <th className={`px-4 sm:px-8 py-5 text-[10px] font-black uppercase tracking-widest text-right ${ts.textMuted(isDark)}`}></th>
                            </tr>
                        </thead>
                        <tbody className={`${ts.divider(isDark)} ${studentsLoading ? 'opacity-50' : ''}`}>
                            {pagedStudents.map((s, i) => (
                                <motion.tr key={s.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.03 }}
                                    className={`group transition-all ${ts.cardHover(isDark)}`}>
                                    
                                    {/* Student Info */}
                                    <td className="px-4 sm:px-8 py-6">
                                        <div className="flex items-center gap-4 group/item">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-[15px] font-black flex-shrink-0 transition-transform group-hover/item:scale-105 shadow-xl ${isDark ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-black/20' : 'bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-indigo-100/30'
                                                }`}>
                                                {s.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <p className={`font-black text-[15px] tracking-tight truncate leading-none mb-1.5 ${ts.textPrimary(isDark)}`}>{s.full_name}</p>
                                                <p className={`text-[11px] font-bold truncate opacity-50 ${ts.textPrimary(isDark)}`}>
                                                    {s.email || s.phone || 'No contact'}
                                                </p>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Class */}
                                    <td className="hidden sm:table-cell px-8 py-6 text-right">
                                        <Badge className={`px-4 py-1.5 rounded-lg border-0 text-[10px] font-black tracking-widest uppercase ${ts.accentSoft(isDark)}`}>
                                            {s.class_name || 'PENDING'}
                                        </Badge>
                                    </td>

                                    {/* Progress */}
                                    <td className="px-4 sm:px-8 py-6 text-right">
                                        <div className="inline-flex flex-col items-end">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-[16px] font-black tracking-tight ${ts.textPrimary(isDark)}`}>{(s.total_xp || 0).toLocaleString()}</span>
                                                <Zap size={14} className="text-amber-500" fill="currentColor" strokeWidth={2.5} />
                                            </div>
                                            <p className={`text-[10px] font-black tracking-[0.2em] uppercase opacity-40 ${ts.textPrimary(isDark)}`}>LVL {s.level || 1}</p>
                                        </div>
                                    </td>

                                    {/* Metrics */}
                                    <td className="hidden md:table-cell px-8 py-6 text-right">
                                        <div className="inline-flex flex-col items-end gap-1.5">
                                            <p className={`text-[13px] font-black leading-none ${ts.textPrimary(isDark)}`}>{s.lessons_completed || 0} Lessons</p>
                                            <Badge variant="outline" className="text-[10px] font-bold text-orange-500 flex items-center gap-1 bg-orange-500/5 border-orange-500/20 py-0 h-5">
                                                <Flame size={12} fill="currentColor" /> {s.current_streak || 0}d streak
                                            </Badge>
                                        </div>
                                    </td>

                                    {/* Status */}
                                    <td className="hidden sm:table-cell px-8 py-6 text-right">
                                        <Badge className={`px-4 py-1 rounded-md border-0 text-[10px] font-black tracking-widest ${s.is_active ? ts.live(isDark) : ts.danger(isDark)}`}>
                                            {s.is_active ? 'ACTIVE' : 'LOCKED'}
                                        </Badge>
                                    </td>

                                    {/* Actions */}
                                    <td className="px-4 sm:px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-4">
                                            <div className="hidden xs:block">
                                                <Switch
                                                    checked={s.is_active}
                                                    onCheckedChange={val => onToggleStudent(s.id, val)}
                                                    className="data-[state=checked]:bg-indigo-500 scale-90"
                                                />
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => router.push(`/school-admin/student/${s.id}`)}
                                                className={`w-11 h-11 rounded-xl border transition-all ${isDark ? 'bg-white/5 border-white/5 text-slate-400 hover:bg-indigo-500 hover:text-white hover:border-indigo-500' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-indigo-600'}`}>
                                                <ChevronRight size={18} strokeWidth={2.5} />
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
                            Showing <span className={ts.textPrimary(isDark)}>{studentsPage * SCHOOL_STUDENT_PAGE_SIZE + 1}–{Math.min((studentsPage + 1) * SCHOOL_STUDENT_PAGE_SIZE, totalStudentsCount)}</span> of {totalStudentsCount} learners
                        </p>
                        <div className="flex items-center gap-3">
                            <Button variant="ghost" size="sm" disabled={studentsPage === 0} onClick={() => setStudentsPage(studentsPage - 1)}
                                className={`rounded-xl h-10 px-4 text-[12px] font-black transition-all border ${isDark ? 'border-white/10 text-slate-100 hover:bg-white/5' : 'border-slate-200 text-slate-700 hover:bg-slate-50'} disabled:opacity-30`}>
                                <ChevronLeft size={16} className="mr-2" /> Previous
                            </Button>
                            <div className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-black text-[12px] ${isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
                                {studentsPage + 1} <span className="opacity-30 mx-1">/</span> {totalStudentPages}
                            </div>
                            <Button variant="ghost" size="sm" disabled={studentsPage >= totalStudentPages - 1} onClick={() => setStudentsPage(studentsPage + 1)}
                                className={`rounded-xl h-10 px-4 text-[12px] font-black transition-all border ${isDark ? 'border-white/10 text-slate-100 hover:bg-white/5' : 'border-slate-200 text-slate-700 hover:bg-slate-50'} disabled:opacity-30`}>
                                Next <ChevronRight size={16} className="ml-2" />
                            </Button>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
