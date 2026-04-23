'use client';

import React, { useState, useMemo } from 'react';
import {
    ArrowLeft, ShieldCheck, Clock, HardDrive, Database, Users,
    IndianRupee, Server, AlertCircle, RotateCcw, CheckCircle2,
    BookOpen, Award, Zap, Search, CreditCard, Calendar, GraduationCap,
    Globe, Mail, Phone, MapPin, Link as LinkIcon, Code2, TrendingUp
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
    onSelectNode?: (fileName: string) => void;
}

type TabType = 'nodes' | 'overview' | 'students' | 'billing' | 'classes';

export function BackupDetailView({
    backup,
    previewData,
    isLoading,
    isRestoring,
    onRestore,
    onBack,
    onSelectNode
}: BackupDetailViewProps) {
    const { isDark, accent } = useAdminTheme();
    const [activeTab, setActiveTab] = useState<TabType>(backup.type === 'system-wide' ? 'nodes' : 'overview');
    const [confirmTarget, setConfirmTarget] = useState<'all' | string | null>(null);
    const [studentSearch, setStudentSearch] = useState('');
    const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

    if (!backup) return null;

    const fileName = backup.fileName.split('/').pop()?.replace('.json.gz', '') || 'Archive';
    const backupDate = new Date(backup.lastModified || backup.timestamp);
    const fileSize = (backup.size / 1024).toFixed(1);
    const relativeTime = formatDistanceToNow(backupDate, { addSuffix: true });
    const formattedDate = format(backupDate, 'MMM dd, yyyy');
    const formattedTime = format(backupDate, 'hh:mm a');

    const filteredStudents = useMemo(() => {
        if (!previewData?.students) return [];
        return previewData.students.filter((s: any) =>
            `${s.first_name} ${s.last_name}`.toLowerCase().includes(studentSearch.toLowerCase()) ||
            s.email.toLowerCase().includes(studentSearch.toLowerCase())
        );
    }, [previewData?.students, studentSearch]);

    const maxXp = useMemo(() => {
        if (!previewData?.students) return 0;
        return Math.max(...previewData.students.map((s: any) => s.cumulative_xp || 0), 1);
    }, [previewData?.students]);

    const getTierColor = (tier: string, isDark: boolean) => {
        const colors: Record<string, string> = {
            bronze: isDark ? 'bg-amber-900/20 text-amber-300 border-amber-700' : 'bg-amber-50 text-amber-700 border-amber-200',
            silver: isDark ? 'bg-slate-600/20 text-slate-200 border-slate-500' : 'bg-slate-100 text-slate-700 border-slate-300',
            gold: isDark ? 'bg-yellow-900/20 text-yellow-300 border-yellow-700' : 'bg-yellow-50 text-yellow-700 border-yellow-200',
            platinum: isDark ? 'bg-cyan-900/20 text-cyan-300 border-cyan-700' : 'bg-cyan-50 text-cyan-700 border-cyan-200'
        };
        return colors[tier] || colors.bronze;
    };

    const formatCurrency = (val: number | string) => {
        const num = typeof val === 'string' ? parseFloat(val) : val;
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(num);
    };

    return (
        <div className="space-y-8 py-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button
                        onClick={onBack}
                        variant="ghost"
                        className={`gap-2 h-10 px-4 rounded-xl font-semibold text-sm ${isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-slate-100 text-slate-900'}`}
                    >
                        <ArrowLeft size={18} />
                        Back
                    </Button>
                    <h2 className={`text-2xl font-black ${t.textPrimary(isDark)}`}>{fileName}</h2>
                    <span className={`text-xs font-bold ${t.textMuted(isDark)}`}>{relativeTime}</span>
                </div>
            </div>

            {/* Tabs */}
            <div className="relative">
                <div className={`flex gap-2 border-b overflow-x-auto no-scrollbar scroll-smooth ${isDark ? 'border-white/5' : 'border-slate-200'}`}>
                    {(backup.type === 'system-wide'
                        ? ['nodes', 'overview', 'students', 'billing', 'classes']
                        : ['overview', 'students', 'billing', 'classes']
                    ).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as TabType)}
                            className={`px-4 py-3 font-bold text-[10px] sm:text-sm uppercase tracking-widest transition-all relative whitespace-nowrap ${
                                activeTab === tab
                                    ? isDark
                                        ? `text-white`
                                        : `text-slate-900`
                                    : isDark
                                    ? `text-white/50 hover:text-white/70`
                                    : `text-slate-400 hover:text-slate-600`
                            }`}
                        >
                            <span className="flex items-center gap-2">
                                {tab === 'nodes' && <Database size={16} />}
                                {tab === 'overview' && <ShieldCheck size={16} />}
                                {tab === 'students' && <Users size={16} />}
                                {tab === 'billing' && <CreditCard size={16} />}
                                {tab === 'classes' && <GraduationCap size={16} />}
                                {tab}
                            </span>
                            {activeTab === tab && (
                                <div
                                    className={`absolute bottom-0 left-0 right-0 h-1 ${accent.bg}`}
                                />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            {activeTab === 'nodes' && backup.nodes && (
                <NodesTab 
                    nodes={backup.nodes} 
                    isDark={isDark} 
                    accent={accent} 
                    onSelect={(node: any) => {
                        if (onSelectNode) onSelectNode(node.fileName);
                        setActiveTab('overview');
                    }}
                    currentFileName={previewData?.fileName || ''}
                />
            )}

            {isLoading ? (
                <LoadingState isDark={isDark} />
            ) : previewData ? (
                <>
                    {activeTab === 'overview' && (
                        previewData 
                            ? <OverviewTab previewData={previewData} isDark={isDark} accent={accent} isRestoring={isRestoring} onRestore={onRestore} setConfirmTarget={setConfirmTarget} formatCurrency={formatCurrency} formattedDate={formattedDate} formattedTime={formattedTime} fileSize={fileSize} />
                            : <BatchOverviewTab backup={backup} isDark={isDark} />
                    )}
                    {activeTab === 'students' && <StudentsTab previewData={previewData} isDark={isDark} studentSearch={studentSearch} setStudentSearch={setStudentSearch} filteredStudents={filteredStudents} expandedStudent={expandedStudent} setExpandedStudent={setExpandedStudent} maxXp={maxXp} getTierColor={getTierColor} />}
                    {activeTab === 'billing' && <BillingTab previewData={previewData} isDark={isDark} formatCurrency={formatCurrency} />}
                    {activeTab === 'classes' && <ClassesTab previewData={previewData} isDark={isDark} />}
                </>
            ) : activeTab !== 'nodes' && (
                <div className={`p-8 sm:p-12 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center space-y-4 ${isDark ? 'border-white/10 bg-neutral-900/40' : 'border-slate-200 bg-slate-50'}`}>
                    <AlertCircle size={40} className={`opacity-20 ${isDark ? 'text-white' : 'text-slate-900'}`} />
                    <p className={`text-[10px] sm:text-xs text-center font-bold uppercase tracking-widest ${t.textMuted(isDark)}`}>Select a node from the Nodes tab to view details</p>
                </div>
            )}

            {/* Confirmation Overlay */}
                {confirmTarget && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    >
                        <div
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
                        </div>
                    </div>
                )}
        </div>
    );
}

