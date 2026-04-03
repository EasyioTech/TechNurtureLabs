'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Database, Activity, Zap, ShieldAlert, CheckCircle2,
    RefreshCw, Cpu, HardDrive, Users, Clock, AlertTriangle, Info, Server, Network
} from 'lucide-react';
import { getSystemHealth } from '../../actions/redis-monitoring';
import { runDatabaseDiagnostics } from '../../actions';
import { type SystemHealthData, type DiagnosticsResult } from '../../types';
import { useAdminTheme, t } from '../../theme-context';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function SystemHealthTab() {
    const { isDark, accent } = useAdminTheme();
    const [data, setData] = useState<SystemHealthData | null>(null);
    const [loading, setLoading] = useState(true);
    const [diagnosing, setDiagnosing] = useState(false);
    const [diagResults, setDiagResults] = useState<DiagnosticsResult | null>(null);

    const fetchData = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const fetched = await getSystemHealth();
            setData(fetched);
        } catch (err) {
            toast.error("Failed to fetch Engine metrics");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(() => fetchData(true), 30000); // Auto refresh every 30s
        return () => clearInterval(interval);
    }, []);

    if (loading && !data) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <RefreshCw className={`w-8 h-8 animate-spin ${accent.text}`} />
                <p className={`text-xs font-black uppercase tracking-widest ${t.textMuted(isDark)}`}>Analyzing Engine Status...</p>
            </div>
        );
    }

    if (!data) return null;

    const stats = data.redis;
    const server = data.server;

    const getScoreColor = (score: number) => {
        if (score >= 90) return 'text-emerald-500';
        if (score >= 70) return 'text-amber-500';
        return 'text-rose-500';
    };

    return (
        <div className="space-y-8 pb-10">
            {/* Hostinger KVM Server Health */}
            <div className={`rounded-[2.5rem] p-8 border ${t.border(isDark)} ${isDark ? 'bg-white/[0.03]' : 'bg-white shadow-xl shadow-black/5'} relative overflow-hidden`}>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                    <div className="flex items-center gap-3 relative z-10">
                        <Server className={accent.text} size={24} />
                        <div>
                            <h3 className={`text-lg font-black tracking-tight ${t.textPrimary(isDark)}`}>Hostinger KVM Status</h3>
                            <p className={`text-[10px] font-bold ${t.textMuted(isDark)} uppercase tracking-widest mt-1`}>
                                OS: {server.platform} | Node: {server.nodeVersion}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 relative z-10">
                        <div className={`px-4 py-2 rounded-2xl border ${t.border(isDark)} ${server.nodeEnv === 'production' ? (isDark ? 'bg-emerald-500/10' : 'bg-emerald-50') : (isDark ? 'bg-amber-500/10' : 'bg-amber-50')} flex items-center gap-2`}>
                            <Activity size={14} className={server.nodeEnv === 'production' ? 'text-emerald-500' : 'text-amber-500'} />
                            <span className={`text-[10px] font-black ${server.nodeEnv === 'production' ? 'text-emerald-500' : 'text-amber-500'}`}>ENV: {server.nodeEnv.toUpperCase()}</span>
                        </div>
                        <div className={`px-4 py-2 rounded-2xl border ${t.border(isDark)} ${isDark ? 'bg-white/5' : 'bg-neutral-50'} flex items-center gap-2`}>
                            <Clock size={14} className={accent.text} />
                            <span className={`text-[10px] font-black ${t.textPrimary(isDark)}`}>UP: {server.appUptimeHours}H (APP) | {server.uptimeHours}H (OS)</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 relative z-10">
                    {/* CPU Load */}
                    <div className={`p-6 rounded-[2rem] border ${t.border(isDark)} ${isDark ? 'bg-white/5' : 'bg-neutral-50/50'} space-y-4`}>
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                                <Cpu size={16} className={accent.text} />
                                <span className={`text-[10px] font-black uppercase tracking-widest ${t.textMuted(isDark)}`}>CPU Load ({server.cpuCount} Cores)</span>
                            </div>
                            <span className={`text-lg font-black ${t.textPrimary(isDark)}`}>{server.loadAvg1m.toFixed(2)}</span>
                        </div>
                        <div className={`h-2 w-full rounded-full ${isDark ? 'bg-white/10' : 'bg-neutral-200'} overflow-hidden`}>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(100, (server.loadAvg1m / server.cpuCount) * 100)}%` }}
                                className={`h-full rounded-full ${server.loadAvg1m > server.cpuCount * 0.8 ? 'bg-rose-500' : accent.bg}`}
                            />
                        </div>
                        <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest">
                            <span className={t.textMuted(isDark)}>5m: {server.loadAvg5m.toFixed(2)}</span>
                            <span className={t.textMuted(isDark)}>15m: {server.loadAvg15m.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Server Memory */}
                    <div className={`p-6 rounded-[2rem] border ${t.border(isDark)} ${isDark ? 'bg-white/5' : 'bg-neutral-50/50'} space-y-4`}>
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                                <HardDrive size={16} className={accent.text} />
                                <span className={`text-[10px] font-black uppercase tracking-widest ${t.textMuted(isDark)}`}>OS RAM</span>
                            </div>
                            <span className={`text-lg font-black ${t.textPrimary(isDark)}`}>{server.memUsagePercent.toFixed(1)}%</span>
                        </div>
                        <div className={`h-2 w-full rounded-full ${isDark ? 'bg-white/10' : 'bg-neutral-200'} overflow-hidden`}>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${server.memUsagePercent}%` }}
                                className={`h-full rounded-full ${server.memUsagePercent > 85 ? 'bg-rose-500' : accent.bg}`}
                            />
                        </div>
                        <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest">
                            <span className={t.textMuted(isDark)}>Used: {server.usedMemMb} MB</span>
                            <span className={t.textMuted(isDark)}>Total: {server.totalMemMb} MB</span>
                        </div>
                    </div>

                    {/* Node JS Heap */}
                    <div className={`p-6 rounded-[2rem] border ${t.border(isDark)} ${isDark ? 'bg-white/5' : 'bg-neutral-50/50'} space-y-4`}>
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                                <Activity size={16} className={accent.text} />
                                <span className={`text-[10px] font-black uppercase tracking-widest ${t.textMuted(isDark)}`}>Node JS Heap</span>
                            </div>
                            <span className={`text-lg font-black ${t.textPrimary(isDark)}`}>{server.heapUsagePercent.toFixed(1)}%</span>
                        </div>
                        <div className={`h-2 w-full rounded-full ${isDark ? 'bg-white/10' : 'bg-neutral-200'} overflow-hidden`}>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${server.heapUsagePercent}%` }}
                                className={`h-full rounded-full ${server.heapUsagePercent > 85 ? 'bg-rose-500' : accent.bg}`}
                            />
                        </div>
                        <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest">
                            <span className={t.textMuted(isDark)}>Used: {server.heapUsedMb} MB</span>
                            <span className={t.textMuted(isDark)}>Limit: {server.heapTotalMb} MB</span>
                        </div>
                    </div>

                    {/* Quick Network Status */}
                    <div className={`p-6 rounded-[2rem] border ${t.border(isDark)} ${isDark ? 'bg-white/5' : 'bg-neutral-50/50'} flex gap-6 items-center`}>
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDark ? 'bg-white/10' : 'bg-white border shadow-sm'} ${server.loadAvg1m > server.cpuCount ? 'text-rose-500' : 'text-emerald-500'}`}>
                            <Network size={24} />
                        </div>
                        <div>
                            <p className={`text-[10px] font-black uppercase tracking-widest ${t.textMuted(isDark)} mb-1`}>Network Capacity</p>
                            <p className={`text-xl font-black ${server.loadAvg1m > server.cpuCount ? 'text-rose-500' : 'text-emerald-500'}`}>
                                {server.loadAvg1m > server.cpuCount ? 'High Load' : 'Optimal'}
                            </p>
                        </div>
                    </div>

                    {/* Cloudflare Storage Network Status */}
                    {server.cloudflare && (
                        <div className={`col-span-1 p-6 rounded-[2rem] border ${t.border(isDark)} ${isDark ? 'bg-white/5' : 'bg-neutral-50/50'} flex gap-4 items-center`}>
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDark ? 'bg-white/10' : 'bg-white border shadow-sm'} ${server.cloudflare.status === 'Connected' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                <Database size={24} />
                            </div>
                            <div className="flex-1">
                                <p className={`text-[10px] font-black uppercase tracking-widest ${t.textMuted(isDark)} mb-1`}>Cloudflare R2</p>
                                <p className={`text-xl font-black ${server.cloudflare.status === 'Connected' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {server.cloudflare.status === 'Connected' ? 'Online' : 'Offline'}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-[8px] font-bold uppercase tracking-widest ${t.textMuted(isDark)}`}>PING: {server.cloudflare.pingMs}ms</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Primary Database Health */}
            <div className={`rounded-[2.5rem] p-8 border ${t.border(isDark)} ${isDark ? 'bg-white/[0.03]' : 'bg-white shadow-xl shadow-black/5'} relative overflow-hidden`}>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                    <div className="flex items-center gap-3 relative z-10">
                        <Database className={accent.text} size={24} />
                        <div>
                            <h3 className={`text-lg font-black tracking-tight ${t.textPrimary(isDark)}`}>PostgreSQL Database Status</h3>
                            <p className={`text-[10px] font-bold ${t.textMuted(isDark)} uppercase tracking-widest mt-1`}>
                                Primary Drizzle DB
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 relative z-10">
                        <div className={`px-4 py-2 rounded-2xl border ${t.border(isDark)} ${data.database.status === 'Connected' ? (isDark ? 'bg-emerald-500/10' : 'bg-emerald-50') : (isDark ? 'bg-rose-500/10' : 'bg-rose-50')} flex items-center gap-2`}>
                            {data.database.status === 'Connected' ? <CheckCircle2 size={14} className="text-emerald-500" /> : <AlertTriangle size={14} className="text-rose-500" />}
                            <span className={`text-[10px] font-black ${data.database.status === 'Connected' ? 'text-emerald-500' : 'text-rose-500'}`}>{data.database.status}</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                    {/* DB Latency (Ping) */}
                    <div className={`p-6 rounded-[2rem] border ${t.border(isDark)} ${isDark ? 'bg-white/5' : 'bg-neutral-50/50'} flex gap-6 items-center`}>
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDark ? 'bg-white/10' : 'bg-white border shadow-sm'} ${data.database.pingMs < 100 ? 'text-emerald-500' : 'text-amber-500'}`}>
                            <Activity size={24} />
                        </div>
                        <div>
                            <p className={`text-[10px] font-black uppercase tracking-widest ${t.textMuted(isDark)} mb-1`}>Database Latency</p>
                            <p className={`text-xl font-black ${data.database.pingMs < 100 ? 'text-emerald-500' : 'text-amber-500'}`}>
                                {data.database.pingMs} ms
                            </p>
                        </div>
                    </div>

                    {/* Active Connections */}
                    <div className={`p-6 rounded-[2rem] border ${t.border(isDark)} ${isDark ? 'bg-white/5' : 'bg-neutral-50/50'} flex gap-6 items-center`}>
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDark ? 'bg-white/10' : 'bg-white border shadow-sm'} ${data.database.activeConnections > 50 ? 'text-amber-500' : 'text-emerald-500'}`}>
                            <Users size={24} />
                        </div>
                        <div>
                            <p className={`text-[10px] font-black uppercase tracking-widest ${t.textMuted(isDark)} mb-1`}>Active Connections</p>
                            <p className={`text-xl font-black ${data.database.activeConnections > 50 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                {data.database.activeConnections}
                            </p>
                        </div>
                    </div>

                    {/* DB Size */}
                    <div className={`p-6 rounded-[2rem] border ${t.border(isDark)} ${isDark ? 'bg-white/5' : 'bg-neutral-50/50'} flex gap-6 items-center`}>
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDark ? 'bg-white/10' : 'bg-white border shadow-sm'} ${accent.text}`}>
                            <HardDrive size={24} />
                        </div>
                        <div>
                            <p className={`text-[10px] font-black uppercase tracking-widest ${t.textMuted(isDark)} mb-1`}>Total Size</p>
                            <p className={`text-xl font-black ${t.textPrimary(isDark)}`}>
                                {data.database.totalSize}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Header / Summary Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Health Score Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`col-span-1 md:col-span-2 rounded-[2.5rem] p-8 border ${t.border(isDark)} ${isDark ? 'bg-white/[0.03]' : 'bg-white shadow-xl shadow-black/5'} relative overflow-hidden`}
                >
                    <div className="relative z-10 flex flex-col sm:flex-row items-center gap-8">
                        <div className="relative w-32 h-32 flex items-center justify-center">
                            <svg className="w-full h-full -rotate-90">
                                <circle
                                    cx="64" cy="64" r="58"
                                    fill="transparent"
                                    stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
                                    strokeWidth="12"
                                />
                                <motion.circle
                                    cx="64" cy="64" r="58"
                                    fill="transparent"
                                    stroke="currentColor"
                                    strokeWidth="12"
                                    strokeDasharray={364.4}
                                    initial={{ strokeDashoffset: 364.4 }}
                                    animate={{ strokeDashoffset: 364.4 - (364.4 * stats.health_score) / 100 }}
                                    className={getScoreColor(stats.health_score)}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className={`text-3xl font-black ${t.textPrimary(isDark)}`}>{stats.health_score}</span>
                                <span className={`text-[9px] font-black uppercase tracking-widest ${t.textMuted(isDark)}`}>SCORE</span>
                            </div>
                        </div>

                        <div className="flex-1 space-y-4 text-center sm:text-left">
                            <div>
                                <h3 className={`text-lg font-black tracking-tight ${t.textPrimary(isDark)}`}>Redis Cache Health</h3>
                                <p className={`text-[11px] font-bold ${t.textMuted(isDark)} uppercase tracking-widest mt-1`}>
                                    Status: {stats.health_score > 80 ? 'Optimal' : stats.health_score > 60 ? 'Stable' : 'Attention Required'}
                                </p>
                            </div>
                            <div className="flex flex-wrap justify-center sm:justify-start gap-3">
                                <div className={`px-4 py-2 rounded-2xl border ${t.border(isDark)} ${isDark ? 'bg-white/5' : 'bg-neutral-50'} flex items-center gap-2`}>
                                    <Clock size={14} className={accent.text} />
                                    <span className={`text-[10px] font-black ${t.textPrimary(isDark)}`}>UP: {Math.floor(stats.uptime_in_seconds / 3600)}H</span>
                                </div>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => fetchData()}
                                    className={`rounded-2xl border-2 gap-2 text-[10px] font-black ${t.btnOutline(isDark)}`}
                                >
                                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> REFRESH METRICS
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Abstract Background Decoration */}
                    <div className={`absolute -right-10 -bottom-10 w-40 h-40 rounded-full blur-3xl opacity-20 ${accent.bg}`} />
                </motion.div >

                {/* Quick Stats Cards */}
                < div className="grid grid-cols-2 gap-4 col-span-1 md:col-span-2" >
                    {
                        [
                            { label: 'REDIS MEMORY', value: stats.used_memory_human, icon: HardDrive, trend: stats.used_memory },
                            { label: 'HIT RATIO', value: `${stats.hit_ratio.toFixed(1)}%`, icon: Zap, trend: stats.hit_ratio, color: stats.hit_ratio > 85 ? 'text-emerald-500' : 'text-amber-500' },
                            { label: 'CONNECTED', value: stats.connected_clients, icon: Users, sub: `${stats.blocked_clients} blocked` },
                            { label: 'DB SIZE', value: stats.dbsize, icon: Database, sub: 'Keys total' },
                        ].map((card, i) => (
                            <motion.div
                                key={card.label}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                                className={`rounded-[2rem] p-5 border ${t.border(isDark)} ${isDark ? 'bg-white/[0.03]' : 'bg-white shadow-lg shadow-black/5'} flex flex-col justify-between`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className={`w-8 h-8 rounded-xl ${isDark ? 'bg-white/5' : 'bg-neutral-50'} flex items-center justify-center ${accent.text}`}>
                                        <card.icon size={16} />
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <p className={`text-[9px] font-black uppercase tracking-[0.2em] ${t.textMuted(isDark)}`}>{card.label}</p>
                                    <p className={`text-lg font-black mt-1 ${t.textPrimary(isDark)} ${card.color || ''}`}>{card.value}</p>
                                    {card.sub && <p className={`text-[8px] font-black mt-0.5 ${t.textMuted(isDark)} uppercase tracking-wider`}>{card.sub}</p>}
                                </div>
                            </motion.div>
                        ))
                    }
                </div >
            </div >

            {/* Middle Row: Memory & Keyspace */}
            < div className="grid grid-cols-1 lg:grid-cols-3 gap-6" >
                {/* Memory Allocation */}
                < div className={`col-span-1 rounded-[2.5rem] p-8 border ${t.border(isDark)} ${isDark ? 'bg-white/[0.03]' : 'bg-white shadow-xl shadow-black/5'}`}>
                    <div className="flex items-center gap-3 mb-8">
                        <Activity className={accent.text} size={20} />
                        <h3 className={`text-sm font-black uppercase tracking-widest ${t.textPrimary(isDark)}`}>Memory Guard</h3>
                    </div>

                    <div className="space-y-8">
                        <div>
                            <div className="flex justify-between items-end mb-3">
                                <span className={`text-[10px] font-black uppercase tracking-widest ${t.textMuted(isDark)}`}>Allocated Memory</span>
                                <span className={`text-xs font-black ${t.textPrimary(isDark)}`}>{stats.used_memory_human} / {stats.maxmemory_human}</span>
                            </div>
                            <div className={`h-3 w-full rounded-full ${isDark ? 'bg-white/5' : 'bg-neutral-100'} overflow-hidden`}>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(100, (parseInt(stats.used_memory) / (parseInt(stats.maxmemory) || (parseInt(stats.used_memory) * 2))) * 100)}%` }}
                                    className={`h-full rounded-full ${accent.bg} transition-all duration-1000`}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className={`p-4 rounded-2xl border ${t.border(isDark)} ${isDark ? 'bg-white/5' : 'bg-neutral-50/50'}`}>
                                <p className={`text-[8px] font-black uppercase tracking-widest ${t.textMuted(isDark)} mb-1`}>Fragmentation</p>
                                <p className={`text-sm font-black ${stats.mem_fragmentation_ratio > 1.5 ? 'text-rose-500' : t.textPrimary(isDark)}`}>{stats.mem_fragmentation_ratio.toFixed(2)}x</p>
                            </div>
                            <div className={`p-4 rounded-2xl border ${t.border(isDark)} ${isDark ? 'bg-white/5' : 'bg-neutral-50/50'}`}>
                                <p className={`text-[8px] font-black uppercase tracking-widest ${t.textMuted(isDark)} mb-1`}>Evictions</p>
                                <p className={`text-sm font-black ${stats.evicted_keys > 0 ? 'text-rose-500' : t.textPrimary(isDark)}`}>{stats.evicted_keys}</p>
                            </div>
                        </div>
                    </div>
                </div >

                {/* Keyspace Distribution */}
                < div className={`col-span-1 lg:col-span-2 rounded-[2.5rem] p-8 border ${t.border(isDark)} ${isDark ? 'bg-white/[0.03]' : 'bg-white shadow-xl shadow-black/5'}`}>
                    <div className="flex items-center gap-3 mb-8">
                        <Cpu className={accent.text} size={20} />
                        <h3 className={`text-sm font-black uppercase tracking-widest ${t.textPrimary(isDark)}`}>Performance & Keyspace</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {/* Namespace Distribution */}
                        <div className="space-y-4">
                            <p className={`text-[10px] font-black uppercase tracking-widest ${t.textMuted(isDark)} mb-4`}>Namespace Distribution</p>
                            {Object.entries(stats.namespace_counts).map(([name, count], i) => {
                                const total = Object.values(stats.namespace_counts).reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? (count / total) * 100 : 0;
                                return (
                                    <div key={name} className="space-y-1.5">
                                        <div className="flex justify-between text-[9px] font-black uppercase tracking-tighter">
                                            <span className={t.textSecondary(isDark)}>{name}</span>
                                            <span className={t.textPrimary(isDark)}>{count} keys</span>
                                        </div>
                                        <div className={`h-1.5 w-full rounded-full ${isDark ? 'bg-white/5' : 'bg-neutral-100'}`}>
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${percentage}%` }}
                                                className={`h-full rounded-full ${accent.bg} opacity-80`}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Efficiency Metrics */}
                        <div className="space-y-6">
                            <div className={`p-6 rounded-[2rem] border ${t.border(isDark)} ${isDark ? 'bg-white/5' : 'bg-neutral-50/30'}`}>
                                <div className="flex items-center gap-2 mb-4">
                                    <Zap size={14} className="text-amber-400" />
                                    <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${t.textMuted(isDark)}`}>Cache Efficiency</p>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-end justify-between">
                                        <p className={`text-2xl font-black ${t.textPrimary(isDark)}`}>{stats.hit_ratio.toFixed(1)}%</p>
                                        <p className={`text-[10px] font-bold ${t.textMuted(isDark)}`}>{stats.keyspace_hits} Hits</p>
                                    </div>
                                    <div className={`h-2 w-full rounded-full ${isDark ? 'bg-white/10' : 'bg-neutral-200'} overflow-hidden`}>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${stats.hit_ratio}%` }}
                                            className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 px-2">
                                <Activity size={18} className={accent.text} />
                                <div>
                                    <p className={`text-[9px] font-black uppercase tracking-widest ${t.textMuted(isDark)}`}>Total Ops processed</p>
                                    <p className={`text-md font-black ${t.textPrimary(isDark)}`}>{stats.total_commands_processed.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div >
            </div >

            {/* Bottom Row: Leaderboards & Alerts */}
            < div className="grid grid-cols-1 lg:grid-cols-2 gap-6" >
                {/* Leaderboard Health Table */}
                < div className={`rounded-[2.5rem] p-8 border ${t.border(isDark)} ${isDark ? 'bg-white/[0.03]' : 'bg-white shadow-xl shadow-black/5'}`}>
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <Zap className={accent.text} size={20} />
                            <h3 className={`text-sm font-black uppercase tracking-widest ${t.textPrimary(isDark)}`}>Leaderboard Guard</h3>
                        </div>
                        <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border ${t.border(isDark)} ${t.textMuted(isDark)}`}>Limit: 1000 Members</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className={`border-b ${t.border(isDark)}`}>
                                    <th className={`pb-4 text-[9px] font-black uppercase tracking-widest ${t.textMuted(isDark)}`}>KEY ENTITY</th>
                                    <th className={`pb-4 text-[9px] font-black uppercase tracking-widest ${t.textMuted(isDark)}`}>MEMBERS</th>
                                    <th className={`pb-4 text-[9px] font-black uppercase tracking-widest ${t.textMuted(isDark)} text-right`}>STATUS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.02]">
                                {stats.leaderboard_health.length > 0 ? (
                                    stats.leaderboard_health.map((lb) => (
                                        <tr key={lb.key} className="group">
                                            <td className={`py-4 text-[11px] font-bold ${t.textPrimary(isDark)}`}>
                                                {lb.key.replace('lb:', '').toUpperCase()}
                                            </td>
                                            <td className={`py-4 text-[11px] font-black ${lb.size > 900 ? 'text-amber-500' : t.textSecondary(isDark)}`}>
                                                {lb.size}
                                            </td>
                                            <td className="py-4 text-right">
                                                {lb.is_safe ? (
                                                    <div className="flex items-center justify-end gap-1.5 text-emerald-500">
                                                        <span className="text-[8px] font-black tracking-widest uppercase">Safe</span>
                                                        <CheckCircle2 size={12} />
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-end gap-1.5 text-rose-500">
                                                        <span className="text-[8px] font-black tracking-widest uppercase">Critical</span>
                                                        <AlertTriangle size={12} />
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3} className={`py-10 text-center text-[10px] font-black uppercase ${t.textMuted(isDark)}`}>No Leaderboards Found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div >

                {/* Alerts System */}
                < div className={`rounded-[2.5rem] p-8 border ${t.border(isDark)} ${isDark ? 'bg-white/[0.03]' : 'bg-white shadow-xl shadow-black/5'}`}>
                    <div className="flex items-center gap-3 mb-8">
                        <ShieldAlert className={accent.text} size={20} />
                        <h3 className={`text-sm font-black uppercase tracking-widest ${t.textPrimary(isDark)}`}>Engine Alerts</h3>
                    </div>

                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {stats.alerts.length > 0 ? (
                            stats.alerts.map((alert, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className={`p-5 rounded-2xl flex items-start gap-4 border transition-all hover:translate-x-1 ${isDark ? 'bg-rose-500/10 border-rose-500/20' : 'bg-rose-50 border-rose-100 shadow-sm'}`}
                                >
                                    <AlertTriangle className="text-rose-500 flex-shrink-0 mt-0.5" size={18} />
                                    <div>
                                        <p className={`text-[11px] font-black tracking-tight ${isDark ? 'text-rose-200' : 'text-rose-900'}`}>{alert}</p>
                                        <p className={`text-[9px] font-bold mt-1 opacity-60 ${isDark ? 'text-rose-200' : 'text-rose-700'}`}>Potential performance impact detected.</p>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10 opacity-30 grayscale pointer-events-none">
                                <CheckCircle2 size={40} className="text-emerald-500 mb-4" />
                                <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${t.textPrimary(isDark)}`}>System Optimal</p>
                                <p className={`text-[8px] font-bold ${t.textMuted(isDark)} uppercase mt-2`}>No current alerts detected</p>
                            </div>
                        )}

                        <div className={`mt-10 p-5 rounded-2xl border border-dashed ${t.border(isDark)} flex items-start gap-4`}>
                            <Info className={t.textMuted(isDark)} size={16} />
                            <p className={`text-[9px] font-bold leading-relaxed ${t.textMuted(isDark)}`}>
                                Monitoring is performing <span className={`font-black uppercase tracking-widest ${t.textPrimary(isDark)}`}>Sampled Scan</span> logic to maintain production efficiency. Real-time metrics are updated every 30 seconds.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Database Diagnostics Card */}
                <div className={`rounded-[2.5rem] p-8 border ${t.border(isDark)} ${isDark ? 'bg-white/[0.03]' : 'bg-white shadow-xl shadow-black/5'}`}>
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <ShieldAlert className={accent.text} size={20} />
                            <h3 className={`text-sm font-black uppercase tracking-widest ${t.textPrimary(isDark)}`}>Database Diagnostics</h3>
                        </div>
                        <Button
                            type="button"
                            size="sm"
                            disabled={diagnosing}
                            onClick={async () => {
                                setDiagnosing(true);
                                try {
                                    const res = await runDatabaseDiagnostics();
                                    setDiagResults(res);
                                    if (res.status === 'ok') {
                                        toast.success('Database integrity: All clear');
                                    } else {
                                        toast.warning(`Found ${res.issues.length} issue${res.issues.length > 1 ? 's' : ''}`);
                                    }
                                } catch (err: any) {
                                    toast.error('Diagnostics error: ' + err.message);
                                } finally {
                                    setDiagnosing(false);
                                }
                            }}
                            className={`rounded-full h-10 px-6 font-black uppercase tracking-widest text-[9px] ${t.btnPrimary(isDark, accent)}`}
                        >
                            {diagnosing ? <RefreshCw className="animate-spin mr-2" size={13} /> : null}
                            {diagnosing ? 'Checking...' : 'Run Check'}
                        </Button>
                    </div>

                    {diagResults ? (
                        <div className="space-y-4">
                            <div className={`p-6 rounded-2xl border-2 ${diagResults.status === 'ok'
                                ? `border-emerald-500/20 ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-50'}`
                                : `border-rose-500/20 ${isDark ? 'bg-rose-500/10' : 'bg-rose-50'}`
                            }`}>
                                <div className="flex items-center gap-3">
                                    {diagResults.status === 'ok' ? (
                                        <CheckCircle2 className="text-emerald-500" size={24} />
                                    ) : (
                                        <AlertTriangle className="text-rose-500" size={24} />
                                    )}
                                    <div>
                                        <p className={`text-sm font-black ${diagResults.status === 'ok' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {diagResults.status === 'ok' ? 'Database Healthy' : `${diagResults.issues.length} Issue${diagResults.issues.length > 1 ? 's' : ''} Found`}
                                        </p>
                                        <p className={`text-[10px] font-bold mt-1 ${diagResults.status === 'ok' ? (isDark ? 'text-emerald-200' : 'text-emerald-700') : (isDark ? 'text-rose-200' : 'text-rose-700')}`}>
                                            Checked {diagResults.tablesChecked} table{diagResults.tablesChecked > 1 ? 's' : ''}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            {diagResults.issues.length > 0 && (
                                <div className="space-y-2">
                                    <p className={`text-[10px] font-black uppercase tracking-widest ${t.textMuted(isDark)}`}>Found Issues:</p>
                                    {diagResults.issues.map((issue, i) => (
                                        <div key={i} className={`p-3 rounded-lg flex gap-2 ${isDark ? 'bg-white/5' : 'bg-neutral-50'}`}>
                                            <AlertTriangle className="text-rose-500 flex-shrink-0 mt-0.5" size={14} />
                                            <p className={`text-[9px] font-bold leading-relaxed ${t.textSecondary(isDark)}`}>{issue}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className={`p-6 rounded-2xl border border-dashed ${t.border(isDark)} text-center`}>
                            <p className={`text-[10px] font-black uppercase tracking-widest ${t.textMuted(isDark)}`}>
                                Click "Run Check" to validate database integrity and detect orphaned records
                            </p>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}
