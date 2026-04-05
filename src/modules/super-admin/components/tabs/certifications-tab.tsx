'use client';

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Award, BookOpen, Users, CheckCircle2, Plus, Edit2, Trash2,
    GraduationCap, Eye, Download, XCircle, Search, ChevronRight,
    ArrowLeft, Loader2, ShieldCheck, Clock
} from 'lucide-react';
import { useAdminTheme, t } from '../../theme-context';
import type { CourseWithCert, CompletedStudent, CertificateConfig } from '../../actions/sub-actions/certificate-actions';
import { CertificateDialog } from '../certificate-dialog';
import { CertificatePreview } from '../certificate-preview';

interface CertificationsTabProps {
    courses: CourseWithCert[];
    onRefresh: () => void;
    onSaveCert: (data: any) => Promise<void>;
    onDeleteCert: (id: string) => Promise<void>;
    onFetchStudents: (courseId: string) => Promise<CompletedStudent[]>;
    onIssueCert: (payload: { certificate_id: string; user_id: string; enrollment_id: string }) => Promise<any>;
    onRevokeCert: (userCertId: string) => Promise<void>;
    loading: boolean;
}

export function CertificationsTab({
    courses, onRefresh, onSaveCert, onDeleteCert,
    onFetchStudents, onIssueCert, onRevokeCert, loading,
}: CertificationsTabProps) {
    const { isDark, accent } = useAdminTheme();

    const [selectedCourse, setSelectedCourse] = useState<CourseWithCert | null>(null);
    const [completedStudents, setCompletedStudents] = useState<CompletedStudent[]>([]);
    const [studentsLoading, setStudentsLoading] = useState(false);
    const [search, setSearch] = useState('');

    // Dialog state
    const [showCertDialog, setShowCertDialog] = useState(false);
    const [editingCert, setEditingCert] = useState<Partial<CertificateConfig> | null>(null);

    // Preview state
    const [previewStudent, setPreviewStudent] = useState<CompletedStudent | null>(null);

    const handleSelectCourse = useCallback(async (course: CourseWithCert) => {
        setSelectedCourse(course);
        setStudentsLoading(true);
        try {
            const students = await onFetchStudents(course.id);
            setCompletedStudents(students);
        } finally {
            setStudentsLoading(false);
        }
    }, [onFetchStudents]);

    const handleBack = () => {
        setSelectedCourse(null);
        setCompletedStudents([]);
        setPreviewStudent(null);
    };

    const handleIssue = async (student: CompletedStudent) => {
        if (!selectedCourse?.certificate) return;
        await onIssueCert({
            certificate_id: selectedCourse.certificate.id,
            user_id: student.user_id,
            enrollment_id: student.enrollment_id,
        });
        // Refresh students list
        const updated = await onFetchStudents(selectedCourse.id);
        setCompletedStudents(updated);
    };

    const handleRevoke = async (student: CompletedStudent) => {
        if (!student.certificate_id) return;
        await onRevokeCert(student.certificate_id);
        const updated = await onFetchStudents(selectedCourse!.id);
        setCompletedStudents(updated);
    };

    const filteredStudents = completedStudents.filter(s =>
        (s.full_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (s.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (s.school_name ?? '').toLowerCase().includes(search.toLowerCase())
    );

    const filteredCourses = courses.filter(c =>
        c.title.toLowerCase().includes(search.toLowerCase())
    );

    // ── Course List View ──────────────────────────────────────────────────────
    if (!selectedCourse) {
        return (
            <div className="space-y-6">
                {/* Stats row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Courses', value: courses.length, icon: BookOpen, color: 'sky' },
                        { label: 'Certs Configured', value: courses.filter(c => c.certificate).length, icon: Award, color: 'amber' },
                        { label: 'Total Completions', value: courses.reduce((a, c) => a + c.completed_count, 0), icon: CheckCircle2, color: 'emerald' },
                        { label: 'Total Enrolled', value: courses.reduce((a, c) => a + c.enrolled_count, 0), icon: Users, color: 'violet' },
                    ].map(stat => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`rounded-2xl border p-5 flex items-center gap-4 ${t.card(isDark)}`}
                        >
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${
                                isDark
                                    ? `bg-${stat.color}-400/10 text-${stat.color}-400 border-${stat.color}-400/20`
                                    : `bg-${stat.color}-50 text-${stat.color}-600 border-${stat.color}-100`
                            }`}>
                                <stat.icon size={20} />
                            </div>
                            <div>
                                <p className={`text-2xl font-black tracking-tighter ${t.textPrimary(isDark)}`}>{stat.value}</p>
                                <p className={`text-[10px] font-black uppercase tracking-widest ${t.textMuted(isDark)}`}>{stat.label}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Search */}
                <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${t.card(isDark)}`}>
                    <Search size={16} className={t.textMuted(isDark)} />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search courses..."
                        className={`flex-1 bg-transparent text-sm outline-none font-medium ${t.textPrimary(isDark)} placeholder:${t.textMuted(isDark)}`}
                    />
                </div>

                {/* Course grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-24">
                        <Loader2 className={`animate-spin ${t.textMuted(isDark)}`} size={32} />
                    </div>
                ) : filteredCourses.length === 0 ? (
                    <div className={`rounded-[24px] border flex flex-col items-center justify-center py-24 ${t.card(isDark)}`}>
                        <BookOpen size={40} className={`mb-4 ${t.textMuted(isDark)}`} />
                        <p className={`text-lg font-black ${t.textPrimary(isDark)}`}>No Courses Found</p>
                        <p className={`text-sm mt-1 ${t.textMuted(isDark)}`}>Create courses in the Courses tab first.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filteredCourses.map((course, i) => (
                            <motion.div
                                key={course.id}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }}
                                className={`rounded-[24px] border overflow-hidden flex flex-col transition-all duration-300 group cursor-pointer ${t.card(isDark)} hover:shadow-xl hover:shadow-black/10`}
                                onClick={() => handleSelectCourse(course)}
                            >
                                {/* Thumbnail / Header */}
                                <div className={`relative h-32 flex items-center justify-center overflow-hidden ${isDark ? 'bg-white/[0.03]' : 'bg-slate-50'}`}>
                                    {course.thumbnail_url ? (
                                        <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <BookOpen size={36} className={t.textMuted(isDark)} />
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                    <div className="absolute bottom-3 left-4 right-4">
                                        <p className="text-white font-black text-sm truncate">{course.title}</p>
                                    </div>
                                    {/* Cert badge */}
                                    <div className="absolute top-3 right-3">
                                        {course.certificate ? (
                                            <span className={`flex items-center gap-1 text-[9px] font-black px-2 py-1 rounded-full ${isDark ? 'bg-amber-400/20 text-amber-400 border border-amber-400/20' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                                                <Award size={10} /> CERT ON
                                            </span>
                                        ) : (
                                            <span className={`flex items-center gap-1 text-[9px] font-black px-2 py-1 rounded-full ${t.draft(isDark)}`}>
                                                NO CERT
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="flex-1 p-4 space-y-3">
                                    <div className="flex items-center gap-4 text-xs">
                                        <span className={`flex items-center gap-1.5 font-bold ${t.textMuted(isDark)}`}>
                                            <Users size={12} /> {course.enrolled_count} enrolled
                                        </span>
                                        <span className={`flex items-center gap-1.5 font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                            <CheckCircle2 size={12} /> {course.completed_count} completed
                                        </span>
                                    </div>

                                    {/* Completion bar */}
                                    <div>
                                        <div className={`text-[10px] font-black uppercase tracking-widest mb-1.5 ${t.textMuted(isDark)}`}>
                                            Completion Rate
                                        </div>
                                        <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-neutral-100'}`}>
                                            <div
                                                className="h-full rounded-full bg-emerald-500 transition-all"
                                                style={{ width: `${course.enrolled_count > 0 ? Math.round((course.completed_count / course.enrolled_count) * 100) : 0}%` }}
                                            />
                                        </div>
                                        <p className={`text-[10px] font-bold mt-1 ${t.textMuted(isDark)}`}>
                                            {course.enrolled_count > 0 ? Math.round((course.completed_count / course.enrolled_count) * 100) : 0}%
                                        </p>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className={`px-4 pb-4 flex items-center justify-between`}>
                                    {course.certificate ? (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingCert({ ...course.certificate, course_id: course.id });
                                                setShowCertDialog(true);
                                            }}
                                            className={`h-8 px-3 rounded-xl text-[10px] font-black border ${t.border(isDark)} ${t.btnOutline(isDark)}`}
                                        >
                                            <Edit2 size={12} className="mr-1.5" /> EDIT CERT
                                        </Button>
                                    ) : (
                                        <Button
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingCert({ course_id: course.id });
                                                setShowCertDialog(true);
                                            }}
                                            className={`h-8 px-3 rounded-xl text-[10px] font-black ${t.btnPrimary(isDark, accent)}`}
                                        >
                                            <Plus size={12} className="mr-1.5" /> ADD CERT
                                        </Button>
                                    )}
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className={`h-8 px-3 rounded-xl text-[10px] font-black gap-1 ${t.textMuted(isDark)} hover:opacity-80`}
                                    >
                                        VIEW <ChevronRight size={12} />
                                    </Button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Certificate Config Dialog */}
                <CertificateDialog
                    open={showCertDialog}
                    onOpenChange={(open) => { setShowCertDialog(open); if (!open) setEditingCert(null); }}
                    editingCert={editingCert}
                    setEditingCert={setEditingCert}
                    onSave={async () => {
                        if (!editingCert?.course_id) return;
                        await onSaveCert({
                            ...editingCert,
                            min_progress_pct: editingCert.min_progress_pct ?? 100,
                        });
                        setShowCertDialog(false);
                        setEditingCert(null);
                        onRefresh();
                    }}
                    onDelete={async () => {
                        if (!editingCert?.id) return;
                        await onDeleteCert(editingCert.id);
                        setShowCertDialog(false);
                        setEditingCert(null);
                        onRefresh();
                    }}
                />
            </div>
        );
    }

    // ── Student Detail View ───────────────────────────────────────────────────
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    onClick={handleBack}
                    className={`h-10 w-10 rounded-full p-0 border ${t.border(isDark)} ${t.btnOutline(isDark)}`}
                >
                    <ArrowLeft size={18} />
                </Button>
                <div className="flex-1 min-w-0">
                    <h2 className={`text-xl font-black tracking-tight truncate ${t.textPrimary(isDark)}`}>{selectedCourse.title}</h2>
                    <p className={`text-[11px] font-bold uppercase tracking-widest mt-0.5 ${t.textMuted(isDark)}`}>
                        {selectedCourse.completed_count} students completed · {completedStudents.filter(s => s.certificate_issued).length} certificates issued
                    </p>
                </div>

                {/* Cert status */}
                {selectedCourse.certificate ? (
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => { setEditingCert({ ...selectedCourse.certificate, course_id: selectedCourse.id }); setShowCertDialog(true); }}
                        className={`h-9 px-4 rounded-full text-[10px] font-black border ${t.border(isDark)} ${isDark ? 'bg-amber-400/10 text-amber-400 border-amber-400/20' : 'bg-amber-50 text-amber-700 border-amber-200'}`}
                    >
                        <Award size={14} className="mr-1.5" /> EDIT CERTIFICATE
                    </Button>
                ) : (
                    <Button
                        size="sm"
                        onClick={() => { setEditingCert({ course_id: selectedCourse.id }); setShowCertDialog(true); }}
                        className={`h-9 px-4 rounded-full text-[10px] font-black ${t.btnPrimary(isDark, accent)}`}
                    >
                        <Plus size={14} className="mr-1.5" /> SETUP CERTIFICATE
                    </Button>
                )}
            </div>

            {/* No certificate warning */}
            {!selectedCourse.certificate && (
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-2xl border p-4 flex items-start gap-3 ${isDark ? 'bg-amber-400/5 border-amber-400/20' : 'bg-amber-50 border-amber-200'}`}
                >
                    <Award size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className={`text-sm font-black ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>No certificate configured for this course</p>
                        <p className={`text-[12px] font-medium mt-0.5 ${isDark ? 'text-amber-400/70' : 'text-amber-600'}`}>
                            Set up a certificate above to start issuing them to students who completed this course.
                        </p>
                    </div>
                </motion.div>
            )}

            {/* Search */}
            <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${t.card(isDark)}`}>
                <Search size={16} className={t.textMuted(isDark)} />
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search students by name, email, or school..."
                    className={`flex-1 bg-transparent text-sm outline-none font-medium ${t.textPrimary(isDark)}`}
                />
            </div>

            {/* Students table */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-[24px] border overflow-hidden ${t.card(isDark)}`}
            >
                {/* Table header - Hidden on mobile */}
                <div className={`hidden md:grid grid-cols-12 gap-4 px-6 py-4 border-b ${t.border(isDark)}`}>
                    {[
                        { label: 'Student', span: 'col-span-3' },
                        { label: 'School', span: 'col-span-2' },
                        { label: 'Completed', span: 'col-span-2' },
                        { label: 'Progress', span: 'col-span-1' },
                        { label: 'Status', span: 'col-span-2' },
                        { label: 'Actions', span: 'col-span-2' }
                    ].map(h => (
                        <p key={h.label} className={`text-[10px] font-black uppercase tracking-widest ${t.textMuted(isDark)} ${h.span}`}>
                            {h.label}
                        </p>
                    ))}
                </div>

                {studentsLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className={`animate-spin ${t.textMuted(isDark)}`} size={28} />
                    </div>
                ) : filteredStudents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <GraduationCap size={40} className={`mb-4 ${t.textMuted(isDark)}`} />
                        <p className={`text-base font-black ${t.textPrimary(isDark)}`}>No completions yet</p>
                        <p className={`text-sm mt-1 ${t.textMuted(isDark)}`}>Students who reach 100% progress will appear here.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/[0.06]">
                        {filteredStudents.map((student, i) => (
                            <motion.div
                                key={student.user_id + student.enrollment_id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.03 }}
                                className={`flex flex-col md:grid md:grid-cols-12 gap-4 items-start md:items-center px-6 py-5 md:py-4 transition-all ${t.cardHover(isDark)}`}
                            >
                                {/* Name & Avatar */}
                                <div className="col-span-3 flex items-center gap-3 min-w-0 w-full md:w-auto">
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${isDark ? 'bg-white/[0.08] text-white' : 'bg-neutral-100 text-neutral-700'}`}>
                                        {(student.full_name || 'S').split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className={`text-sm font-black truncate ${t.textPrimary(isDark)}`}>{student.full_name || 'Unknown'}</p>
                                        <p className={`text-[10px] font-medium truncate ${t.textMuted(isDark)}`}>{student.email || '—'}</p>
                                    </div>
                                </div>

                                {/* School - Visible desktop / Subtle mobile */}
                                <div className="col-span-2 min-w-0 md:block">
                                    <p className={`text-[12px] font-bold md:truncate ${t.textMuted(isDark)}`}>
                                        <span className="md:hidden opacity-50 mr-1 text-[10px]">SCHOOL:</span>
                                        {student.school_name}
                                    </p>
                                </div>

                                {/* Completed date */}
                                <div className="col-span-2">
                                    <p className={`text-[11px] font-bold ${t.textMuted(isDark)} flex items-center gap-2`}>
                                        <span className="md:hidden opacity-50 text-[10px]">COMPLETED:</span>
                                        {student.completed_at
                                            ? new Date(student.completed_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                                            : '—'
                                        }
                                    </p>
                                </div>

                                {/* Progress */}
                                <div className="col-span-1 flex items-center gap-2 w-full md:w-auto justify-between md:justify-start">
                                    <span className="md:hidden opacity-50 text-[10px] font-black uppercase tracking-widest">Progress</span>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-12 h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-neutral-100'}`}>
                                            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(100, parseFloat(student.progress_pct))}%` }} />
                                        </div>
                                        <p className={`text-[10px] font-black ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{parseFloat(student.progress_pct).toFixed(0)}%</p>
                                    </div>
                                </div>

                                {/* Status */}
                                <div className="col-span-2 flex items-center justify-between md:justify-start w-full md:w-auto">
                                    <span className="md:hidden opacity-50 text-[10px] font-black uppercase tracking-widest">Status</span>
                                    {student.certificate_issued ? (
                                        <span className={`inline-flex items-center gap-1 text-[9px] font-black px-2.5 py-1 rounded-full ${isDark ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                                            <ShieldCheck size={10} /> ISSUED
                                        </span>
                                    ) : (
                                        <span className={`inline-flex items-center gap-1 text-[9px] font-black px-2.5 py-1 rounded-full ${t.draft(isDark)}`}>
                                            <Clock size={10} /> PENDING
                                        </span>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="col-span-2 flex items-center gap-2 w-full md:w-auto justify-end md:justify-start pt-2 md:pt-0">
                                    <span className="md:hidden flex-1 opacity-50 text-[10px] font-black uppercase tracking-widest">Quick Actions</span>
                                    
                                    {/* Preview / Download */}
                                    <button
                                        title="Preview Certificate"
                                        onClick={() => setPreviewStudent(student)}
                                        className={`w-9 h-9 md:w-8 md:h-8 rounded-xl flex items-center justify-center border transition-all ${t.border(isDark)} ${isDark ? 'hover:bg-white/[0.08] text-slate-400' : 'hover:bg-neutral-50 text-neutral-500'}`}
                                    >
                                        <Eye size={14} />
                                    </button>

                                    {/* Issue / Revoke */}
                                    {student.certificate_issued ? (
                                        <button
                                            title="Revoke Certificate"
                                            onClick={() => handleRevoke(student)}
                                            className={`w-9 h-9 md:w-8 md:h-8 rounded-xl flex items-center justify-center border transition-all border-rose-400/20 text-rose-400 hover:bg-rose-400/10`}
                                        >
                                            <XCircle size={14} />
                                        </button>
                                    ) : (
                                        <button
                                            title="Issue Certificate"
                                            disabled={!selectedCourse.certificate}
                                            onClick={() => handleIssue(student)}
                                            className={`w-9 h-9 md:w-8 md:h-8 rounded-xl flex items-center justify-center border transition-all ${
                                                selectedCourse.certificate
                                                    ? `${isDark ? 'bg-amber-400/10 border-amber-400/20 text-amber-400 hover:bg-amber-400/20' : 'bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100'}`
                                                    : 'opacity-30 cursor-not-allowed border-transparent text-neutral-400'
                                            }`}
                                        >
                                            <Award size={14} />
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </motion.div>

            {/* Certificate Config Dialog */}
            <CertificateDialog
                open={showCertDialog}
                onOpenChange={(open) => { setShowCertDialog(open); if (!open) setEditingCert(null); }}
                editingCert={editingCert}
                setEditingCert={setEditingCert}
                onSave={async () => {
                    if (!editingCert?.course_id) return;
                    await onSaveCert({
                        ...editingCert,
                        min_progress_pct: editingCert.min_progress_pct ?? 100,
                    });
                    setShowCertDialog(false);
                    setEditingCert(null);
                    onRefresh();
                }}
                onDelete={async () => {
                    if (!editingCert?.id) return;
                    await onDeleteCert(editingCert.id);
                    setShowCertDialog(false);
                    setEditingCert(null);
                    onRefresh();
                }}
            />

            {/* Certificate Preview Modal */}
            <AnimatePresence>
                {previewStudent && selectedCourse && (
                    <CertificatePreview
                        student={previewStudent}
                        course={selectedCourse}
                        onClose={() => setPreviewStudent(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
