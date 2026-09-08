import React from 'react';
import { 
  Server, Database, Activity, ShieldCheck, ArrowUpRight, Cpu, Layers, 
  AlertTriangle, CheckCircle2, Clock, Zap, Network, ChevronRight
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid } from 'recharts';
import { Workload, DatabaseMetric, SystemHealth, AuditLog } from '../types.ts';

interface DashboardScreenProps {
  workloads: Workload[];
  metrics: DatabaseMetric[];
  health: SystemHealth | null;
  auditLogs: AuditLog[];
  onNavigateToWorkloads: () => void;
  onNavigateToSql: () => void;
  onSelectWorkload: (w: Workload) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  workloads,
  metrics,
  health,
  auditLogs,
  onNavigateToWorkloads,
  onNavigateToSql,
  onSelectWorkload,
}) => {
  const tier0Count = workloads.filter(w => w.tier === 'Tier 0').length;
  const healthyCount = workloads.filter(w => w.status === 'healthy').length;
  const totalInstances = workloads.reduce((sum, w) => sum + w.instances_count, 0);
  const totalDbPoolAllocated = workloads.reduce((sum, w) => sum + w.db_pool_size, 0);

  // Format chart data from metrics
  const chartData = metrics.map((m, idx) => ({
    time: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    avgQueryTime: m.avg_query_time_ms,
    readIops: m.read_iops,
    writeIops: m.write_iops,
    activeConn: m.active_connections,
    cpu: m.cpu_utilization_pct,
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Architecture Alert Banner if warning exists */}
      {workloads.some(w => w.status === 'warning') && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-amber-200">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="text-xs">
              <span className="font-semibold text-amber-300">Degraded Service Detected:</span>{' '}
              Workload <span className="font-mono underline">kafka-event-pipeline</span> is observing elevated P99 latency (48.7ms). Auto-scale headroom remaining.
            </div>
          </div>
          <button
            onClick={onNavigateToWorkloads}
            className="text-xs font-semibold px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg transition"
          >
            Inspect Workloads
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Services */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Workloads</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-white font-mono">{workloads.length}</span>
            <span className="text-xs text-emerald-400 font-medium">+{tier0Count} Tier-0 SLA</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {totalInstances} active compute containers across clusters
          </p>
        </div>

        {/* Card 2: PostgreSQL Pool Status */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">PostgreSQL Pool</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-white font-mono">
              {health?.database.connectionPool.activeCount || 3} / {health?.database.connectionPool.maxConnections || 50}
            </span>
            <span className="text-xs text-slate-400 font-mono">Sockets</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Avg query time: <span className="text-emerald-400 font-mono">{health?.database.connectionPool.avgLatencyMs || 1.4}ms</span>
          </p>
        </div>

        {/* Card 3: Storage & Database Volume */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Database Storage</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-white font-mono">1.42 GB</span>
            <span className="text-xs text-slate-400">/ 50 GB allocated</span>
          </div>
          <div className="mt-2 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-indigo-500 h-full rounded-full" style={{ width: '2.8%' }}></div>
          </div>
        </div>

        {/* Card 4: Architecture Health */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Cluster SLA</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-emerald-400 font-mono">99.98%</span>
            <span className="text-xs text-slate-400">SLA Verified</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {healthyCount} of {workloads.length} services operating optimally
          </p>
        </div>
      </div>

      {/* Interactive System Topology Diagram */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center space-x-2">
              <Network className="w-4 h-4 text-blue-400" />
              <span>Enterprise Topology & Traffic Routing</span>
            </h3>
            <p className="text-xs text-slate-400">End-to-end ingress distribution to Node.js backend cluster and PostgreSQL engine</p>
          </div>
          <button
            onClick={onNavigateToSql}
            className="text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center space-x-1"
          >
            <span>Inspect Database Schemas</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Visual Topology Nodes */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-2">
          {/* Node 1: Global Edge Ingress */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">Edge Gateway</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            </div>
            <div className="text-sm font-bold text-white">Cloudflare / NGINX</div>
            <div className="text-xs text-slate-400 mt-1 font-mono">10.240.0.0/16 • Anycast</div>
            <div className="mt-3 text-[11px] text-slate-300 flex justify-between border-t border-slate-700/60 pt-2 font-mono">
              <span>RPS: 4,820/s</span>
              <span className="text-emerald-400">SSL: TLS 1.3</span>
            </div>
          </div>

          {/* Node 2: Node.js Microservices Layer */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-purple-500/20 text-purple-400">Application Tier</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            </div>
            <div className="text-sm font-bold text-white">Node.js Express Cluster</div>
            <div className="text-xs text-slate-400 mt-1 font-mono">{workloads.length} microservices • {totalInstances} pods</div>
            <div className="mt-3 text-[11px] text-slate-300 flex justify-between border-t border-slate-700/60 pt-2 font-mono">
              <span>vCPU: 48 Cores</span>
              <span className="text-blue-400">RAM: 128 GB</span>
            </div>
          </div>

          {/* Node 3: PostgreSQL Primary Master */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-blue-500/40 relative ring-1 ring-blue-500/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">Primary DB</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            </div>
            <div className="text-sm font-bold text-white">PostgreSQL 16 Enterprise</div>
            <div className="text-xs text-slate-400 mt-1 font-mono">Read/Write Master • Port 5432</div>
            <div className="mt-3 text-[11px] text-slate-300 flex justify-between border-t border-slate-700/60 pt-2 font-mono">
              <span>Active: {health?.database.connectionPool.activeCount || 3}</span>
              <span className="text-emerald-400">P99: 1.4ms</span>
            </div>
          </div>

          {/* Node 4: Read Replicas & Audit Vault */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">Read Replica</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            </div>
            <div className="text-sm font-bold text-white">Async Hot Standby</div>
            <div className="text-xs text-slate-400 mt-1 font-mono">Replica Lag: {health?.database.readReplicaLagMs || 0.4}ms</div>
            <div className="mt-3 text-[11px] text-slate-300 flex justify-between border-t border-slate-700/60 pt-2 font-mono">
              <span>Streaming WAL</span>
              <span className="text-emerald-400">In-Sync</span>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Grid: Charts (Latency + IOPS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latency Curve Chart */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>PostgreSQL Query Latency (24h)</span>
              </h4>
              <p className="text-xs text-slate-400">Execution time in milliseconds (ms)</p>
            </div>
            <span className="text-xs font-mono font-semibold px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Avg: 1.4ms
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={[0, 4]} unit="ms" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#f8fafc', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="avgQueryTime" name="Query Latency (ms)" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#latencyGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Database Disk IOPS Chart */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                <Zap className="w-4 h-4 text-blue-400" />
                <span>Disk Read / Write IOPS Throughput</span>
              </h4>
              <p className="text-xs text-slate-400">PostgreSQL transaction write volume & cache read rate</p>
            </div>
            <div className="flex items-center space-x-3 text-xs">
              <span className="flex items-center space-x-1 text-blue-400">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span>Read</span>
              </span>
              <span className="flex items-center space-x-1 text-purple-400">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                <span>Write</span>
              </span>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.slice(-12)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#f8fafc', fontSize: '12px' }}
                />
                <Bar dataKey="readIops" name="Read IOPS" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="writeIops" name="Write IOPS" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row: Active Workloads Quick-View & Immutable Audit Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workloads Snapshot (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-white">Mission-Critical Tier 0 Services</h4>
              <p className="text-xs text-slate-400">Workloads with strict zero-downtime SLA requirements</p>
            </div>
            <button
              onClick={onNavigateToWorkloads}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center space-x-1"
            >
              <span>View All ({workloads.length})</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {workloads
              .filter(w => w.tier === 'Tier 0' || w.status === 'warning')
              .slice(0, 4)
              .map((w) => (
                <div
                  key={w.id}
                  onClick={() => onSelectWorkload(w)}
                  className="p-3.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 transition cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${
                      w.status === 'healthy' ? 'bg-emerald-400' : w.status === 'warning' ? 'bg-amber-400' : 'bg-rose-400'
                    }`}></div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white truncate">{w.name}</div>
                      <div className="text-xs text-slate-400 font-mono truncate">{w.identifier} • {w.version}</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 shrink-0 text-xs">
                    <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-slate-700/60 text-slate-300 font-mono">
                      {w.instances_count} pods
                    </span>
                    <span className="font-mono text-slate-300">
                      P99: <span className={w.p99_latency_ms > 30 ? 'text-amber-400 font-bold' : 'text-emerald-400'}>{w.p99_latency_ms}ms</span>
                    </span>
                    <span className={`px-2 py-0.5 rounded font-semibold text-[10px] ${
                      w.tier === 'Tier 0' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-blue-500/20 text-blue-300'
                    }`}>
                      {w.tier}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Recent Audit Activities (1 col) */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Security & Audit Trail</span>
              </h4>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Immutable
              </span>
            </div>

            <div className="space-y-3">
              {auditLogs.slice(0, 4).map((log) => (
                <div key={log.id} className="text-xs border-l-2 border-slate-700 pl-3 py-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-0.5">
                    <span className="font-medium text-slate-300">{log.actor_name}</span>
                    <span className="font-mono text-[10px]">
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="font-mono text-blue-400 font-medium text-[11px]">{log.action}</div>
                  <p className="text-slate-400 line-clamp-1 mt-0.5 text-[11px]">{log.details}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 mt-4">
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>Audit storage mode:</span>
              <span className="font-mono text-slate-300">WAL Append-Only</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
