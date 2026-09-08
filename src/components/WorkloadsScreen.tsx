import React, { useState } from 'react';
import { 
  Server, Plus, Search, Filter, RefreshCw, Trash2, Edit2, 
  ExternalLink, CheckCircle2, AlertTriangle, XCircle, Cpu, Database, 
  Zap, ArrowUpDown, ChevronRight, Activity, Terminal
} from 'lucide-react';
import { Workload, User } from '../types.ts';

interface WorkloadsScreenProps {
  workloads: Workload[];
  users: User[];
  onOpenCreateModal: () => void;
  onOpenEditModal: (w: Workload) => void;
  onDeleteWorkload: (id: string) => Promise<void>;
  onRefresh: () => void;
}

export const WorkloadsScreen: React.FC<WorkloadsScreenProps> = ({
  workloads,
  users,
  onOpenCreateModal,
  onOpenEditModal,
  onDeleteWorkload,
  onRefresh,
}) => {
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [selectedEnv, setSelectedEnv] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [inspectingWorkload, setInspectingWorkload] = useState<Workload | null>(null);
  const [pingStatus, setPingStatus] = useState<{ [id: string]: { status: 'pinging' | 'success'; latency: number } }>({});

  const filteredWorkloads = workloads.filter(w => {
    if (selectedTier !== 'all' && w.tier !== selectedTier) return false;
    if (selectedEnv !== 'all' && w.environment !== selectedEnv) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return w.name.toLowerCase().includes(q) || w.identifier.toLowerCase().includes(q) || w.version.toLowerCase().includes(q);
    }
    return true;
  });

  const handlePing = (id: string) => {
    setPingStatus(prev => ({ ...prev, [id]: { status: 'pinging', latency: 0 } }));
    setTimeout(() => {
      const simulatedLatency = Number((Math.random() * 8 + 2).toFixed(1));
      setPingStatus(prev => ({ ...prev, [id]: { status: 'success', latency: simulatedLatency } }));
      setTimeout(() => {
        setPingStatus(prev => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }, 4000);
    }, 600);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Screen Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Enterprise Workloads & Microservices</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Distributed application registry, resource limits, and PostgreSQL connection pool allocations
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={onRefresh}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition flex items-center space-x-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync</span>
          </button>
          <button
            onClick={onOpenCreateModal}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Deploy Workload</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Controls Bar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, key, or version..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center space-x-1.5 text-xs text-slate-400 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            <span>Tier:</span>
          </div>
          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Tiers ({workloads.length})</option>
            <option value="Tier 0">Tier 0 (Mission Critical)</option>
            <option value="Tier 1">Tier 1 (High Availability)</option>
            <option value="Tier 2">Tier 2 (Standard)</option>
          </select>

          <div className="flex items-center space-x-1.5 text-xs text-slate-400 shrink-0 ml-2">
            <span>Env:</span>
          </div>
          <select
            value={selectedEnv}
            onChange={(e) => setSelectedEnv(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Environments</option>
            <option value="production">Production</option>
            <option value="staging">Staging</option>
            <option value="canary">Canary</option>
            <option value="dr">Disaster Recovery (DR)</option>
          </select>
        </div>
      </div>

      {/* Main Workloads Relational Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-5 py-3">Workload / Key</th>
                <th className="px-4 py-3">SLA Tier & Env</th>
                <th className="px-4 py-3">Owner (Lead)</th>
                <th className="px-4 py-3">Compute & PG Pool</th>
                <th className="px-4 py-3">Telemetry (P99)</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredWorkloads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-500 text-xs">
                    No workloads matching current filters.
                  </td>
                </tr>
              ) : (
                filteredWorkloads.map((w) => {
                  const ping = pingStatus[w.id];
                  return (
                    <tr key={w.id} className="hover:bg-slate-800/40 transition">
                      {/* Name & Key */}
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-white text-sm">{w.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono flex items-center space-x-1.5 mt-0.5">
                          <span>{w.identifier}</span>
                          <span className="text-slate-600">•</span>
                          <span className="px-1.5 py-0.2 bg-slate-800 rounded text-slate-400">{w.version}</span>
                        </div>
                      </td>

                      {/* SLA Tier & Environment */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col space-y-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold w-max ${
                            w.tier === 'Tier 0'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : w.tier === 'Tier 1'
                              ? 'bg-blue-500/20 text-blue-300'
                              : 'bg-slate-700/60 text-slate-300'
                          }`}>
                            {w.tier}
                          </span>
                          <span className="text-[11px] text-slate-400 capitalize font-mono">
                            {w.environment}
                          </span>
                        </div>
                      </td>

                      {/* Owner */}
                      <td className="px-4 py-3.5">
                        {w.owner ? (
                          <div className="flex items-center space-x-2">
                            <img src={w.owner.avatar_url} alt={w.owner.name} className="w-6 h-6 rounded-full object-cover" />
                            <div>
                              <div className="text-xs font-medium text-slate-200">{w.owner.name}</div>
                              <div className="text-[10px] text-slate-400">{w.owner.department}</div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">Unassigned</span>
                        )}
                      </td>

                      {/* Compute & PG Pool */}
                      <td className="px-4 py-3.5 font-mono text-[11px]">
                        <div className="text-slate-200">
                          {w.instances_count} pods • {w.cpu_cores} vCPU • {w.memory_gb}GB
                        </div>
                        <div className="text-slate-400 text-[10px] mt-0.5 flex items-center space-x-1">
                          <Database className="w-3 h-3 text-blue-400 inline" />
                          <span>Max DB Pool: {w.db_pool_size} conn</span>
                        </div>
                      </td>

                      {/* Telemetry */}
                      <td className="px-4 py-3.5 font-mono text-[11px]">
                        <div className="flex items-center space-x-2">
                          <span className={w.p99_latency_ms > 30 ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                            P99: {w.p99_latency_ms}ms
                          </span>
                        </div>
                        <div className="text-slate-400 text-[10px] mt-0.5">
                          Err: {(w.error_rate_percent * 100).toFixed(2)}%
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                          w.status === 'healthy'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : w.status === 'warning'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            w.status === 'healthy' ? 'bg-emerald-400' : w.status === 'warning' ? 'bg-amber-400' : 'bg-rose-400'
                          }`}></span>
                          <span className="capitalize">{w.status}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {/* Ping */}
                          <button
                            onClick={() => handlePing(w.id)}
                            disabled={ping?.status === 'pinging'}
                            title="Health check ping"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 transition"
                          >
                            <Zap className={`w-3.5 h-3.5 ${ping?.status === 'pinging' ? 'animate-bounce text-amber-400' : ''}`} />
                          </button>

                          {/* Inspect Drawer */}
                          <button
                            onClick={() => setInspectingWorkload(w)}
                            title="Inspect service architecture"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-blue-400 transition"
                          >
                            <Terminal className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => onOpenEditModal(w)}
                            title="Edit workload configuration"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => {
                              if (confirm(`Decommission and unbind workload '${w.name}' from PostgreSQL connection pool?`)) {
                                onDeleteWorkload(w.id);
                              }
                            }}
                            title="Decommission service"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {ping?.status === 'success' && (
                          <div className="text-[10px] text-emerald-400 font-mono mt-1">
                            HTTP 200 ({ping.latency}ms)
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspection Drawer / Detail Modal */}
      {inspectingWorkload && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg h-full max-h-[95vh] flex flex-col shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{inspectingWorkload.name}</h3>
                  <p className="text-xs text-slate-400 font-mono">{inspectingWorkload.identifier}</p>
                </div>
              </div>
              <button
                onClick={() => setInspectingWorkload(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-4 text-xs">
              <div>
                <h4 className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] mb-1">Architecture Specification</h4>
                <div className="p-3 bg-slate-800/60 rounded-xl space-y-2 border border-slate-700/60">
                  <div className="flex justify-between">
                    <span className="text-slate-400">SLA Criticality:</span>
                    <span className="font-semibold text-white">{inspectingWorkload.tier}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Environment:</span>
                    <span className="font-mono text-white capitalize">{inspectingWorkload.environment}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Semantic Version:</span>
                    <span className="font-mono text-blue-400">{inspectingWorkload.version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Pod Replicas:</span>
                    <span className="font-mono text-white">{inspectingWorkload.instances_count} nodes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Compute:</span>
                    <span className="font-mono text-white">{inspectingWorkload.cpu_cores} vCPU / {inspectingWorkload.memory_gb} GB RAM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">PostgreSQL Pool Allocation:</span>
                    <span className="font-mono text-emerald-400">{inspectingWorkload.db_pool_size} dedicated sockets</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] mb-1">Networking & Endpoints</h4>
                <div className="p-3 bg-slate-800/60 rounded-xl space-y-2 border border-slate-700/60 font-mono text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Ingress URI:</span>
                    <span className="text-slate-200 break-all">{inspectingWorkload.endpoint_url}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Source Repository:</span>
                    <span className="text-blue-400 break-all">{inspectingWorkload.repository_url}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] mb-1">Lead Architect Owner</h4>
                <div className="p-3 bg-slate-800/60 rounded-xl flex items-center space-x-3 border border-slate-700/60">
                  <img src={inspectingWorkload.owner?.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <div className="text-sm font-semibold text-white">{inspectingWorkload.owner?.name}</div>
                    <div className="text-xs text-blue-400">{inspectingWorkload.owner?.role}</div>
                    <div className="text-[11px] text-slate-400">{inspectingWorkload.owner?.email}</div>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-2 border-t border-slate-800">
                <button
                  onClick={() => {
                    const w = inspectingWorkload;
                    setInspectingWorkload(null);
                    onOpenEditModal(w);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition"
                >
                  Edit Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
