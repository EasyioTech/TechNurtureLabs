'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAdminTheme, t } from '@/modules/super-admin/theme-context';
import { getSystemHealth } from '@/modules/super-admin/actions/redis-monitoring';
import { METRIC_EXPLANATIONS } from '@/modules/super-admin/components/metric-tooltips';
import { Button } from '@/components/ui/button';
import {
  Database, Activity, Zap, ShieldAlert, CheckCircle2,
  RefreshCw, Cpu, HardDrive, Users, Clock, AlertTriangle, Info, Server, Network,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { toast } from 'sonner';

export default function EngineMetricsPage() {
  const { isDark, accent } = useAdminTheme();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    server: true,
    redis: true,
    database: true,
    keyspace: true,
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
      toast.error('Failed to fetch metrics');
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
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <RefreshCw className={`w-8 h-8 animate-spin ${accent.text}`} />
        <p className={`text-xs font-black uppercase tracking-widest ${t.textMuted(isDark)}`}>
          Loading Engine Metrics...
        </p>
      </div>
    );
  }

  if (!data) return null;

  const stats = data.redis;
  const server = data.server;
  const database = data.database;

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#09090b]' : 'bg-slate-50'}`}>
      {/* Header */}
      <div className={`sticky top-0 z-50 border-b ${t.border(isDark)} ${isDark ? 'bg-[#09090b]/95 backdrop-blur' : 'bg-white/95 backdrop-blur'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className={`text-3xl font-black ${t.textPrimary(isDark)} tracking-tighter`}>
                Engine Intelligence
              </h1>
              <p className={`text-sm font-medium ${t.textMuted(isDark)} mt-1`}>
                Real-time infrastructure metrics and performance analysis
              </p>
            </div>
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

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* SERVER HEALTH SECTION */}
        <motion.div
          className={`rounded-[2rem] border ${t.border(isDark)} ${isDark ? 'bg-white/[0.03]' : 'bg-white shadow-lg'} overflow-hidden`}
        >
          <button
            onClick={() => toggleSection('server')}
            className={`w-full p-6 flex items-center justify-between hover:opacity-75 transition-opacity`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                <Server className={accent.text} size={24} />
              </div>
              <div className="text-left">
                <h2 className={`text-lg font-black tracking-tight ${t.textPrimary(isDark)}`}>
                  {METRIC_EXPLANATIONS.server.title}
                </h2>
                <p className={`text-xs font-medium ${t.textMuted(isDark)} mt-1`}>
                  {METRIC_EXPLANATIONS.server.description}
                </p>
              </div>
            </div>
            {expandedSections.server ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>

          {expandedSections.server && (
            <div className={`border-t ${t.border(isDark)} p-6 space-y-6`}>
              {/* CPU Load */}
              <DetailCard
                icon={Cpu}
                label="CPU Load"
                value={`${server.loadAvg1m.toFixed(2)} (${Math.min(100, (server.loadAvg1m / server.cpuCount) * 100).toFixed(1)}%)`}
                unit="cores"
                explanation={METRIC_EXPLANATIONS.server.metrics.cpuLoad}
                isDark={isDark}
                accent={accent}
              >
                <div className="space-y-3 mt-4">
                  <div className="flex justify-between text-xs">
                    <span className={t.textSecondary(isDark)}>1 minute:</span>
                    <span className={t.textPrimary(isDark)}>{server.loadAvg1m.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className={t.textSecondary(isDark)}>5 minutes:</span>
                    <span className={t.textPrimary(isDark)}>{server.loadAvg5m.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className={t.textSecondary(isDark)}>15 minutes:</span>
                    <span className={t.textPrimary(isDark)}>{server.loadAvg15m.toFixed(2)}</span>
                  </div>
                  <div className={`p-3 rounded-xl border ${t.border(isDark)} ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${t.textMuted(isDark)}`}>Safe Range</p>
                    <p className={`text-sm font-black ${t.textPrimary(isDark)} mt-1`}>≤ {server.cpuCount} ({server.cpuCount} cores)</p>
                  </div>
                </div>
              </DetailCard>

              {/* OS Memory */}
              <DetailCard
                icon={HardDrive}
                label="OS RAM Usage"
                value={`${server.memUsagePercent.toFixed(1)}%`}
                explanation={METRIC_EXPLANATIONS.server.metrics.memory}
                isDark={isDark}
                accent={accent}
              >
                <div className="space-y-3 mt-4">
                  <div className="flex justify-between text-xs">
                    <span className={t.textSecondary(isDark)}>Used:</span>
                    <span className={t.textPrimary(isDark)}>{server.usedMemMb} MB</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className={t.textSecondary(isDark)}>Total:</span>
                    <span className={t.textPrimary(isDark)}>{server.totalMemMb} MB</span>
                  </div>
                  <div className={`h-3 w-full rounded-full ${isDark ? 'bg-white/10' : 'bg-slate-200'} overflow-hidden`}>
                    <div
                      className={`h-full rounded-full transition-all ${server.memUsagePercent > 85 ? 'bg-rose-500' : accent.bg}`}
                      style={{ width: `${server.memUsagePercent}%` }}
                    />
                  </div>
                </div>
              </DetailCard>

              {/* Node Heap */}
              <DetailCard
                icon={Activity}
                label="Node.js Heap"
                value={`${server.heapUsagePercent.toFixed(1)}%`}
                explanation={METRIC_EXPLANATIONS.server.metrics.nodeHeap}
                isDark={isDark}
                accent={accent}
              >
                <div className="space-y-3 mt-4">
                  <div className="flex justify-between text-xs">
                    <span className={t.textSecondary(isDark)}>Used:</span>
                    <span className={t.textPrimary(isDark)}>{server.heapUsedMb} MB</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className={t.textSecondary(isDark)}>Limit:</span>
                    <span className={t.textPrimary(isDark)}>{server.heapTotalMb} MB</span>
                  </div>
                  <div className={`h-3 w-full rounded-full ${isDark ? 'bg-white/10' : 'bg-slate-200'} overflow-hidden`}>
                    <div
                      className={`h-full rounded-full transition-all ${server.heapUsagePercent > 85 ? 'bg-rose-500' : accent.bg}`}
                      style={{ width: `${server.heapUsagePercent}%` }}
                    />
                  </div>
                </div>
              </DetailCard>

              {/* Uptime */}
              <DetailCard
                icon={Clock}
                label="Uptime"
                value={`${server.appUptimeHours}H`}
                unit="Application"
                explanation={METRIC_EXPLANATIONS.server.metrics.uptime}
                isDark={isDark}
                accent={accent}
              >
                <div className="space-y-3 mt-4">
                  <div className="flex justify-between text-xs">
                    <span className={t.textSecondary(isDark)}>Server (OS):</span>
                    <span className={t.textPrimary(isDark)}>{server.uptimeHours}H</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className={t.textSecondary(isDark)}>App (Node):</span>
                    <span className={t.textPrimary(isDark)}>{server.appUptimeHours}H</span>
                  </div>
                </div>
              </DetailCard>
            </div>
          )}
        </motion.div>

        {/* REDIS CACHE SECTION */}
        <motion.div
          className={`rounded-[2rem] border ${t.border(isDark)} ${isDark ? 'bg-white/[0.03]' : 'bg-white shadow-lg'} overflow-hidden`}
        >
          <button
            onClick={() => toggleSection('redis')}
            className={`w-full p-6 flex items-center justify-between hover:opacity-75 transition-opacity`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                <Zap className={accent.text} size={24} />
              </div>
              <div className="text-left">
                <h2 className={`text-lg font-black tracking-tight ${t.textPrimary(isDark)}`}>
                  {METRIC_EXPLANATIONS.redis.title}
                </h2>
                <p className={`text-xs font-medium ${t.textMuted(isDark)} mt-1`}>
                  {METRIC_EXPLANATIONS.redis.description}
                </p>
              </div>
            </div>
            {expandedSections.redis ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>

          {expandedSections.redis && (
            <div className={`border-t ${t.border(isDark)} p-6 space-y-6`}>
              {/* Health Score */}
              <DetailCard
                icon={CheckCircle2}
                label="Health Score"
                value={`${stats.health_score}/100`}
                explanation={METRIC_EXPLANATIONS.redis.metrics.healthScore}
                isDark={isDark}
                accent={accent}
              >
                <div className="mt-4 p-4 rounded-xl border" style={{
                  borderColor: stats.health_score >= 90 ? '#10b981' : stats.health_score >= 70 ? '#f59e0b' : '#ef4444',
                  backgroundColor: stats.health_score >= 90 ? 'rgba(16, 185, 129, 0.1)' : stats.health_score >= 70 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)'
                }}>
                  <p className={`text-sm font-black`} style={{
                    color: stats.health_score >= 90 ? '#10b981' : stats.health_score >= 70 ? '#f59e0b' : '#ef4444'
                  }}>
                    {stats.health_score >= 90 ? '✓ Optimal' : stats.health_score >= 70 ? '⚠ Stable' : '✗ Attention Required'}
                  </p>
                </div>
              </DetailCard>

              {/* Hit Ratio */}
              <DetailCard
                icon={Zap}
                label="Cache Hit Ratio"
                value={`${stats.hit_ratio.toFixed(1)}%`}
                explanation={METRIC_EXPLANATIONS.redis.metrics.hitRatio}
                isDark={isDark}
                accent={accent}
              />

              {/* Memory Usage */}
              <DetailCard
                icon={HardDrive}
                label="Redis Memory"
                value={stats.used_memory_human}
                unit={`/ ${stats.maxmemory_human}`}
                explanation={METRIC_EXPLANATIONS.redis.metrics.memory}
                isDark={isDark}
                accent={accent}
              />

              {/* Evictions */}
              <DetailCard
                icon={AlertTriangle}
                label="Evicted Keys"
                value={stats.evicted_keys}
                explanation={METRIC_EXPLANATIONS.redis.metrics.evictions}
                isDark={isDark}
                accent={accent}
              />

              {/* Connected Clients */}
              <DetailCard
                icon={Users}
                label="Connected Clients"
                value={stats.connected_clients}
                unit="clients"
                explanation={METRIC_EXPLANATIONS.redis.metrics.connectedClients}
                isDark={isDark}
                accent={accent}
              />

              {/* Fragmentation */}
              <DetailCard
                icon={Activity}
                label="Memory Fragmentation"
                value={`${stats.mem_fragmentation_ratio.toFixed(2)}x`}
                explanation={METRIC_EXPLANATIONS.redis.metrics.fragmentation}
                isDark={isDark}
                accent={accent}
              />
            </div>
          )}
        </motion.div>

        {/* DATABASE SECTION */}
        <motion.div
          className={`rounded-[2rem] border ${t.border(isDark)} ${isDark ? 'bg-white/[0.03]' : 'bg-white shadow-lg'} overflow-hidden`}
        >
          <button
            onClick={() => toggleSection('database')}
            className={`w-full p-6 flex items-center justify-between hover:opacity-75 transition-opacity`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                <Database className={accent.text} size={24} />
              </div>
              <div className="text-left">
                <h2 className={`text-lg font-black tracking-tight ${t.textPrimary(isDark)}`}>
                  {METRIC_EXPLANATIONS.database.title}
                </h2>
                <p className={`text-xs font-medium ${t.textMuted(isDark)} mt-1`}>
                  {METRIC_EXPLANATIONS.database.description}
                </p>
              </div>
            </div>
            {expandedSections.database ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>

          {expandedSections.database && (
            <div className={`border-t ${t.border(isDark)} p-6 space-y-6`}>
              {/* Latency */}
              <DetailCard
                icon={Activity}
                label="Database Latency"
                value={`${database.pingMs} ms`}
                explanation={METRIC_EXPLANATIONS.database.metrics.latency}
                isDark={isDark}
                accent={accent}
              />

              {/* Active Connections */}
              <DetailCard
                icon={Users}
                label="Active Connections"
                value={database.activeConnections}
                unit="queries"
                explanation={METRIC_EXPLANATIONS.database.metrics.activeConnections}
                isDark={isDark}
                accent={accent}
              />

              {/* Database Size */}
              <DetailCard
                icon={HardDrive}
                label="Database Size"
                value={database.totalSize}
                explanation={METRIC_EXPLANATIONS.database.metrics.dbSize}
                isDark={isDark}
                accent={accent}
              />
            </div>
          )}
        </motion.div>

        {/* KEYSPACE SECTION */}
        <motion.div
          className={`rounded-[2rem] border ${t.border(isDark)} ${isDark ? 'bg-white/[0.03]' : 'bg-white shadow-lg'} overflow-hidden`}
        >
          <button
            onClick={() => toggleSection('keyspace')}
            className={`w-full p-6 flex items-center justify-between hover:opacity-75 transition-opacity`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                <Network className={accent.text} size={24} />
              </div>
              <div className="text-left">
                <h2 className={`text-lg font-black tracking-tight ${t.textPrimary(isDark)}`}>
                  {METRIC_EXPLANATIONS.keyspace.title}
                </h2>
                <p className={`text-xs font-medium ${t.textMuted(isDark)} mt-1`}>
                  {METRIC_EXPLANATIONS.keyspace.description}
                </p>
              </div>
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
                  <p className={`text-sm font-bold ${t.textPrimary(isDark)} mb-3`}>
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

        {/* ALERTS SECTION */}
        {data.redis.alerts && data.redis.alerts.length > 0 && (
          <motion.div
            className={`rounded-[2rem] border-2 border-rose-500/30 ${isDark ? 'bg-rose-500/5' : 'bg-rose-50'} overflow-hidden`}
          >
            <button
              onClick={() => toggleSection('alerts')}
              className={`w-full p-6 flex items-center justify-between hover:opacity-75 transition-opacity`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-rose-500/10`}>
                  <AlertTriangle className="text-rose-500" size={24} />
                </div>
                <div className="text-left">
                  <h2 className={`text-lg font-black tracking-tight text-rose-500`}>
                    System Alerts
                  </h2>
                  <p className={`text-xs font-medium ${isDark ? 'text-rose-400/70' : 'text-rose-600/70'} mt-1`}>
                    {data.redis.alerts.length} active issue(s)
                  </p>
                </div>
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

      </div>
    </div>
  );
}

