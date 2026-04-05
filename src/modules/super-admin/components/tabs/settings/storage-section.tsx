import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { HardDrive, RefreshCw, ActivityIcon, Activity } from 'lucide-react';
import { useAdminTheme, t } from '../../../theme-context';

interface StorageSectionProps {
    storageLoading: boolean;
    storageError: string | null;
    storageData: any;
    systemHealth: any;
    onRefreshStorage: () => void;
    r2Scanning: boolean;
    onScanR2: () => void;
    formatBytes: (bytes: number) => string;
}

export function StorageSection({
    storageLoading, storageError, storageData, systemHealth,
    onRefreshStorage, r2Scanning, onScanR2, formatBytes
}: StorageSectionProps) {
    const { isDark, accent } = useAdminTheme();

    return (
        <div className="space-y-8">
            <div className={`p-6 md:p-10 rounded-[2rem] border ${t.border(isDark)} ${isDark ? 'bg-[#121214]' : 'bg-white'} shadow-xl`}>
                <div className="flex items-center gap-4 mb-8">
                    <div className={`p-4 rounded-2xl ${isDark ? 'bg-white/[0.04]' : 'bg-slate-100'}`}>
                        <HardDrive className={accent.text} size={28} />
                    </div>
                    <div className="flex-1">
                        <h2 className={`text-2xl font-black ${t.textPrimary(isDark)} tracking-tight`}>Storage Usage</h2>
                        <p className={`text-sm ${t.textSecondary(isDark)} font-medium mt-1`}>Server storage allocation across all services</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={onRefreshStorage}
                            disabled={storageLoading}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${isDark ? 'bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 disabled:opacity-50' : 'bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-50'}`}
                        >
                            <RefreshCw size={13} className={storageLoading ? 'animate-spin' : ''} />
                            Refresh
                        </button>
                    </div>
                </div>

                {storageError && (
                    <div className={`mb-6 p-4 rounded-2xl border ${isDark ? 'bg-rose-500/10 border-rose-500/20' : 'bg-rose-50 border-rose-100'}`}>
                        <p className={`text-sm font-bold ${isDark ? 'text-rose-400' : 'text-rose-600'}`}>{storageError}</p>
                        <button
                            type="button"
                            onClick={onRefreshStorage}
                            className={`mt-2 text-xs font-black uppercase tracking-widest ${isDark ? 'text-rose-400 hover:text-rose-300' : 'text-rose-600 hover:text-rose-500'}`}
                        >
                            Retry
                        </button>
                    </div>
                )}

                {storageLoading && !storageData && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[0, 1, 2, 3].map(i => (
                            <div key={i} className={`p-6 rounded-[1.5rem] border ${t.border(isDark)} ${isDark ? 'bg-white/[0.03]' : 'bg-slate-50/80'} animate-pulse`}>
                                <div className={`h-4 w-1/2 rounded-full mb-4 ${isDark ? 'bg-white/[0.08]' : 'bg-slate-200'}`} />
                                <div className={`h-8 w-1/3 rounded-full mb-6 ${isDark ? 'bg-white/[0.08]' : 'bg-slate-200'}`} />
                                <div className={`h-2 w-full rounded-full mb-3 ${isDark ? 'bg-white/[0.08]' : 'bg-slate-200'}`} />
                                <div className={`h-2 w-4/5 rounded-full mb-3 ${isDark ? 'bg-white/[0.08]' : 'bg-slate-200'}`} />
                                <div className={`h-2 w-3/5 rounded-full ${isDark ? 'bg-white/[0.08]' : 'bg-slate-200'}`} />
                            </div>
                        ))}
                    </div>
                )}

                {storageData && systemHealth && !storageLoading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* R2 Bucket */}
                        <div className={`p-6 rounded-[1.5rem] border ${t.border(isDark)} ${isDark ? 'bg-white/[0.03]' : 'bg-slate-50/80'}`}>
                            <div className="flex items-center justify-between mb-1">
                                <span className={`text-[10px] font-black uppercase tracking-widest ${t.textMuted(isDark)}`}>R2 Bucket</span>
                                {!storageData.r2?.scanned && (
                                    <button
                                        type="button"
                                        onClick={onScanR2}
                                        disabled={r2Scanning}
                                        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${isDark ? 'bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 disabled:opacity-50' : 'bg-slate-200 hover:bg-slate-300 text-slate-600 disabled:opacity-50'}`}
                                    >
                                        {r2Scanning ? <RefreshCw size={10} className="animate-spin" /> : null}
                                        {r2Scanning ? 'Scanning…' : 'Scan R2'}
                                    </button>
                                )}
                                {storageData.r2?.scanned && (
                                    <button
                                        type="button"
                                        onClick={onScanR2}
                                        disabled={r2Scanning}
                                        className={`flex items-center gap-1 text-[9px] font-bold ${t.textMuted(isDark)} hover:opacity-80 transition-opacity`}
                                    >
                                        <RefreshCw size={9} className={r2Scanning ? 'animate-spin' : ''} />
                                        Re-scan
                                    </button>
                                )}
                            </div>

                            {!storageData.r2?.configured && (
                                <p className={`text-xs font-medium mt-2 ${t.textMuted(isDark)}`}>R2 not configured</p>
                            )}

                            {storageData.r2?.configured && !storageData.r2?.scanned && (
                                <div className={`mt-4 p-4 rounded-xl border border-dashed ${isDark ? 'border-white/[0.08]' : 'border-slate-200'} text-center`}>
                                    <p className={`text-[10px] font-bold ${t.textMuted(isDark)}`}>Click "Scan R2" to analyze bucket usage</p>
                                    <p className={`text-[9px] mt-1 ${t.textMuted(isDark)} opacity-60`}>May take a few seconds for large buckets</p>
                                </div>
                            )}

                            {storageData.r2?.configured && storageData.r2?.scanned && (() => {
                                const r2 = storageData.r2;
                                const maxFolder = Math.max(r2.byFolder.images.bytes, r2.byFolder.videos.bytes, r2.byFolder.documents.bytes, 1);
                                const folders = [
                                    { key: 'images', label: 'Images', data: r2.byFolder.images },
                                    { key: 'videos', label: 'Videos', data: r2.byFolder.videos },
                                    { key: 'documents', label: 'Documents', data: r2.byFolder.documents },
                                ];
                                return (
                                    <>
                                        <p className={`text-2xl font-black ${t.textPrimary(isDark)} mt-1 mb-5`}>
                                            {formatBytes(r2.totalBytes)}
                                            <span className={`text-sm font-bold ml-2 ${t.textMuted(isDark)}`}>used</span>
                                        </p>
                                        <div className="space-y-3">
                                            {folders.map(({ label, data }) => {
                                                const pct = (data.bytes / maxFolder) * 100;
                                                return (
                                                    <div key={label}>
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className={`text-[10px] font-bold ${t.textSecondary(isDark)}`}>{label}</span>
                                                            <span className={`text-[10px] font-bold ${t.textMuted(isDark)}`}>{formatBytes(data.bytes)}</span>
                                                        </div>
                                                        <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/[0.08]' : 'bg-neutral-100'}`}>
                                                            <motion.div
                                                                className={`h-full rounded-full ${accent.bg}`}
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${Math.min(pct, 100)}%` }}
                                                                transition={{ duration: 0.8, ease: 'easeOut' }}
                                                                style={t.barGlow(isDark, accent)}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <p className={`text-[10px] font-bold mt-4 ${t.textMuted(isDark)}`}>
                                            {r2.objectCount.toLocaleString()} objects total
                                        </p>
                                    </>
                                );
                            })()}
                        </div>

                        {/* Database */}
                        <div className={`p-6 rounded-[1.5rem] border ${t.border(isDark)} ${isDark ? 'bg-white/[0.03]' : 'bg-slate-50/80'}`}>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${t.textMuted(isDark)}`}>Database</span>
                            <p className={`text-2xl font-black ${t.textPrimary(isDark)} mt-1 mb-5`}>
                                {systemHealth.database?.totalSize || 'Unknown'}
                                <span className={`text-sm font-bold ml-2 ${t.textMuted(isDark)}`}>total size</span>
                            </p>
                            {(() => {
                                const assets = storageData.db?.mediaAssets ?? [];
                                const byType: Record<string, { count: number; bytes: number }> = {
                                    video: { count: 0, bytes: 0 },
                                    image: { count: 0, bytes: 0 },
                                    document: { count: 0, bytes: 0 },
                                };
                                for (const row of assets) {
                                    if (byType[row.asset_type]) {
                                        byType[row.asset_type].count += row.count;
                                        byType[row.asset_type].bytes += row.totalBytes;
                                    }
                                }
                                const maxBytes = Math.max(...Object.values(byType).map(v => v.bytes), 1);
                                const totalCount = Object.values(byType).reduce((s, v) => s + v.count, 0);
                                const typeRows = [
                                    { key: 'video', label: 'Videos' },
                                    { key: 'image', label: 'Images' },
                                    { key: 'document', label: 'Documents' },
                                ];
                                return (
                                    <div className="space-y-3">
                                        {typeRows.map(({ key, label }) => {
                                            const d = byType[key];
                                            const pct = (d.bytes / maxBytes) * 100;
                                            return (
                                                <div key={key}>
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className={`text-[10px] font-bold ${t.textSecondary(isDark)}`}>
                                                            {label} <span className={`${t.textMuted(isDark)}`}>({d.count})</span>
                                                        </span>
                                                        <span className={`text-[10px] font-bold ${t.textMuted(isDark)}`}>{formatBytes(d.bytes)}</span>
                                                    </div>
                                                    <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/[0.08]' : 'bg-neutral-100'}`}>
                                                        <motion.div
                                                            className={`h-full rounded-full ${accent.bg}`}
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${Math.min(pct, 100)}%` }}
                                                            transition={{ duration: 0.8, ease: 'easeOut' }}
                                                            style={t.barGlow(isDark, accent)}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <p className={`text-[10px] font-bold mt-1 ${t.textMuted(isDark)}`}>
                                            {totalCount.toLocaleString()} assets in media library
                                        </p>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Redis Cache */}
                        <div className={`p-6 rounded-[1.5rem] border ${t.border(isDark)} ${isDark ? 'bg-white/[0.03]' : 'bg-slate-50/80'}`}>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${t.textMuted(isDark)}`}>Redis Cache</span>
                            {(() => {
                                const redis = systemHealth.redis;
                                const usedBytes = parseInt(redis.used_memory || '0', 10);
                                const maxBytes = parseInt(redis.maxmemory || '0', 10);
                                const pct = maxBytes > 0 ? Math.min((usedBytes / maxBytes) * 100, 100) : 0;
                                const fragRatio = redis.mem_fragmentation_ratio ?? 1;
                                const fragHigh = fragRatio > 1.5;
                                return (
                                    <>
                                        <p className={`text-2xl font-black ${t.textPrimary(isDark)} mt-1 mb-5`}>
                                            {redis.used_memory_human}
                                            {redis.maxmemory_human && redis.maxmemory_human !== 'Unlimited' && (
                                                <span className={`text-sm font-bold ml-2 ${t.textMuted(isDark)}`}>/ {redis.maxmemory_human}</span>
                                            )}
                                        </p>
                                        {maxBytes > 0 && (
                                            <div className="mb-3">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className={`text-[10px] font-bold ${t.textSecondary(isDark)}`}>Memory used</span>
                                                    <span className={`text-[10px] font-bold ${t.textMuted(isDark)}`}>{pct.toFixed(1)}%</span>
                                                </div>
                                                <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/[0.08]' : 'bg-neutral-100'}`}>
                                                    <motion.div
                                                        className={`h-full rounded-full ${pct > 85 ? 'bg-rose-500' : accent.bg}`}
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${pct}%` }}
                                                        transition={{ duration: 0.8, ease: 'easeOut' }}
                                                        style={t.barGlow(isDark, accent)}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 mt-4">
                                            <span className={`text-[10px] font-bold ${t.textMuted(isDark)}`}>Frag ratio:</span>
                                            <span className={`text-[10px] font-black ${fragHigh ? 'text-amber-500' : t.textPrimary(isDark)}`}>
                                                {fragRatio.toFixed(2)}
                                                {fragHigh && ' ⚠'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`text-[10px] font-bold ${t.textMuted(isDark)}`}>Hit rate:</span>
                                            <span className={`text-[10px] font-black ${t.textPrimary(isDark)}`}>{redis.hit_ratio?.toFixed(1)}%</span>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>

                        {/* Server RAM & Node.js Heap */}
                        <div className={`p-6 rounded-[1.5rem] border ${t.border(isDark)} ${isDark ? 'bg-white/[0.03]' : 'bg-slate-50/80'}`}>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${t.textMuted(isDark)}`}>Server RAM &amp; Node.js Heap</span>
                            {(() => {
                                const srv = systemHealth.server;
                                const ramPct = srv.memUsagePercent ?? 0;
                                const heapPct = srv.heapUsagePercent ?? 0;
                                const totalGb = (srv.totalMemMb / 1024).toFixed(1);
                                const usedGb = (srv.usedMemMb / 1024).toFixed(1);
                                return (
                                    <>
                                        <p className={`text-2xl font-black ${t.textPrimary(isDark)} mt-1 mb-5`}>
                                            {usedGb} GB
                                            <span className={`text-sm font-bold ml-2 ${t.textMuted(isDark)}`}>/ {totalGb} GB</span>
                                        </p>
                                        <div className="mb-3">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className={`text-[10px] font-bold ${t.textSecondary(isDark)}`}>RAM used</span>
                                                <span className={`text-[10px] font-bold ${t.textMuted(isDark)}`}>{ramPct.toFixed(1)}%</span>
                                            </div>
                                            <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/[0.08]' : 'bg-neutral-100'}`}>
                                                <motion.div
                                                    className={`h-full rounded-full ${ramPct > 85 ? 'bg-rose-500' : accent.bg}`}
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${Math.min(ramPct, 100)}%` }}
                                                    transition={{ duration: 0.8, ease: 'easeOut' }}
                                                    style={t.barGlow(isDark, accent)}
                                                />
                                            </div>
                                        </div>
                                        <div className="mb-3">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className={`text-[10px] font-bold ${t.textSecondary(isDark)}`}>Node.js Heap</span>
                                                <span className={`text-[10px] font-bold ${t.textMuted(isDark)}`}>
                                                    {srv.heapUsedMb} MB / {srv.heapTotalMb} MB
                                                </span>
                                            </div>
                                            <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/[0.08]' : 'bg-neutral-100'}`}>
                                                <motion.div
                                                    className={`h-full rounded-full ${heapPct > 85 ? 'bg-rose-500' : accent.bg}`}
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${Math.min(heapPct, 100)}%` }}
                                                    transition={{ duration: 0.8, ease: 'easeOut' }}
                                                    style={t.barGlow(isDark, accent)}
                                                />
                                            </div>
                                        </div>
                                        <p className={`text-[10px] font-bold ${t.textMuted(isDark)}`}>
                                            {heapPct.toFixed(1)}% heap used
                                        </p>
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                )}
            </div>

            {/* Infrastructure Engine Health summary area */}
            <div className="space-y-8 pt-8 border-t border-dashed border-slate-200 dark:border-white/10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className={`p-4 rounded-2xl ${isDark ? 'bg-white/[0.04]' : 'bg-slate-100'}`}>
                            <ActivityIcon className={accent.text} size={28} />
                        </div>
                        <div>
                            <h2 className={`text-2xl font-black ${t.textPrimary(isDark)} tracking-tight`}>Infrastructure Engine</h2>
                            <p className={`text-sm ${t.textSecondary(isDark)} font-medium mt-1`}>Real-time monitoring of Node.js, Redis, and Database health.</p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <a href="/admin-portal/admin/infrastructure-monitor">
                            <Button
                                type="button"
                                className={`h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl transition-all hover:scale-105 active:scale-95 ${t.btnPrimary(isDark, accent)}`}
                            >
                                <Activity className="mr-2" size={18} />
                                Infrastructure Monitor
                            </Button>
                        </a>
                    </div>
                </div>
                
                <div className={`p-8 rounded-[2rem] border-2 border-dashed ${isDark ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50 border-slate-100'} text-center`}>
                    <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${t.textMuted(isDark)}`}>
                        Monitoring data is fetched on-demand to preserve server resources.
                    </p>
                </div>
            </div>
        </div>
    );
}
