import React, { useState } from 'react';
import { 
  ShieldCheck, Search, Filter, Download, Clock, AlertTriangle, 
  CheckCircle2, XCircle, Terminal, User, ChevronRight 
} from 'lucide-react';
import { AuditLog } from '../types.ts';

interface AuditScreenProps {
  auditLogs: AuditLog[];
}

export const AuditScreen: React.FC<AuditScreenProps> = ({ auditLogs }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedEntity, setSelectedEntity] = useState<string>('all');
  const [activeLog, setActiveLog] = useState<AuditLog | null>(null);

  const filteredLogs = auditLogs.filter(log => {
    if (selectedStatus !== 'all' && log.status !== selectedStatus) return false;
    if (selectedEntity !== 'all' && log.entity_type !== selectedEntity) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        log.actor_name.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        log.ip_address.includes(q)
      );
    }
    return true;
  });

  const handleExportCsv = () => {
    const headers = ['ID', 'Actor', 'Action', 'Entity Type', 'Entity ID', 'Status', 'IP Address', 'Timestamp', 'Details'];
    const rows = filteredLogs.map(l => [
      l.id,
      `"${l.actor_name}"`,
      l.action,
      l.entity_type,
      l.entity_id,
      l.status,
      l.ip_address,
      l.created_at,
      `"${l.details.replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `enterprise_audit_log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Security & Immutable Audit Trail</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Append-only governance ledger recording schema modifications, deployment events, and access logs
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center space-x-2"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Audit Log (CSV)</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by actor, opcode, IP, details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="flex items-center space-x-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Entity:</span>
          </div>
          <select
            value={selectedEntity}
            onChange={(e) => setSelectedEntity(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Entities</option>
            <option value="WORKLOAD">Workloads</option>
            <option value="DATABASE">Database</option>
            <option value="SECURITY">Security</option>
            <option value="SCHEMA">Schema</option>
          </select>

          <div className="flex items-center space-x-1.5 text-xs text-slate-400 ml-2">
            <span>Status:</span>
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="SUCCESS">Success</option>
            <option value="WARNING">Warning</option>
            <option value="FAILURE">Failure</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-5 py-3">Timestamp (UTC)</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Action Opcode</th>
                <th className="px-4 py-3">Entity Type</th>
                <th className="px-4 py-3">IP Address</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-5 py-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-500 text-xs font-sans">
                    No audit records matching query filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setActiveLog(log)}
                    className="hover:bg-slate-800/40 transition cursor-pointer"
                  >
                    <td className="px-5 py-3 text-slate-400 text-[11px]">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-sans font-medium text-slate-200">
                      {log.actor_name}
                    </td>
                    <td className="px-4 py-3 text-blue-400 font-semibold text-[11px]">
                      {log.action}
                    </td>
                    <td className="px-4 py-3 text-slate-300 text-[11px]">
                      {log.entity_type}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-[11px]">
                      {log.ip_address}
                    </td>
                    <td className="px-4 py-3 font-sans">
                      <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                        log.status === 'SUCCESS'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : log.status === 'WARNING'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {log.status === 'SUCCESS' ? (
                          <CheckCircle2 className="w-2.5 h-2.5 inline" />
                        ) : (
                          <AlertTriangle className="w-2.5 h-2.5 inline" />
                        )}
                        <span>{log.status}</span>
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-sans">
                      <span className="text-blue-400 hover:text-blue-300 inline-flex items-center space-x-0.5 text-xs font-medium">
                        <span>Inspect</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspector Modal for Audit Log */}
      {activeLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white font-mono">{activeLog.action}</h3>
              </div>
              <button
                onClick={() => setActiveLog(null)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl font-mono text-[11px] space-y-1.5 border border-slate-800">
                <div className="flex justify-between">
                  <span className="text-slate-400">Entry ID:</span>
                  <span className="text-white">{activeLog.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Actor Name:</span>
                  <span className="text-blue-400">{activeLog.actor_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Target Entity:</span>
                  <span className="text-white">{activeLog.entity_type} ({activeLog.entity_id})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Client IP Origin:</span>
                  <span className="text-emerald-400">{activeLog.ip_address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Timestamp:</span>
                  <span className="text-slate-300">{activeLog.created_at}</span>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Details & Audit Payload</span>
                <div className="p-3.5 bg-slate-800/70 border border-slate-700 rounded-xl text-slate-200 font-sans leading-relaxed text-xs">
                  {activeLog.details}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setActiveLog(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