// Reusable Detail Card Component
function DetailCard({
  icon: Icon,
  label,
  value,
  unit,
  explanation,
  children,
  isDark,
  accent,
}: any) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div
      className={`p-6 rounded-xl border ${t.border(isDark)} ${isDark ? 'bg-white/5' : 'bg-slate-50'} cursor-pointer hover:border-opacity-60 transition-all`}
      onClick={() => setShowDetails(!showDetails)}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-white/10' : 'bg-white'}`}>
            <Icon className={accent.text} size={20} />
          </div>
          <div className="flex-1">
            <p className={`text-xs font-black uppercase tracking-widest ${t.textMuted(isDark)}`}>
              {label}
            </p>
            <p className={`text-2xl font-black ${t.textPrimary(isDark)} mt-1`}>
              {value}
              {unit && <span className={`text-xs font-bold ml-2 ${t.textMuted(isDark)}`}>{unit}</span>}
            </p>
          </div>
        </div>
        <Info size={18} className={accent.text} />
      </div>

      {showDetails && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-4 pt-4 border-t border-opacity-20"
        >
          <div className={`text-[11px] ${t.textMuted(isDark)} leading-relaxed whitespace-pre-wrap`}>
            {explanation.explanation}
          </div>
          {explanation.thresholds && (
            <div className={`mt-4 p-3 rounded-lg ${isDark ? 'bg-white/5' : 'bg-white'} text-[10px] font-bold space-y-1`}>
              <p className={t.textSecondary(isDark)}>HEALTHY THRESHOLDS:</p>
              {Object.entries(explanation.thresholds).map(([key, val]: any) => (
                <p key={key} className={t.textPrimary(isDark)}>
                  • {key.replace(/_/g, ' ').toUpperCase()}: {val}
                </p>
              ))}
            </div>
          )}
          {children}
        </motion.div>
      )}
    </div>
  );
}
