'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, ShieldCheck, Clock, HardDrive, Database, Users,
    IndianRupee, Server, AlertCircle, RotateCcw, CheckCircle2,
    BookOpen, Award, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAdminTheme, t } from '../../../theme-context';
import { formatDistanceToNow, format } from 'date-fns';

interface BackupDetailViewProps {
    backup: any;
    previewData: any;
    isLoading: boolean;
    isRestoring: boolean;
    onRestore: (schoolId?: string) => void;
    onBack: () => void;
}

export function BackupDetailView({
    backup,
    previewData,
    isLoading,
    isRestoring,
    onRestore,
    onBack
}: BackupDetailViewProps) {
    const { isDark, accent } = useAdminTheme();
    const [confirmTarget, setConfirmTarget] = useState<'all' | string | null>(null);
    const [expandedSchool, setExpandedSchool] = useState<string | null>(null);

    if (!backup) return null;

    const fileName = backup.fileName.split('/').pop()?.replace('.json.gz', '') || 'Archive';
    const backupDate = new Date(backup.lastModified || backup.timestamp);
    const fileSize = (backup.size / 1024).toFixed(1);
    const relativeTime = formatDistanceToNow(backupDate, { addSuffix: true });
    const formattedDate = format(backupDate, 'MMM dd, yyyy');
    const formattedTime = format(backupDate, 'hh:mm a');

    const schools = previewData?.schools || (previewData?.students?.length > 0 ? [{
        id: previewData.schoolId,
        name: previewData.school?.name || 'Institutional Node',
        students: previewData.students.length,
        revenue: parseFloat(previewData.metadata?.totalRevenue || '0')
    }] : []);

    return (
        <div className="space-y-8 py-6">
            {/* Top bar with back button */}
            <div className="flex items-center gap-4">
                <Button
                    onClick={onBack}
                    variant="ghost"
                    className={`gap-2 h-10 px-4 rounded-xl font-semibold text-sm ${isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-slate-100 text-slate-900'}`}
                >
                    <ArrowLeft size={18} />
                    Back to Vaults
                </Button>
                <h2 className={`text-2xl font-black ${t.textPrimary(isDark)}`}>{fileName}</h2>
            </div>

            {/* Loading state */}
            {isLoading ? (
                <div className={`p-12 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center space-y-4 ${isDark ? 'border-white/10 bg-white/[0.02]' : 'border-slate-200 bg-slate-50'}`}>
                    <RotateCcw size={40} className={`animate-spin ${isDark ? 'text-white/40' : 'text-slate-300'}`} />
                    <p className={`text-sm font-bold uppercase tracking-widest ${t.textMuted(isDark)}`}>Loading archive contents...</p>
                </div>
            ) : previewData ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* LEFT: Metadata Summary Card */}
                    <div className={`lg:col-span-1 p-6 rounded-3xl border ${isDark ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                        <div className="space-y-6">
                            {/* Header */}
                            <div>
                                <div className={`w-12 h-12 rounded-2xl mb-4 flex items-center justify-center ${isDark ? 'bg-white/10' : 'bg-white shadow-sm'}`}>
                                    <ShieldCheck size={24} className={isDark ? accent.text : 'text-slate-900'} />
                                </div>
                                <h3 className={`text-lg font-black ${t.textPrimary(isDark)}`}>Archive Vault</h3>
                                <p className={`text-xs font-bold uppercase tracking-widest opacity-50 ${t.textMuted(isDark)}`}>Secure Snapshot</p>
                            </div>

                            {/* Metadata items */}
                            <div className="space-y-4">
                                <InfoItem
                                    label="Archive ID"
                                    value={fileName}
                                    isDark={isDark}
                                />
                                <InfoItem
                                    label="Created"
                                    value={`${formattedDate} at ${formattedTime}`}
                                    isDark={isDark}
                                />
                                <InfoItem
                                    label="Created"
                                    value={relativeTime}
                                    isDark={isDark}
                                />
                                <InfoItem
                                    label="Encryption"
                                    value="AES-256 GZIP"
                                    isDark={isDark}
                                />
                                <InfoItem
                                    label="File Size"
                                    value={`${fileSize} KB`}
                                    isDark={isDark}
                                />
                            </div>

                            {/* Stats grid */}
                            <div className={`pt-6 border-t ${t.border(isDark)} grid grid-cols-2 gap-4`}>
                                <StatBox
                                    icon={Server}
                                    label="Nodes"
                                    value="1"
                                    isDark={isDark}
                                />
                                <StatBox
                                    icon={Users}
                                    label="Students"
                                    value={previewData.students?.length?.toString() || '0'}
                                    isDark={isDark}
                                />
                                <StatBox
                                    icon={IndianRupee}
                                    label="Revenue"
                                    value={formatCurrency(parseFloat(previewData.metadata?.totalRevenue || '0'))}
                                    isDark={isDark}
                                />
                                <StatBox
                                    icon={Database}
                                    label="Records"
                                    value={previewData.metadata?.recordCounts?.students?.toString() || '0'}
                                    isDark={isDark}
                                />
                            </div>

                            {/* Global restore button */}
                            <Button
                                onClick={() => setConfirmTarget('all')}
                                disabled={isRestoring}
                                className={`w-full h-12 rounded-xl font-black text-sm uppercase tracking-widest gap-2 shadow-xl ${t.btnPrimary(isDark, accent)}`}
                            >
                                <RotateCcw size={16} />
                                Global Restore
                            </Button>
                        </div>
                    </div>

                    {/* RIGHT: School Nodes */}
                    <div className="lg:col-span-2 space-y-4">
                        <h3 className={`text-lg font-black px-2 ${t.textPrimary(isDark)}`}>School Nodes</h3>

                        {schools.map((school: any) => (
                            <motion.div
                                key={school.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`rounded-2xl border transition-all ${
                                    expandedSchool === school.id
                                        ? isDark
                                            ? 'bg-white/[0.05] border-white/10'
                                            : 'bg-white border-slate-200 shadow-lg'
                                        : isDark
                                        ? 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
                                        : 'bg-slate-50/50 border-slate-100 hover:shadow-md'
                                }`}
                            >
                                {/* Card Header */}
                                <button
                                    onClick={() => setExpandedSchool(expandedSchool === school.id ? null : school.id)}
                                    className="w-full p-4 sm:p-6 flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-white/5' : 'bg-white shadow-sm'}`}>
                                            <Server size={20} className={isDark ? accent.text : 'text-slate-900'} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className={`text-sm sm:text-base font-black truncate ${t.textPrimary(isDark)}`}>
                                                {school.name}
                                            </h4>
                                            <div className="flex items-center gap-3 mt-1.5 text-xs opacity-60 overflow-hidden">
                                                <span className="flex items-center gap-1 shrink-0">
                                                    <Users size={12} />
                                                    {school.students} Students
                                                </span>
                                                <span className="flex items-center gap-1 shrink-0">
                                                    <IndianRupee size={12} />
                                                    ₹{formatCurrency(school.revenue)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <Badge className={`ml-2 shrink-0 ${expandedSchool === school.id ? (isDark ? 'bg-white/20' : 'bg-slate-200') : (isDark ? 'bg-white/10' : 'bg-slate-100')}`}>
                                        {expandedSchool === school.id ? 'Collapse' : 'Details'}
                                    </Badge>
                                </button>

                                {/* Expanded Content */}
                                <AnimatePresence>
                                    {expandedSchool === school.id && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className={`border-t overflow-hidden ${isDark ? 'border-white/5' : 'border-slate-100'}`}
                                        >
                                            <div className="p-4 sm:p-6 space-y-4">
                                                {/* Admin info */}
                                                {previewData.schoolAdmin && (
                                                    <div className={`p-4 rounded-lg ${isDark ? 'bg-white/5' : 'bg-white'}`}>
                                                        <p className={`text-xs font-bold uppercase tracking-widest ${t.textMuted(isDark)}`}>Admin</p>
                                                        <p className={`text-sm font-black mt-1 ${t.textPrimary(isDark)}`}>
                                                            {previewData.schoolAdmin.first_name} {previewData.schoolAdmin.last_name}
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Subscription info */}
                                                {previewData.subscription && (
                                                    <div className={`p-4 rounded-lg ${isDark ? 'bg-white/5' : 'bg-white'}`}>
                                                        <p className={`text-xs font-bold uppercase tracking-widest ${t.textMuted(isDark)}`}>Subscription</p>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <Badge className={isDark ? 'bg-blue-500/20 text-blue-300 border-0' : 'bg-blue-50 text-blue-700 border-0'}>
                                                                {previewData.paymentPlan?.name || 'Premium'}
                                                            </Badge>
                                                            {previewData.subscription?.status && (
                                                                <Badge className={previewData.subscription.status === 'active' ? (isDark ? 'bg-emerald-500/20 text-emerald-300 border-0' : 'bg-emerald-50 text-emerald-700 border-0') : (isDark ? 'bg-red-500/20 text-red-300 border-0' : 'bg-red-50 text-red-700 border-0')}>
                                                                    {previewData.subscription.status}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Record counts grid */}
                                                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                                    <RecordBox label="Academic Records" value={previewData.metadata?.recordCounts?.academicRecords} icon={BookOpen} isDark={isDark} />
                                                    <RecordBox label="Quiz Attempts" value={previewData.metadata?.recordCounts?.quizAttempts} icon={Zap} isDark={isDark} />
                                                    <RecordBox label="Achievements" value={previewData.metadata?.recordCounts?.achievements} icon={Award} isDark={isDark} />
                                                    <RecordBox label="Invoices" value={previewData.metadata?.recordCounts?.invoices} icon={IndianRupee} isDark={isDark} />
                                                </div>

                                                {/* Coverage badges */}
                                                <div className="pt-4 border-t" style={{ borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#e2e8f0' }}>
                                                    <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${t.textMuted(isDark)}`}>Coverage</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {previewData.coverage?.academic && <Badge className={isDark ? 'bg-purple-500/20 text-purple-300 border-0' : 'bg-purple-50 text-purple-700 border-0'}>Academic</Badge>}
                                                        {previewData.coverage?.enrollments && <Badge className={isDark ? 'bg-blue-500/20 text-blue-300 border-0' : 'bg-blue-50 text-blue-700 border-0'}>Enrollments</Badge>}
                                                        {previewData.coverage?.billing && <Badge className={isDark ? 'bg-green-500/20 text-green-300 border-0' : 'bg-green-50 text-green-700 border-0'}>Billing</Badge>}
                                                        {previewData.coverage?.quizzes && <Badge className={isDark ? 'bg-orange-500/20 text-orange-300 border-0' : 'bg-orange-50 text-orange-700 border-0'}>Quizzes</Badge>}
                                                    </div>
                                                </div>

                                                {/* Restore button */}
                                                <Button
                                                    onClick={() => setConfirmTarget(school.id)}
                                                    disabled={isRestoring}
                                                    className={`w-full h-11 rounded-lg font-bold text-sm uppercase tracking-widest gap-2 ${isDark ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30' : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'}`}
                                                >
                                                    <RotateCcw size={14} />
                                                    Restore School
                                                </Button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}
                    </div>
                </div>
            ) : null}

            {/* Confirmation Overlay */}
            <AnimatePresence>
                {confirmTarget && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className={`max-w-md w-full p-6 sm:p-8 rounded-2xl border ${isDark ? 'bg-neutral-900 border-white/10' : 'bg-white border-slate-200'}`}
                        >
                            <AlertCircle size={40} className="text-rose-500 mb-4" />
                            <h4 className={`text-lg font-black mb-2 ${t.textPrimary(isDark)}`}>Confirm Restore</h4>
                            <p className={`text-sm font-bold leading-relaxed mb-6 ${t.textMuted(isDark)}`}>
                                {confirmTarget === 'all'
                                    ? 'Restoring the entire system will rewrite all existing database paths. This action is irreversible and audited. Do you wish to proceed?'
                                    : 'Restoring this school will update existing data or recover deleted content. This cannot be undone immediately. Proceed?'}
                            </p>

                            <div className="grid grid-cols-2 gap-3">
                                <Button
                                    variant="ghost"
                                    onClick={() => setConfirmTarget(null)}
                                    className="h-11 rounded-lg font-bold text-sm uppercase tracking-widest"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={() => {
                                        onRestore(confirmTarget === 'all' ? undefined : confirmTarget);
                                        setConfirmTarget(null);
                                    }}
                                    disabled={isRestoring}
                                    className="h-11 rounded-lg font-bold text-sm uppercase tracking-widest bg-rose-600 hover:bg-rose-700 text-white border-0 shadow-lg"
                                >
                                    {isRestoring ? (
                                        <>
                                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        </>
                                    ) : (
                                        'Confirm Restore'
                                    )}
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function InfoItem({ label, value, isDark }: { label: string; value: string; isDark: boolean }) {
    return (
        <div>
            <p className={`text-xs font-bold uppercase tracking-widest opacity-50 ${t.textMuted(isDark)}`}>{label}</p>
            <p className={`text-sm font-bold mt-1 truncate ${t.textPrimary(isDark)}`}>{value}</p>
        </div>
    );
}

function StatBox({ icon: Icon, label, value, isDark }: { icon: any; label: string; value: string; isDark: boolean }) {
    return (
        <div className={`p-3 rounded-lg ${isDark ? 'bg-white/5' : 'bg-white'}`}>
            <Icon size={16} className={`mb-1.5 ${isDark ? 'text-white/40' : 'text-slate-300'}`} />
            <p className={`text-[10px] font-black uppercase tracking-widest ${t.textMuted(isDark)}`}>{label}</p>
            <p className={`text-sm font-black mt-1 ${t.textPrimary(isDark)}`}>{value}</p>
        </div>
    );
}

function RecordBox({ icon: Icon, label, value, isDark }: { icon: any; label: string; value?: number; isDark: boolean }) {
    return (
        <div className={`p-3 rounded-lg flex items-start gap-2 ${isDark ? 'bg-white/5' : 'bg-white'}`}>
            <Icon size={14} className={`flex-shrink-0 mt-0.5 ${isDark ? 'text-white/40' : 'text-slate-400'}`} />
            <div className="flex-1 min-w-0">
                <p className={`text-[9px] font-black uppercase tracking-widest ${t.textMuted(isDark)}`}>{label}</p>
                <p className={`text-xs font-black mt-1 ${t.textPrimary(isDark)}`}>{value?.toLocaleString() || '0'}</p>
            </div>
        </div>
    );
}

function formatCurrency(val: number) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(val);
}
