import React, { useState } from 'react';
import { 
  Activity, Zap, Database, Server, Clock, ShieldAlert, 
  ArrowUpRight, ArrowDownRight, Layers, CheckCircle2 
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, BarChart, Bar } from 'recharts';
import { DatabaseMetric, ConnectionPoolStats } from '../types.ts';

interface AnalyticsScreenProps {
  metrics: DatabaseMetric[];
  pool: ConnectionPoolStats | null;
}

export const AnalyticsScreen: React.FC<AnalyticsScreenProps> = ({ metrics, pool }) => {
  const [timeWindow, setTimeWindow] = useState<'1h' | '6h' | '24h'>('24h');

  const sliceCount = timeWindow === '1h' ? 4 : timeWindow === '6h' ? 8 : 24;
  const filteredMetrics = metrics.slice(-sliceCount);

  const chartData = filteredMetrics.map((m) => ({
    time: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    queryTime: m.avg_query_time_ms,
    readIops: m.read_iops,
    writeIops: m.write_iops,
    activeConn: m.active_connections,
    idleConn: m.idle_connections,
    cpu: m.cpu_utilization_pct,
    mem: m.memory_utilization_pct,
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Database Telemetry & SLA Analytics</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            PostgreSQL query execution benchmarks, connection pool saturation, and host utilization curves
          </p>
        </div>

        {/* Time Window Buttons */}
        <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs font-semibold">
          {(['1h', '6h', '24h'] as const).map((tw) => (
            <button
              key={tw}
              onClick={() => setTimeWindow(tw)}
              className={`px-3 py-1 rounded-lg transition ${
                timeWindow === tw ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {tw}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Micro-Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Avg Query Latency</div>
          <div className="mt-1 flex items-baseline space-x-1.5">
            <span className="text-2xl font-bold text-emerald-400 font-mono">1.38ms</span>
            <span className="text-[10px] text-emerald-500 font-semibold flex items-center">
              <ArrowDownRight className="w-3 h-3" /> 0.12ms
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">SLA Target: &lt; 15.0ms</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Peak Read IOPS</div>
          <div className="mt-1 flex items-baseline space-x-1.5">
            <span className="text-2xl font-bold text-blue-400 font-mono">2,340</span>
            <span className="text-[10px] text-blue-400 font-mono">ops/sec</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">SSD Provisioned IOPS: 10,000</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Active Sockets</div>
          <div className="mt-1 flex items-baseline space-x-1.5">
            <span className="text-2xl font-bold text-purple-400 font-mono">{pool?.activeCount || 3}</span>
            <span className="text-[10px] text-slate-400 font-mono">/ {pool?.maxConnections || 50} max</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Pool Utilization: 6.0%</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Buffer Cache Hit</div>
          <div className="mt-1 flex items-baseline space-x-1.5">
            <span className="text-2xl font-bold text-white font-mono">99.4%</span>
            <span className="text-[10px] text-emerald-400 font-semibold flex items-center">
              <CheckCircle2 className="w-3 h-3" />
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Shared buffers in RAM</p>
        </div>
      </div>

      {/* Chart 1: Connection Pool Dynamics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                <Database className="w-4 h-4 text-purple-400" />
                <span>PostgreSQL Connection Pool Breakdown</span>
              </h4>
              <p className="text-xs text-slate-400">Active queries vs idle persistent sockets</p>
            </div>
            <div className="flex items-center space-x-3 text-xs">
              <span className="flex items-center space-x-1 text-purple-400">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                <span>Active</span>
              </span>
              <span className="flex items-center space-x-1 text-slate-400">
                <span className="w-2 h-2 rounded-full bg-slate-600"></span>
                <span>Idle</span>
              </span>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#f8fafc', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="activeConn" name="Active Connections" stroke="#a855f7" fill="#a855f7" fillOpacity={0.4} />
                <Area type="monotone" dataKey="idleConn" name="Idle Connections" stroke="#475569" fill="#475569" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: CPU & Memory Load */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                <Server className="w-4 h-4 text-blue-400" />
                <span>Database Instance CPU & Memory Load (%)</span>
              </h4>
              <p className="text-xs text-slate-400">Compute headroom on Cloud SQL / PostgreSQL VM</p>
            </div>
            <div className="flex items-center space-x-3 text-xs">
              <span className="flex items-center space-x-1 text-blue-400">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span>CPU %</span>
              </span>
              <span className="flex items-center space-x-1 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>RAM %</span>
              </span>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#f8fafc', fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="cpu" name="CPU Utilization (%)" stroke="#3b82f6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="mem" name="Memory Utilization (%)" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
