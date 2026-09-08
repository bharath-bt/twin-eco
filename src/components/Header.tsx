import React from 'react';
import { Database, ShieldCheck, Cpu, RefreshCw, Bell, ChevronDown } from 'lucide-react';
import { SystemHealth, User } from '../types.ts';

interface HeaderProps {
  health: SystemHealth | null;
  currentUser: User | null;
  onRefresh: () => void;
  isRefreshing: boolean;
  activeScreen: string;
  onSelectScreen: (screen: string) => void;
  users: User[];
  onSwitchUser: (user: User) => void;
}

export const Header: React.FC<HeaderProps> = ({
  health,
  currentUser,
  onRefresh,
  isRefreshing,
  activeScreen,
  onSelectScreen,
  users,
  onSwitchUser,
}) => {
  const [userDropdownOpen, setUserDropdownOpen] = React.useState(false);

  const screens = [
    { id: 'dashboard', label: 'Topology & Overview' },
    { id: 'workloads', label: 'Workloads & Microservices' },
    { id: 'sql-studio', label: 'PostgreSQL Schema & SQL' },
    { id: 'analytics', label: 'Telemetry & SLA' },
    { id: 'audit', label: 'Audit Trail' },
    { id: 'settings', label: 'Engine Config' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-slate-100 shadow-md">
      {/* Top Banner / System Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Architect Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-inner font-bold text-lg">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base font-bold tracking-tight text-white font-sans">Enterprise Architecture</span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  PostgreSQL Core
                </span>
              </div>
              <p className="text-xs text-slate-400">Distributed Relational Architecture & Workload Platform</p>
            </div>
          </div>

          {/* Telemetry Status Pills & Actions */}
          <div className="flex items-center space-x-4">
            {/* Live Database Pool Pill */}
            <div className="hidden md:flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-slate-400">PostgreSQL Engine:</span>
              <span className="text-emerald-400 font-semibold font-mono">
                {health ? `${health.database.connectionPool.activeCount}/${health.database.connectionPool.maxConnections} Conn` : 'Active'}
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-300 font-mono">
                {health ? `${health.database.connectionPool.avgLatencyMs}ms` : '1.4ms'}
              </span>
            </div>

            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Sync infrastructure telemetry"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition flex items-center justify-center disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
            </button>

            {/* User Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left transition"
              >
                {currentUser?.avatar_url ? (
                  <img src={currentUser.avatar_url} alt={currentUser.name} className="w-7 h-7 rounded-full object-cover border border-slate-600" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-semibold">
                    {currentUser?.name?.charAt(0) || 'A'}
                  </div>
                )}
                <div className="hidden sm:block">
                  <div className="text-xs font-medium text-slate-200">{currentUser?.name || 'Alex Vance'}</div>
                  <div className="text-[10px] text-blue-400">{currentUser?.role || 'Lead Architect'}</div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-2 z-50">
                  <div className="px-3 py-1.5 border-b border-slate-700/60 mb-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Switch Architect Role</p>
                  </div>
                  {users.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        onSwitchUser(u);
                        setUserDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left flex items-center space-x-3 hover:bg-slate-700/60 transition ${
                        currentUser?.id === u.id ? 'bg-blue-600/10 text-blue-400' : 'text-slate-300'
                      }`}
                    >
                      <img src={u.avatar_url} alt={u.name} className="w-6 h-6 rounded-full object-cover" />
                      <div className="truncate">
                        <div className="text-xs font-medium text-slate-100">{u.name}</div>
                        <div className="text-[10px] text-slate-400">{u.role} • {u.department}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Primary Screen Navigation Tabs */}
        <div className="flex space-x-1 overflow-x-auto py-2 border-t border-slate-800/80 scrollbar-none">
          {screens.map((s) => {
            const isActive = activeScreen === s.id;
            return (
              <button
                key={s.id}
                onClick={() => onSelectScreen(s.id)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
