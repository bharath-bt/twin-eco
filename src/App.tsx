import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header.tsx';
import { DashboardScreen } from './components/DashboardScreen.tsx';
import { WorkloadsScreen } from './components/WorkloadsScreen.tsx';
import { SchemaStudioScreen } from './components/SchemaStudioScreen.tsx';
import { AnalyticsScreen } from './components/AnalyticsScreen.tsx';
import { AuditScreen } from './components/AuditScreen.tsx';
import { SettingsScreen } from './components/SettingsScreen.tsx';
import { WorkloadModal } from './components/WorkloadModal.tsx';
import { 
  fetchHealth, fetchWorkloads, fetchUsers, fetchMetrics, 
  fetchAuditLogs, fetchSchemas, createWorkload, updateWorkload, deleteWorkload 
} from './services/api.ts';
import { Workload, User, DatabaseMetric, AuditLog, SystemHealth, SchemaTableDefinition } from './types.ts';
import { CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [activeScreen, setActiveScreen] = useState<string>('dashboard');
  const [workloads, setWorkloads] = useState<Workload[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [metrics, setMetrics] = useState<DatabaseMetric[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [schemas, setSchemas] = useState<Record<string, SchemaTableDefinition>>({});
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingWorkload, setEditingWorkload] = useState<Workload | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadAllData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setIsRefreshing(true);
      const [h, w, u, m, a, s] = await Promise.all([
        fetchHealth().catch(() => null),
        fetchWorkloads().catch(() => []),
        fetchUsers().catch(() => []),
        fetchMetrics().catch(() => ({ pool: null, metrics: [] })),
        fetchAuditLogs().catch(() => []),
        fetchSchemas().catch(() => ({})),
      ]);

      if (h) setHealth(h);
      setWorkloads(w);
      setUsers(u);
      if (m?.metrics) setMetrics(m.metrics);
      setAuditLogs(a);
      setSchemas(s);

      // Set initial user if not already set
      if (!currentUser && u.length > 0) {
        setCurrentUser(u[0]);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to sync platform telemetry', 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadAllData();
  }, []);

  // CRUD Handlers
  const handleSaveWorkload = async (formData: Partial<Workload>) => {
    try {
      if (editingWorkload) {
        const updated = await updateWorkload(editingWorkload.id, formData);
        showToast(`Workload '${updated.name}' updated successfully.`);
      } else {
        const created = await createWorkload(formData);
        showToast(`Workload '${created.name}' successfully provisioned and bound to PostgreSQL pool.`);
      }
      await loadAllData(true);
      setIsModalOpen(false);
      setEditingWorkload(null);
    } catch (err: any) {
      showToast(err.message || 'Error saving workload', 'error');
      throw err;
    }
  };

  const handleDeleteWorkload = async (id: string) => {
    try {
      await deleteWorkload(id);
      showToast('Workload successfully decommissioned.');
      await loadAllData(true);
    } catch (err: any) {
      showToast(err.message || 'Error decommissioning workload', 'error');
    }
  };

  const handleOpenCreate = () => {
    setEditingWorkload(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (w: Workload) => {
    setEditingWorkload(w);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Toast Notification Alert */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-3 duration-200">
          <div className={`px-4 py-3 rounded-xl shadow-xl border flex items-center space-x-2 text-xs font-medium ${
            toast.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/90 border-rose-500/40 text-rose-200'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Global Senior Architect Header */}
      <Header
        health={health}
        currentUser={currentUser}
        onRefresh={() => loadAllData(false)}
        isRefreshing={isRefreshing}
        activeScreen={activeScreen}
        onSelectScreen={setActiveScreen}
        users={users}
        onSwitchUser={(user) => {
          setCurrentUser(user);
          showToast(`Active session role switched to ${user.name} (${user.role})`);
        }}
      />

      {/* Primary Workspace View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-xs text-slate-400 font-mono">Initializing PostgreSQL Cluster & Express API...</p>
          </div>
        ) : (
          <>
            {activeScreen === 'dashboard' && (
              <DashboardScreen
                workloads={workloads}
                metrics={metrics}
                health={health}
                auditLogs={auditLogs}
                onNavigateToWorkloads={() => setActiveScreen('workloads')}
                onNavigateToSql={() => setActiveScreen('sql-studio')}
                onSelectWorkload={(w) => {
                  setActiveScreen('workloads');
                  handleOpenEdit(w);
                }}
              />
            )}

            {activeScreen === 'workloads' && (
              <WorkloadsScreen
                workloads={workloads}
                users={users}
                onOpenCreateModal={handleOpenCreate}
                onOpenEditModal={handleOpenEdit}
                onDeleteWorkload={handleDeleteWorkload}
                onRefresh={() => loadAllData(false)}
              />
            )}

            {activeScreen === 'sql-studio' && (
              <SchemaStudioScreen schemas={schemas} />
            )}

            {activeScreen === 'analytics' && (
              <AnalyticsScreen
                metrics={metrics}
                pool={health?.database.connectionPool || null}
              />
            )}

            {activeScreen === 'audit' && (
              <AuditScreen auditLogs={auditLogs} />
            )}

            {activeScreen === 'settings' && (
              <SettingsScreen
                health={health}
                onRefresh={() => loadAllData(false)}
              />
            )}
          </>
        )}
      </main>

      {/* Modal for Creating / Editing Workloads */}
      <WorkloadModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingWorkload(null);
        }}
        onSave={handleSaveWorkload}
        initialData={editingWorkload}
        users={users}
      />

      {/* Senior Architect System Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>PostgreSQL 16 Engine Active</span>
            <span>•</span>
            <span>Node.js {health?.system.nodeVersion || 'v22.x'}</span>
            <span>•</span>
            <span>Express REST API</span>
          </div>
          <div className="text-[11px] font-mono text-slate-600">
            Enterprise Architecture Platform • Strict Relational Isolation
          </div>
        </div>
      </footer>
    </div>
  );
}
