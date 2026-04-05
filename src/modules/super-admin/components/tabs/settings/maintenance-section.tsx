import React from 'react';
import { Button } from '@/components/ui/button';
import { Settings2, Loader2 } from 'lucide-react';
import { useAdminTheme, t } from '../../../theme-context';

interface MaintenanceSectionProps {
    syncing: boolean;
    onSyncMetrics: () => void;
    diagnosing: boolean;
    diagResults: any;
    onRunDiagnostics: () => void;
}

export function MaintenanceSection({
    syncing, onSyncMetrics,
    diagnosing, diagResults, onRunDiagnostics
}: MaintenanceSectionProps) {
    const { isDark, accent } = useAdminTheme();

    return (
        <div className={`p-6 md:p-10 rounded-[2rem] border ${t.border(isDark)} ${isDark ? 'bg-[#121214]' : 'bg-white'} shadow-xl`}>
            <div className="flex items-center gap-4 mb-8">
                <div className={`p-4 rounded-2xl ${isDark ? 'bg-white/[0.04]' : 'bg-slate-100'}`}>
                    <Settings2 className={accent.text} size={28} />
                </div>
                <div className="flex-1">
                    <h2 className={`text-2xl font-black ${t.textPrimary(isDark)} tracking-tight`}>System Maintenance</h2>
                    <p className={`text-sm ${t.textSecondary(isDark)} font-medium mt-1`}>Perform critical system-wide data synchronization and cleanup tasks.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`p-6 rounded-3xl border ${t.border(isDark)} ${isDark ? 'bg-white/[0.02]' : 'bg-neutral-50'} flex flex-col justify-between`}>
                    <div className="space-y-2">
                        <h4 className={`text-sm font-black uppercase tracking-widest ${t.textPrimary(isDark)}`}>Sync Platform Metrics</h4>
                        <p className={`text-[11px] font-medium leading-relaxed ${t.textMuted(isDark)}`}>
                            Force a complete recalculation of total students, revenue, and active subscriptions. Use this if dashboard counters appear out of sync.
                        </p>
                    </div>
                    <Button 
                        type="button"
                        disabled={syncing}
                        onClick={onSyncMetrics}
                        className={`mt-6 w-fit rounded-full h-11 px-8 font-black uppercase tracking-widest text-[10px] ${t.btnPrimary(isDark, accent)}`}
                    >
                        {syncing ? <Loader2 className="animate-spin mr-2" size={14} /> : null}
                        RECALCULATE ALL DATA
                    </Button>
                </div>

                <div className={`p-6 rounded-3xl border ${t.border(isDark)} ${isDark ? 'bg-white/[0.02]' : 'bg-neutral-50'} flex flex-col justify-between`}>
                    <div className="space-y-2">
                        <h4 className={`text-sm font-black uppercase tracking-widest ${t.textPrimary(isDark)}`}>Database Integrity</h4>
                        <p className={`text-[11px] font-medium leading-relaxed ${t.textMuted(isDark)}`}>
                            Validates foreign key relationships and detects orphaned metadata. Run after massive course/school deletions.
                        </p>
                        {diagResults && (
                            <div className={`mt-3 p-3 rounded-xl ${diagResults.status === 'ok' ? (isDark ? 'bg-emerald-500/10' : 'bg-emerald-50') : (isDark ? 'bg-rose-500/10' : 'bg-rose-50')}`}>
                                <p className={`text-[10px] font-black ${diagResults.status === 'ok' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {diagResults.status === 'ok'
                                        ? '✓ Database Healthy - No issues found'
                                        : `⚠ ${diagResults.issues.length} Issue${diagResults.issues.length > 1 ? 's' : ''} Found`}
                                </p>
                                {diagResults.issues.length > 0 && (
                                    <ul className={`text-[9px] mt-2 space-y-1 ${isDark ? 'text-rose-200' : 'text-rose-700'}`}>
                                        {diagResults.issues.map((issue: any, i: number) => (
                                            <li key={i}>• {issue}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}
                    </div>
                    <Button
                        type="button"
                        disabled={diagnosing}
                        onClick={onRunDiagnostics}
                        className={`mt-6 w-fit rounded-full h-11 px-8 font-black uppercase tracking-widest text-[10px] ${t.btnPrimary(isDark, accent)}`}
                    >
                        {diagnosing ? <Loader2 className="animate-spin mr-2" size={14} /> : null}
                        RUN DIAGNOSTICS
                    </Button>
                </div>
            </div>
        </div>
    );
}
