'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdminTheme, t } from '@/modules/super-admin/theme-context';
import { getSystemHealth } from '@/modules/super-admin/actions/redis-monitoring';
import { METRIC_EXPLANATIONS } from '@/modules/super-admin/components/metric-tooltips';
import { Button } from '@/components/ui/button';
import {
  Database, Activity, Zap, ShieldAlert, CheckCircle2,
  RefreshCw, Cpu, HardDrive, Users, Clock, AlertTriangle, Info, Server, Network,
  ChevronDown, ChevronUp, Eye, EyeOff
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from 'sonner';

export default function InfrastructureMonitorPage() {
  const { isDark, accent } = useAdminTheme();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    server: true,
    redis: true,
    database: true,
    keyspace: false,
    alerts: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const fetched = await getSystemHealth();
      setData(fetched);
    } catch (err) {
      toast.error('Failed to fetch infrastructure metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center gap-4 ${isDark ? 'bg-[#09090b]' : 'bg-slate-50'}`}>
        <RefreshCw className={`w-8 h-8 animate-spin ${accent.text}`} />
        <p className={`text-xs font-black uppercase tracking-widest ${t.textMuted(isDark)}`}>
          Loading Infrastructure Metrics...
        </p>
      </div>
    );
  }

  if (!data) return null;

  const stats = data.redis;
  const server = data.server;
  const database = data.database;

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-500';
    if (score >= 70) return 'text-amber-500';
    return 'text-rose-500';
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#09090b]' : 'bg-slate-50'}`}>
      {/* Header */}
      <div className={`sticky top-0 z-50 border-b ${t.border(isDark)} ${isDark ? 'bg-[#09090b]/95 backdrop-blur' : 'bg-white/95 backdrop-blur'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className={`text-3xl font-black ${t.textPrimary(isDark)} tracking-tighter`}>
                Infrastructure Monitor
              </h1>
              <p className={`text-sm font-medium ${t.textMuted(isDark)} mt-1`}>
                Real-time server, Redis cache, and database health metrics
              </p>
            </div>
            <div className="flex gap-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => setShowDetails(!showDetails)}
                      variant="outline"
                      className={`rounded-2xl gap-2 font-black uppercase text-xs ${t.btnOutline(isDark)}`}
                    >
                      {showDetails ? (
                        <>
                          <EyeOff size={16} />
                          Hide Details
                        </>
                      ) : (
                        <>
                          <Eye size={16} />
                          Show Details
                        </>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Toggle detailed metric explanations and thresholds</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Button
                onClick={fetchData}
                disabled={loading}
                className={`rounded-2xl gap-2 font-black uppercase text-xs ${t.btnPrimary(isDark, accent)}`}
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* QUICK VIEW: SERVER HEALTH */}
        <motion.div
          className={`rounded-[2.5rem] p-8 border ${t.border(isDark)} ${isDark ? 'bg-white/[0.03]' : 'bg-white shadow-xl shadow-black/5'} relative overflow-hidden`}
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                <Server className={accent.text} size={24} />
              </div>
              <div>
                <h2 className={`text-lg font-black tracking-tight ${t.textPrimary(isDark)}`}>
                  {METRIC_EXPLANATIONS.server.title}
                </h2>
                <p className={`text-xs font-medium ${t.textMuted(isDark)} mt-1`}>
                  {METRIC_EXPLANATIONS.server.description}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className={`px-4 py-2 rounded-2xl border ${t.border(isDark)} ${server.nodeEnv === 'production' ? (isDark ? 'bg-emerald-500/10' : 'bg-emerald-50') : (isDark ? 'bg-amber-500/10' : 'bg-amber-50')} flex items-center gap-2`}>
                <Activity size={14} className={server.nodeEnv === 'production' ? 'text-emerald-500' : 'text-amber-500'} />
                <span className={`text-[10px] font-black ${server.nodeEnv === 'production' ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {server.nodeEnv.toUpperCase()}
                </span>
              </div>
              <div className={`px-4 py-2 rounded-2xl border ${t.border(isDark)} ${isDark ? 'bg-white/5' : 'bg-neutral-50'} flex items-center gap-2`}>
                <Clock size={14} className={accent.text} />
                <span className={`text-[10px] font-black ${t.textPrimary(isDark)}`}>
                  {server.appUptimeHours}H
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* CPU Load */}
            <QuickMetricCard
              icon={Cpu}
              label="CPU Load"
              value={`${server.loadAvg1m.toFixed(2)}`}
              unit={`/ ${server.cpuCount}`}
              usage={Math.min(100, (server.loadAvg1m / server.cpuCount) * 100)}
              status={server.loadAvg1m > server.cpuCount * 0.8 ? 'critical' : 'good'}
              isDark={isDark}
              accent={accent}
              tooltip="CPU usage across all cores. Safe: < core count"
              explanation={showDetails ? METRIC_EXPLANATIONS.server.metrics.cpuLoad : undefined}
            />

            {/* OS Memory */}
            <QuickMetricCard
              icon={HardDrive}
              label="OS RAM"
              value={`${server.memUsagePercent.toFixed(1)}%`}
              usage={server.memUsagePercent}
              status={server.memUsagePercent > 85 ? 'critical' : server.memUsagePercent > 70 ? 'warning' : 'good'}
              isDark={isDark}
              accent={accent}
              tooltip="Physical server memory. Safe: < 70%"
              explanation={showDetails ? METRIC_EXPLANATIONS.server.metrics.memory : undefined}
            />

            {/* Node Heap */}
            <QuickMetricCard
              icon={Activity}
              label="Node Heap"
              value={`${server.heapUsagePercent.toFixed(1)}%`}
              usage={server.heapUsagePercent}
              status={server.heapUsagePercent > 85 ? 'critical' : server.heapUsagePercent > 70 ? 'warning' : 'good'}
              isDark={isDark}
              accent={accent}
              tooltip="App memory usage. Safe: < 60%"
              explanation={showDetails ? METRIC_EXPLANATIONS.server.metrics.nodeHeap : undefined}
            />

            {/* Database Latency */}
            <QuickMetricCard
              icon={Activity}
              label="DB Latency"
              value={`${database.pingMs}ms`}
              status={database.pingMs < 50 ? 'good' : database.pingMs < 100 ? 'warning' : 'critical'}
              isDark={isDark}
              accent={accent}
              tooltip="Database round-trip time. Excellent: < 10ms"
              explanation={showDetails ? METRIC_EXPLANATIONS.database.metrics.latency : undefined}
            />

            {/* Redis Health */}
            <QuickMetricCard
              icon={CheckCircle2}
              label="Redis Health"
              value={`${stats.health_score}/100`}
              status={stats.health_score >= 90 ? 'good' : stats.health_score >= 70 ? 'warning' : 'critical'}
              isDark={isDark}
              accent={accent}
              tooltip="Overall cache system health"
              explanation={showDetails ? METRIC_EXPLANATIONS.redis.metrics.healthScore : undefined}
            />
          </div>
        </motion.div>

        {/* DETAILED ANALYSIS SECTION */}
        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* SERVER DETAILS */}
              <motion.div
                className={`rounded-[2rem] border ${t.border(isDark)} ${isDark ? 'bg-white/[0.03]' : 'bg-white shadow-lg'} overflow-hidden`}
              >
                <button
                  onClick={() => toggleSection('server')}
                  className={`w-full p-6 flex items-center justify-between hover:opacity-75 transition-opacity`}
                >
                  <div className="flex items-center gap-3">
                    <h3 className={`text-base font-black tracking-tight ${t.textPrimary(isDark)}`}>
                      Server Metrics Details
                    </h3>
                  </div>
                  {expandedSections.server ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>

                {expandedSections.server && (
                  <div className={`border-t ${t.border(isDark)} p-6 space-y-4`}>
                    <DetailRow
                      label="CPU Load (1m/5m/15m)"
                      value={`${server.loadAvg1m.toFixed(2)} / ${server.loadAvg5m.toFixed(2)} / ${server.loadAvg15m.toFixed(2)}`}
                      explanation={METRIC_EXPLANATIONS.server.metrics.cpuLoad.explanation}
                      isDark={isDark}
                    />
                    <DetailRow
                      label="Memory Usage"
                      value={`${server.usedMemMb} MB / ${server.totalMemMb} MB (${server.memUsagePercent.toFixed(1)}%)`}
                      explanation={METRIC_EXPLANATIONS.server.metrics.memory.explanation}
                      isDark={isDark}
                    />
                    <DetailRow
                      label="Node.js Heap"
                      value={`${server.heapUsedMb} MB / ${server.heapTotalMb} MB (${server.heapUsagePercent.toFixed(1)}%)`}
                      explanation={METRIC_EXPLANATIONS.server.metrics.nodeHeap.explanation}
                      isDark={isDark}
                    />
                    <DetailRow
                      label="System Uptime"
                      value={`OS: ${server.uptimeHours}H | App: ${server.appUptimeHours}H`}
                      explanation={METRIC_EXPLANATIONS.server.metrics.uptime.explanation}
                      isDark={isDark}
                    />
                  </div>
                )}
              </motion.div>

              {/* REDIS DETAILS */}
              <motion.div
                className={`rounded-[2rem] border ${t.border(isDark)} ${isDark ? 'bg-white/[0.03]' : 'bg-white shadow-lg'} overflow-hidden`}
              >
                <button
                  onClick={() => toggleSection('redis')}
                  className={`w-full p-6 flex items-center justify-between hover:opacity-75 transition-opacity`}
                >
                  <div className="flex items-center gap-3">
                    <h3 className={`text-base font-black tracking-tight ${t.textPrimary(isDark)}`}>
                      Redis Cache Details
                    </h3>
                  </div>
                  {expandedSections.redis ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>

                {expandedSections.redis && (
                  <div className={`border-t ${t.border(isDark)} p-6 space-y-4`}>
                    <DetailRow
                      label="Health Score"
                      value={`${stats.health_score}/100 (${stats.health_score >= 90 ? 'Optimal' : stats.health_score >= 70 ? 'Stable' : 'Attention Required'})`}
                      explanation={METRIC_EXPLANATIONS.redis.metrics.healthScore.explanation}
                      isDark={isDark}
                    />
                    <DetailRow
                      label="Hit Ratio"
                      value={`${stats.hit_ratio.toFixed(1)}%`}
                      explanation={METRIC_EXPLANATIONS.redis.metrics.hitRatio.explanation}
                      isDark={isDark}
                    />
                    <DetailRow
                      label="Memory Usage"
                      value={`${stats.used_memory_human} / ${stats.maxmemory_human}`}
                      explanation={METRIC_EXPLANATIONS.redis.metrics.memory.explanation}
                      isDark={isDark}
                    />
                    <DetailRow
                      label="Evicted Keys"
                      value={`${stats.evicted_keys} keys`}
                      explanation={METRIC_EXPLANATIONS.redis.metrics.evictions.explanation}
                      isDark={isDark}
                    />
                    <DetailRow
                      label="Connected Clients"
                      value={`${stats.connected_clients} active`}
                      explanation={METRIC_EXPLANATIONS.redis.metrics.connectedClients.explanation}
                      isDark={isDark}
                    />
                    <DetailRow
                      label="Memory Fragmentation"
                      value={`${stats.mem_fragmentation_ratio.toFixed(2)}x`}
                      explanation={METRIC_EXPLANATIONS.redis.metrics.fragmentation.explanation}
                      isDark={isDark}
                    />
                  </div>
                )}
              </motion.div>

              {/* DATABASE DETAILS */}
              <motion.div
                className={`rounded-[2rem] border ${t.border(isDark)} ${isDark ? 'bg-white/[0.03]' : 'bg-white shadow-lg'} overflow-hidden`}
              >
                <button
                  onClick={() => toggleSection('database')}
                  className={`w-full p-6 flex items-center justify-between hover:opacity-75 transition-opacity`}
                >
                  <div className="flex items-center gap-3">
                    <h3 className={`text-base font-black tracking-tight ${t.textPrimary(isDark)}`}>
                      Database Details
                    </h3>
                  </div>
                  {expandedSections.database ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>

                {expandedSections.database && (
                  <div className={`border-t ${t.border(isDark)} p-6 space-y-4`}>
                    <DetailRow
                      label="Latency (Ping)"
                      value={`${database.pingMs}ms`}
                      explanation={METRIC_EXPLANATIONS.database.metrics.latency.explanation}
                      isDark={isDark}
                    />
                    <DetailRow
                      label="Active Connections"
                      value={`${database.activeConnections} queries`}
                      explanation={METRIC_EXPLANATIONS.database.metrics.activeConnections.explanation}
                      isDark={isDark}
                    />
                    <DetailRow
                      label="Database Size"
                      value={database.totalSize}
                      explanation={METRIC_EXPLANATIONS.database.metrics.dbSize.explanation}
                      isDark={isDark}
                    />
                  </div>
                )}
              </motion.div>

              {/* KEYSPACE DISTRIBUTION */}
              <motion.div
                className={`rounded-[2rem] border ${t.border(isDark)} ${isDark ? 'bg-white/[0.03]' : 'bg-white shadow-lg'} overflow-hidden`}
              >
                <button
                  onClick={() => toggleSection('keyspace')}
                  className={`w-full p-6 flex items-center justify-between hover:opacity-75 transition-opacity`}
                >
                  <div className="flex items-center gap-3">
                    <h3 className={`text-base font-black tracking-tight ${t.textPrimary(isDark)}`}>
                      Redis Keyspace Breakdown
                    </h3>
                  </div>
                  {expandedSections.keyspace ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>

                {expandedSections.keyspace && (
                  <div className={`border-t ${t.border(isDark)} p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`}>
                    {Object.entries(METRIC_EXPLANATIONS.keyspace.namespaces).map(([key, namespace]: any) => (
                      <div
                        key={key}
                        className={`p-4 rounded-xl border ${t.border(isDark)} ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}
                      >
                        <p className={`text-xs font-black uppercase tracking-widest ${t.textMuted(isDark)} mb-2`}>
                          {namespace.label}
                        </p>
                        <p className={`text-lg font-black ${t.textPrimary(isDark)} mb-3`}>
                          {stats.namespace_counts[key]} keys
                        </p>
                        <p className={`text-[10px] ${t.textMuted(isDark)} mb-2`}>
                          <strong>Purpose:</strong> {namespace.purpose}
                        </p>
                        <p className={`text-[10px] font-mono ${accent.text} truncate`}>
                          {namespace.example}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* ALERTS */}
              {data.redis.alerts && data.redis.alerts.length > 0 && (
                <motion.div
                  className={`rounded-[2rem] border-2 border-rose-500/30 ${isDark ? 'bg-rose-500/5' : 'bg-rose-50'} overflow-hidden`}
                >
                  <button
                    onClick={() => toggleSection('alerts')}
                    className={`w-full p-6 flex items-center justify-between hover:opacity-75 transition-opacity`}
                  >
                    <div className="flex items-center gap-3">
                      <h3 className={`text-base font-black tracking-tight text-rose-500`}>
                        Active Alerts ({data.redis.alerts.length})
                      </h3>
                    </div>
                    {expandedSections.alerts ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>

                  {expandedSections.alerts && (
                    <div className={`border-t border-rose-500/30 p-6 space-y-3`}>
                      {data.redis.alerts.map((alert: string, i: number) => (
                        <div
                          key={i}
                          className={`p-4 rounded-xl border border-rose-500/20 ${isDark ? 'bg-rose-500/5' : 'bg-rose-50'}`}
                        >
                          <p className={`text-sm font-bold text-rose-500`}>⚠ {alert}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

// Quick Metric Card Component
function QuickMetricCard({
  icon: Icon,
  label,
  value,
  unit,
  usage,
  status,
  isDark,
  accent,
  tooltip,
  explanation,
}: any) {
  const [showExplanation, setShowExplanation] = useState(false);

  const statusColorMap: Record<string, string> = {
    good: 'text-emerald-500',
    warning: 'text-amber-500',
    critical: 'text-rose-500'
  };
  const statusColor = statusColorMap[status as keyof typeof statusColorMap];

  return (
    <TooltipProvider>
      <div
        className={`p-4 rounded-2xl border ${isDark ? 'border-white/10 bg-white/[0.02]' : 'border-slate-200 bg-slate-50'} space-y-3 relative group`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-white'}`}>
              <Icon className={accent.text} size={16} />
            </div>
            <div className="flex-1">
              <p className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {label}
              </p>
              <p className={`text-lg font-black ${statusColor}`}>
                {value}
                {unit && <span className={`text-xs font-bold ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{unit}</span>}
              </p>
            </div>
          </div>
          <Popover open={showExplanation} onOpenChange={setShowExplanation}>
            <PopoverTrigger asChild>
              <button className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-white'}`}>
                <Info size={14} className={accent.text} />
              </button>
            </PopoverTrigger>
            {explanation && (
              <PopoverContent side="left" className="w-80">
                <div className="space-y-3">
                  <h4 className="font-bold text-sm">{label}</h4>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{explanation.explanation}</p>
                  {explanation.thresholds && (
                    <div className={`mt-4 p-3 rounded ${isDark ? 'bg-white/10' : 'bg-slate-100'} text-xs space-y-1`}>
                      <p className="font-bold">Thresholds:</p>
                      {Object.entries(explanation.thresholds).map(([key, val]: any) => (
                        <p key={key}>• {key}: {val}</p>
                      ))}
                    </div>
                  )}
                </div>
              </PopoverContent>
            )}
          </Popover>
        </div>

        {usage !== undefined && (
          <div className={`h-2 w-full rounded-full ${isDark ? 'bg-white/10' : 'bg-white'} overflow-hidden`}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, usage)}%` }}
              className={`h-full rounded-full ${status === 'critical' ? 'bg-rose-500' : status === 'warning' ? 'bg-amber-500' : accent.bg}`}
              transition={{ duration: 0.5 }}
            />
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

// Detail Row Component
function DetailRow({
  label,
  value,
  explanation,
  isDark,
}: any) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className={`w-full text-left p-4 rounded-xl border ${isDark ? 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'} transition-colors`}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className={`text-xs font-black uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {label}
              </p>
              <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'} mt-1`}>
                {value}
              </p>
            </div>
            <Info size={16} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent side="right" className="w-80">
        <div className="space-y-3">
          <h4 className="font-bold text-sm">{label}</h4>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{explanation}</p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
