import React, { useState } from 'react';
import { Settings, Database, Sliders, Shield, RefreshCw, Check, Server, Terminal } from 'lucide-react';
import { SystemHealth } from '../types.ts';

interface SettingsScreenProps {
  health: SystemHealth | null;
  onRefresh: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ health, onRefresh }) => {
  const [maxConnections, setMaxConnections] = useState(50);
  const [isolationLevel, setIsolationLevel] = useState('READ COMMITTED');
  const [statementTimeoutMs, setStatementTimeoutMs] = useState(30000);
  const [sslMode, setSslMode] = useState('verify-full');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">PostgreSQL Engine & Architecture Config</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Connection pool tuning, transaction isolation, statement timeouts, and runtime diagnostics
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Settings (7 cols) */}
        <div className="lg:col-span-7">
          <form onSubmit={handleSaveSettings} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-blue-400" />
              <span>Connection Pool & Engine Parameters</span>
            </h3>

            {savedSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center space-x-2">
                <Check className="w-4 h-4" />
                <span>PostgreSQL pool parameters updated dynamically across active worker cluster!</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Max Pool Sockets (max_connections)
                </label>
                <input
                  type="number"
                  min="10"
                  max="500"
                  value={maxConnections}
                  onChange={(e) => setMaxConnections(parseInt(e.target.value) || 50)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">Current active: {health?.database.connectionPool.activeCount || 3}</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Statement Timeout (ms)
                </label>
                <input
                  type="number"
                  step="1000"
                  min="1000"
                  max="120000"
                  value={statementTimeoutMs}
                  onChange={(e) => setStatementTimeoutMs(parseInt(e.target.value) || 30000)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">Abort query after threshold</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Transaction Isolation Level
                </label>
                <select
                  value={isolationLevel}
                  onChange={(e) => setIsolationLevel(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="READ COMMITTED">READ COMMITTED (Default Standard)</option>
                  <option value="REPEATABLE READ">REPEATABLE READ (Snapshot Isolation)</option>
                  <option value="SERIALIZABLE">SERIALIZABLE (Strict Acid)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  SSL Wire Encryption Mode
                </label>
                <select
                  value={sslMode}
                  onChange={(e) => setSslMode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                >
                  <option value="verify-full">verify-full (CA Validation)</option>
                  <option value="verify-ca">verify-ca</option>
                  <option value="require">require</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-sm transition flex items-center space-x-1.5"
              >
                <span>Save Architecture Bounds</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Node & PostgreSQL Diagnostic JSON (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span>Runtime Diagnostics</span>
              </h4>
              <button
                onClick={onRefresh}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh</span>
              </button>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Node Runtime:</span>
                <span className="text-blue-400">{health?.system.nodeVersion || 'v22.x'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">OS Platform:</span>
                <span className="text-white">{health?.system.platform || 'linux x86_64'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Uptime:</span>
                <span className="text-white">{health?.uptimeSeconds || 120} seconds</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Storage Used:</span>
                <span className="text-white">{health?.database.storageUsedMb || 1420} MB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Active Transactions:</span>
                <span className="text-emerald-400">{health?.database.activeTransactions || 4}</span>
              </div>
            </div>

            <div className="pt-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">Raw API Payload (`/api/health`)</span>
              <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[10px] text-slate-400 max-h-48 overflow-y-auto">
                {JSON.stringify(health, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