// ==================== TAB COMPONENTS ====================

function BatchOverviewTab({ backup, isDark }: { backup: any; isDark: boolean }) {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatBox icon={Server} label="Institutional Nodes" value={backup.nodeCount} isDark={isDark} color="indigo" />
                <StatBox icon={Users} label="Total Enrollment" value={backup.studentCount} isDark={isDark} color="purple" />
                <StatBox icon={IndianRupee} label="Batch Revenue" value={new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(backup.revenueTotal || 0)} isDark={isDark} color="emerald" />
            </div>
            
            <Card isDark={isDark} title="System-Wide Session Details">
                <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-dashed border-white/5">
                        <span className={`text-xs uppercase font-bold opacity-50 ${t.textMuted(isDark)}`}>Batch ID</span>
                        <span className={`text-xs font-mono font-bold ${t.textPrimary(isDark)}`}>{backup.id}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-dashed border-white/5">
                        <span className={`text-xs uppercase font-bold opacity-50 ${t.textMuted(isDark)}`}>Vault Status</span>
                        <Badge className={`${isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-50 text-emerald-700'}`}>INTEGRITY VERIFIED</Badge>
                    </div>
                    <div className="flex justify-between items-center py-2">
                        <span className={`text-xs uppercase font-bold opacity-50 ${t.textMuted(isDark)}`}>Storage Footprint</span>
                        <span className={`text-xs font-bold ${t.textPrimary(isDark)}`}>{(backup.size / 1024).toFixed(1)} KB (Compressed)</span>
                    </div>
                </div>
            </Card>
        </div>
    );
}

function LoadingState({ isDark }: { isDark: boolean }) {
    return (
        <div className={`p-8 sm:p-12 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center space-y-4 ${isDark ? 'border-white/10 bg-neutral-900/40' : 'border-slate-200 bg-slate-50'}`}>
            <RotateCcw size={40} className={`animate-spin ${isDark ? 'text-white/40' : 'text-slate-300'}`} />
            <p className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest ${t.textMuted(isDark)}`}>Loading backup data...</p>
        </div>
    );
}

function OverviewTab({ previewData, isDark, accent, isRestoring, onRestore, setConfirmTarget, formatCurrency, formattedDate, formattedTime, fileSize }: any) {
    return (
        <div className="space-y-6">
            {/* School Info */}
            <Card isDark={isDark} title="School Information">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InfoRow label="School Name" value={previewData.school?.name} isDark={isDark} />
                    <InfoRow label="Email" value={previewData.school?.email} isDark={isDark} icon={Mail} />
                    <InfoRow label="Phone" value={previewData.school?.phone || '—'} isDark={isDark} icon={Phone} />
                    <InfoRow label="Website" value={previewData.school?.website || '—'} isDark={isDark} icon={LinkIcon} />
                    <InfoRow label="Location" value={`${previewData.school?.city || '—'}, ${previewData.school?.state || '—'} ${previewData.school?.country || '—'}`} isDark={isDark} icon={MapPin} />
                    <InfoRow label="UDISE Code" value={previewData.school?.udise_code || '—'} isDark={isDark} icon={Code2} />
                </div>
            </Card>

            {/* Admin & Subscription */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Admin */}
                <Card isDark={isDark} title="Admin">
                    <div className="space-y-4">
                        <InfoRow label="Name" value={`${previewData.schoolAdmin?.first_name} ${previewData.schoolAdmin?.last_name}`} isDark={isDark} />
                        <InfoRow label="Email" value={previewData.schoolAdmin?.email} isDark={isDark} />
                    </div>
                </Card>

                {/* Subscription */}
                <Card isDark={isDark} title="Subscription">
                    <div className="space-y-4">
                        <InfoRow label="Plan" value={previewData.paymentPlan?.name || 'N/A'} isDark={isDark} />
                        <div>
                            <p className={`text-xs font-bold uppercase opacity-50 ${t.textMuted(isDark)}`}>Status</p>
                            <div className="mt-2">
                                <Badge className={getStatusColor(previewData.subscription?.status, isDark)}>
                                    {previewData.subscription?.status || 'N/A'}
                                </Badge>
                            </div>
                        </div>
                        <InfoRow label="Billing Cycle" value={previewData.paymentPlan?.billing_cycle || 'N/A'} isDark={isDark} />
                        <InfoRow label="Price" value={formatCurrency(previewData.paymentPlan?.price || '0')} isDark={isDark} />
                        <InfoRow label="Max Students" value={previewData.paymentPlan?.max_students || 'Unlimited'} isDark={isDark} />
                        {previewData.subscription?.current_period_start && (
                            <InfoRow label="Period" value={`${format(new Date(previewData.subscription.current_period_start), 'MMM d')} - ${format(new Date(previewData.subscription.current_period_end), 'MMM d, yyyy')}`} isDark={isDark} />
                        )}
                    </div>
                </Card>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
                <StatBox icon={Users} label="Students" value={previewData.students?.length || 0} isDark={isDark} color="indigo" />
                <StatBox icon={Zap} label="XP Dist." value={(previewData.metadata?.totalXpDistributed || 0).toLocaleString()} isDark={isDark} color="purple" />
                <StatBox icon={IndianRupee} label="Revenue" value={formatCurrency(previewData.metadata?.totalRevenue || 0)} isDark={isDark} color="emerald" />
                <StatBox icon={BookOpen} label="Acad. Logs" value={previewData.metadata?.recordCounts?.academicRecords || 0} isDark={isDark} color="blue" />
                <StatBox icon={Award} label="Quiz Try" value={previewData.metadata?.recordCounts?.quizAttempts || 0} isDark={isDark} color="amber" />
                <StatBox icon={TrendingUp} label="Achievements" value={previewData.metadata?.recordCounts?.achievements || 0} isDark={isDark} color="rose" />
            </div>

            {/* Record Counts */}
            <Card isDark={isDark} title="Record Counts">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    <RecordCountBox label="Students" value={previewData.metadata?.recordCounts?.students} isDark={isDark} />
                    <RecordCountBox label="Sessions" value={previewData.metadata?.recordCounts?.academicSessions} isDark={isDark} />
                    <RecordCountBox label="Classes" value={previewData.metadata?.recordCounts?.classMappings} isDark={isDark} />
                    <RecordCountBox label="Transactions" value={previewData.metadata?.recordCounts?.transactions} isDark={isDark} />
                    <RecordCountBox label="Invoices" value={previewData.metadata?.recordCounts?.invoices} isDark={isDark} />
                    <RecordCountBox label="Academic Records" value={previewData.metadata?.recordCounts?.academicRecords} isDark={isDark} />
                    <RecordCountBox label="Quiz Attempts" value={previewData.metadata?.recordCounts?.quizAttempts} isDark={isDark} />
                    <RecordCountBox label="XP Transactions" value={previewData.metadata?.recordCounts?.xpTransactions} isDark={isDark} />
                    <RecordCountBox label="Achievements" value={previewData.metadata?.recordCounts?.achievements} isDark={isDark} />
                </div>
            </Card>

            {/* Academic Sessions */}
            {previewData.academicSessions?.length > 0 && (
                <Card isDark={isDark} title="Academic Sessions">
                    <div className="space-y-3">
                        {previewData.academicSessions.map((session: any) => (
                            <div key={session.id} className={`p-4 rounded-lg flex items-center justify-between ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
                                <div>
                                    <p className={`font-bold ${t.textPrimary(isDark)}`}>{session.name}</p>
                                    <p className={`text-xs ${t.textMuted(isDark)}`}>{format(new Date(session.start_date), 'MMM d')} - {format(new Date(session.end_date), 'MMM d, yyyy')}</p>
                                </div>
                                {session.is_current && <Badge className={isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-50 text-emerald-700'}>Current</Badge>}
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Global Restore */}
            <div className={`p-6 rounded-2xl border-2 ${isDark ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                <Button
                    onClick={() => setConfirmTarget('all')}
                    disabled={isRestoring}
                    className={`w-full h-12 rounded-xl font-black text-sm uppercase tracking-widest gap-2 shadow-xl ${t.btnPrimary(isDark, accent)}`}
                >
                    <RotateCcw size={18} />
                    Global Restore
                </Button>
            </div>
        </div>
    );
}

function StudentsTab({ previewData, isDark, studentSearch, setStudentSearch, filteredStudents, expandedStudent, setExpandedStudent, maxXp, getTierColor }: any) {
    return (
        <div className="space-y-6">
            {/* Search */}
            <div className="relative">
                <Search size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 opacity-40 ${t.textMuted(isDark)}`} />
                <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className={`w-full pl-12 pr-4 py-3 rounded-xl font-bold border transition-all ${isDark ? 'bg-white/5 border-white/10 focus:border-white/20 focus:bg-white/10' : 'bg-white border-slate-200 focus:border-slate-300'}`}
                />
            </div>

            {/* Students List */}
            <div className="space-y-3">
                {filteredStudents.length > 0 ? (
                    filteredStudents.map((student: any) => (
                        <StudentCard
                            key={student.id}
                            student={student}
                            isDark={isDark}
                            isExpanded={expandedStudent === student.id}
                            onToggle={() => setExpandedStudent(expandedStudent === student.id ? null : student.id)}
                            maxXp={maxXp}
                            getTierColor={getTierColor}
                        />
                    ))
                ) : (
                    <div className={`p-8 rounded-xl text-center ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
                        <Users size={32} className={`mx-auto mb-2 ${isDark ? 'text-white/20' : 'text-slate-300'}`} />
                        <p className={`text-sm font-bold ${t.textMuted(isDark)}`}>No students found</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function StudentCard({ student, isDark, isExpanded, onToggle, maxXp, getTierColor }: any) {
    const xpPercent = (student.cumulative_xp / maxXp) * 100;

    return (
        <div
            className={`rounded-2xl border transition-all ${isExpanded ? (isDark ? 'bg-neutral-800 border-white/20 shadow-xl shadow-black/40' : 'bg-white border-slate-200 shadow-lg') : (isDark ? 'bg-neutral-900/50 border-white/10' : 'bg-slate-50 border-slate-100')}`}
        >
            {/* Header */}
            <button onClick={onToggle} className="w-full p-4 text-left">
                <div className="flex items-center gap-4 justify-between">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}>
                                {student.first_name?.[0]}{student.last_name?.[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`font-black truncate ${t.textPrimary(isDark)}`}>{student.first_name} {student.last_name}</p>
                                <p className={`text-xs truncate ${t.textMuted(isDark)}`}>{student.email}</p>
                            </div>
                        </div>
                        {/* XP Bar */}
                        <div className="mt-3 space-y-1">
                            <div className="flex items-center justify-between text-xs mb-1">
                                <span className={`font-bold ${t.textMuted(isDark)}`}>XP: {student.cumulative_xp?.toLocaleString() || 0}</span>
                                <span className={`font-bold ${t.textMuted(isDark)}`}>Streak: {student.current_streak || 0}🔥</span>
                            </div>
                            <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}>
                                <div
                                    className={`h-full ${isDark ? 'bg-purple-500' : 'bg-purple-600'}`}
                                    style={{ width: `${Math.min(xpPercent, 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                        {student.is_active && <Badge className={isDark ? 'bg-emerald-500/20 text-emerald-300 border-0' : 'bg-emerald-50 text-emerald-700 border-0'}>Active</Badge>}
                        {student.is_verified && <Badge className={isDark ? 'bg-blue-500/20 text-blue-300 border-0' : 'bg-blue-50 text-blue-700 border-0'}>Verified</Badge>}
                    </div>
                </div>
            </button>

            {/* Expanded Content */}
            {isExpanded && (
                <div className={`border-t overflow-hidden ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                        <div className="p-4 space-y-4">
                            {/* Achievements */}
                            {student.achievements?.length > 0 && (
                                <div>
                                    <p className={`text-xs font-black uppercase tracking-widest mb-2 ${t.textMuted(isDark)}`}>Achievements ({student.achievements.length})</p>
                                    <div className="flex flex-wrap gap-2">
                                        {student.achievements.map((ach: any) => (
                                            <Badge key={ach.id} className={`border ${getTierColor(ach.tier, isDark)}`}>
                                                {ach.badge_name}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Quiz Attempts */}
                            {student.quizAttempts?.length > 0 && (
                                <div>
                                    <p className={`text-xs font-black uppercase tracking-widest mb-2 ${t.textMuted(isDark)}`}>Quiz Attempts ({student.quizAttempts.length})</p>
                                    <div className="space-y-1">
                                        {student.quizAttempts.slice(0, 5).map((attempt: any, i: number) => (
                                            <div key={i} className={`flex items-center justify-between text-xs p-2 rounded ${isDark ? 'bg-white/5' : 'bg-white'}`}>
                                                <span className={t.textMuted(isDark)}>Score: {attempt.percentage}%</span>
                                                <span className={attempt.passed ? 'text-green-500' : 'text-red-500'}>
                                                    {attempt.passed ? '✓ Passed' : '✗ Failed'}
                                                </span>
                                            </div>
                                        ))}
                                        {student.quizAttempts.length > 5 && (
                                            <p className={`text-xs ${t.textMuted(isDark)}`}>+{student.quizAttempts.length - 5} more</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* XP Breakdown */}
                            {student.xpTransactions?.length > 0 && (
                                <div>
                                    <p className={`text-xs font-black uppercase tracking-widest mb-2 ${t.textMuted(isDark)}`}>XP Sources</p>
                                    <XpBreakdown transactions={student.xpTransactions} isDark={isDark} />
                                </div>
                            )}
                        </div>
                </div>
            )}
        </div>
    );
}

function XpBreakdown({ transactions, isDark }: any) {
    const sources = transactions.reduce((acc: any, t: any) => {
        acc[t.source] = (acc[t.source] || 0) + t.amount;
        return acc;
    }, {});

    return (
        <div className="grid grid-cols-2 gap-2">
            {Object.entries(sources).map(([source, amount]: any) => (
                <div key={source} className={`p-2 rounded text-xs ${isDark ? 'bg-white/5' : 'bg-white'}`}>
                    <p className={`font-bold capitalize ${t.textPrimary(isDark)}`}>{source.replace(/_/g, ' ')}</p>
                    <p className={t.textMuted(isDark)}>+{amount}</p>
                </div>
            ))}
        </div>
    );
}

function BillingTab({ previewData, isDark, formatCurrency }: any) {
    const paidInvoices = previewData.invoices?.filter((inv: any) => inv.status === 'paid').length || 0;
    const totalTransactions = previewData.transactions?.length || 0;

    return (
        <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard label="Total Revenue" value={formatCurrency(previewData.metadata?.totalRevenue || 0)} isDark={isDark} />
                <StatCard label="Total Transactions" value={totalTransactions.toString()} isDark={isDark} />
                <StatCard label="Paid Invoices" value={`${paidInvoices} / ${previewData.invoices?.length || 0}`} isDark={isDark} />
            </div>

            {/* Transactions */}
            {previewData.transactions?.length > 0 && (
                <Card isDark={isDark} title={`Transactions (${previewData.transactions.length})`}>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {previewData.transactions.map((txn: any, i: number) => (
                            <div key={i} className={`p-3 rounded-lg flex items-center justify-between text-sm ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
                                <div>
                                    <p className={`font-bold ${t.textPrimary(isDark)}`}>{formatCurrency(txn.amount)}</p>
                                    <p className={`text-xs ${t.textMuted(isDark)}`}>{format(new Date(txn.created_at), 'MMM d, yyyy')}</p>
                                </div>
                                <Badge className={getStatusColor(txn.status, isDark)}>{txn.status}</Badge>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Invoices */}
            {previewData.invoices?.length > 0 && (
                <Card isDark={isDark} title={`Invoices (${previewData.invoices.length})`}>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {previewData.invoices.map((inv: any, i: number) => (
                            <div key={i} className={`p-3 rounded-lg flex items-center justify-between text-sm ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
                                <div>
                                    <p className={`font-bold ${t.textPrimary(isDark)}`}>{inv.invoice_number}</p>
                                    <p className={`text-xs ${t.textMuted(isDark)}`}>{inv.billing_name} - {formatCurrency(inv.total)}</p>
                                </div>
                                <Badge className={getStatusColor(inv.status, isDark)}>{inv.status}</Badge>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
}

function ClassesTab({ previewData, isDark }: any) {
    return (
        <div className="space-y-6">
            {/* Academic Sessions */}
            {previewData.academicSessions?.length > 0 && (
                <Card isDark={isDark} title={`Academic Sessions (${previewData.academicSessions.length})`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {previewData.academicSessions.map((session: any) => (
                            <div key={session.id} className={`p-4 rounded-xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-100'}`}>
                                <p className={`font-black text-lg ${t.textPrimary(isDark)}`}>{session.name}</p>
                                <p className={`text-xs ${t.textMuted(isDark)} mt-2`}>{format(new Date(session.start_date), 'MMM d')} - {format(new Date(session.end_date), 'MMM d, yyyy')}</p>
                                {session.is_current && <Badge className={`mt-3 ${isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-50 text-emerald-700'}`}>Current</Badge>}
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Classes */}
            {previewData.classes?.length > 0 && (
                <Card isDark={isDark} title={`Classes (${previewData.classes.length})`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {previewData.classes.map((cls: any) => (
                            <div key={cls.id} className={`p-4 rounded-xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-100'}`}>
                                <p className={`font-black text-lg ${t.textPrimary(isDark)}`}>{cls.name}</p>
                                <p className={`text-xs ${t.textMuted(isDark)} mt-2`}>Level {cls.level}</p>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
}

// ==================== SHARED COMPONENTS ====================

function Card({ isDark, title, children }: { isDark: boolean; title: string; children: React.ReactNode }) {
    return (
        <div className={`p-5 sm:p-6 rounded-2xl border ${isDark ? 'bg-neutral-900/80 border-white/10' : 'bg-slate-50/50 border-slate-100'}`}>
            {title && <h3 className={`text-base sm:text-lg font-black mb-4 ${t.textPrimary(isDark)}`}>{title}</h3>}
            {children}
        </div>
    );
}

function InfoRow({ label, value, isDark, icon: Icon }: any) {
    return (
        <div>
            <p className={`text-xs font-bold uppercase opacity-50 ${t.textMuted(isDark)}`}>{label}</p>
            <div className="flex items-center gap-2 mt-2">
                {Icon && <Icon size={14} className={`flex-shrink-0 ${t.textMuted(isDark)}`} />}
                <p className={`font-bold ${t.textPrimary(isDark)}`}>{value || '—'}</p>
            </div>
        </div>
    );
}

function StatBox({ icon: Icon, label, value, isDark, color = 'indigo' }: any) {
    const colorClasses: Record<string, string> = {
        indigo: isDark ? 'text-indigo-400 bg-indigo-500/10' : 'text-indigo-600 bg-indigo-50',
        purple: isDark ? 'text-purple-400 bg-purple-500/10' : 'text-purple-600 bg-purple-50',
        emerald: isDark ? 'text-emerald-400 bg-emerald-500/10' : 'text-emerald-600 bg-emerald-50',
        blue: isDark ? 'text-blue-400 bg-blue-500/10' : 'text-blue-600 bg-blue-50',
        amber: isDark ? 'text-amber-400 bg-amber-500/10' : 'text-amber-600 bg-amber-50',
        rose: isDark ? 'text-rose-400 bg-rose-500/10' : 'text-rose-600 bg-rose-50'
    };

    return (
        <div className={`p-4 rounded-2xl border transition-all hover:scale-[1.02] ${isDark ? 'bg-neutral-900/90 border-white/10 shadow-lg shadow-black/20' : 'bg-white border-slate-100 shadow-sm'}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${colorClasses[color]}`}>
                <Icon size={20} />
            </div>
            <p className={`text-[10px] font-black uppercase tracking-wider opacity-60 ${t.textMuted(isDark)}`}>{label}</p>
            <p className={`text-xl font-black mt-1 ${t.textPrimary(isDark)}`}>{value.toLocaleString ? value.toLocaleString() : value}</p>
        </div>
    );
}

function StatCard({ label, value, isDark }: any) {
    return (
        <div className={`p-4 rounded-xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-100'}`}>
            <p className={`text-xs font-bold uppercase opacity-50 ${t.textMuted(isDark)}`}>{label}</p>
            <p className={`text-2xl font-black mt-2 ${t.textPrimary(isDark)}`}>{value}</p>
        </div>
    );
}

function RecordCountBox({ label, value, isDark }: any) {
    return (
        <div className={`p-3 rounded-lg text-center ${isDark ? 'bg-white/5' : 'bg-white'}`}>
            <p className={`text-xs font-bold uppercase ${t.textMuted(isDark)}`}>{label}</p>
            <p className={`text-2xl font-black mt-1 ${t.textPrimary(isDark)}`}>{value || 0}</p>
        </div>
    );
}

function NodesTab({ nodes, isDark, accent, onSelect, currentFileName }: any) {
    const formatFileSize = (bytes: number) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {nodes.map((node: any) => (
                <div
                    key={node.fileName}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group
                        hover:scale-[1.02]
                        ${node.fileName === currentFileName 
                            ? (isDark ? 'bg-indigo-500/20 border-indigo-500/50 ring-1 ring-indigo-500/20 shadow-lg shadow-indigo-500/10' : 'bg-indigo-50 border-indigo-200')
                            : (isDark ? 'bg-neutral-900/90 border-white/10 hover:bg-neutral-800' : 'bg-white border-slate-100 hover:shadow-md')}`}
                    onClick={() => onSelect(node)}
                >
                    <div className="flex flex-col gap-4">
                        <div className="flex items-start justify-between">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
                                <Server size={18} className={node.fileName === currentFileName ? 'text-indigo-500' : (isDark ? 'text-white/40' : 'text-slate-400')} />
                            </div>
                            <div className="text-right">
                                <p className={`text-[8px] font-black uppercase tracking-widest opacity-40 ${t.textMuted(isDark)}`}>Payload</p>
                                <p className={`text-xs font-black ${t.textPrimary(isDark)}`}>{formatFileSize(node.size)}</p>
                            </div>
                        </div>

                        <div>
                            <h4 className={`text-sm font-black truncate ${t.textPrimary(isDark)}`}>{node.schoolName}</h4>
                            <div className="flex items-center gap-3 mt-1.5">
                                <div className="flex items-center gap-1.5">
                                    <Users size={12} className="opacity-40" />
                                    <span className={`text-[10px] font-bold opacity-60 ${t.textMuted(isDark)}`}>{node.studentCount || 0} Students</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <IndianRupee size={12} className="opacity-40" />
                                    <span className={`text-[10px] font-bold opacity-60 ${t.textMuted(isDark)}`}>
                                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(parseFloat(node.revenueTotal || "0"))}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mt-2 pt-3 border-t border-dashed opacity-100 group-hover:opacity-100 transition-opacity">
                            <span className={`text-[9px] font-black uppercase tracking-widest ${node.fileName === currentFileName ? 'text-indigo-500' : 'text-slate-400'}`}>
                                {node.fileName === currentFileName ? 'Currently Inspecting' : 'Click to Inspect'}
                            </span>
                            <ArrowLeft size={14} className="rotate-180 opacity-40" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function getStatusColor(status: string, isDark: boolean): string {
    const colors: Record<string, string> = {
        active: isDark ? 'bg-emerald-500/20 text-emerald-300 border-0' : 'bg-emerald-50 text-emerald-700 border-0',
        paid: isDark ? 'bg-emerald-500/20 text-emerald-300 border-0' : 'bg-emerald-50 text-emerald-700 border-0',
        captured: isDark ? 'bg-emerald-500/20 text-emerald-300 border-0' : 'bg-emerald-50 text-emerald-700 border-0',
        issued: isDark ? 'bg-blue-500/20 text-blue-300 border-0' : 'bg-blue-50 text-blue-700 border-0',
        pending: isDark ? 'bg-yellow-500/20 text-yellow-300 border-0' : 'bg-yellow-50 text-yellow-700 border-0',
        trialing: isDark ? 'bg-purple-500/20 text-purple-300 border-0' : 'bg-purple-50 text-purple-700 border-0',
        cancelled: isDark ? 'bg-red-500/20 text-red-300 border-0' : 'bg-red-50 text-red-700 border-0',
        failed: isDark ? 'bg-red-500/20 text-red-300 border-0' : 'bg-red-50 text-red-700 border-0',
        void: isDark ? 'bg-slate-500/20 text-slate-300 border-0' : 'bg-slate-50 text-slate-700 border-0'
    };
    return colors[status] || colors.pending;
}
