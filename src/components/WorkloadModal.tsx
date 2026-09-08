import React, { useState, useEffect } from 'react';
import { X, Save, Layers, Server, Cpu, HardDrive, Shield } from 'lucide-react';
import { Workload, User } from '../types.ts';

interface WorkloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (workloadData: Partial<Workload>) => Promise<void>;
  initialData?: Workload | null;
  users: User[];
}

export const WorkloadModal: React.FC<WorkloadModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  users,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    identifier: '',
    tier: 'Tier 1' as 'Tier 0' | 'Tier 1' | 'Tier 2',
    environment: 'production' as 'production' | 'staging' | 'canary' | 'dr',
    status: 'healthy' as 'healthy' | 'warning' | 'critical' | 'provisioning',
    owner_id: users[0]?.id || '',
    repository_url: 'git://corp-vcs/services/service.git',
    version: 'v1.0.0',
    instances_count: 2,
    cpu_cores: 2.0,
    memory_gb: 4.0,
    db_pool_size: 10,
    endpoint_url: 'https://service.internal.corp.net',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        identifier: initialData.identifier,
        tier: initialData.tier,
        environment: initialData.environment,
        status: initialData.status,
        owner_id: initialData.owner_id,
        repository_url: initialData.repository_url,
        version: initialData.version,
        instances_count: initialData.instances_count,
        cpu_cores: initialData.cpu_cores,
        memory_gb: initialData.memory_gb,
        db_pool_size: initialData.db_pool_size,
        endpoint_url: initialData.endpoint_url,
      });
    } else {
      setFormData({
        name: '',
        identifier: '',
        tier: 'Tier 1',
        environment: 'production',
        status: 'healthy',
        owner_id: users[0]?.id || '',
        repository_url: 'git://corp-vcs/services/service.git',
        version: 'v1.0.0',
        instances_count: 2,
        cpu_cores: 2.0,
        memory_gb: 4.0,
        db_pool_size: 10,
        endpoint_url: 'https://service.internal.corp.net',
      });
    }
    setError(null);
  }, [initialData, users, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.identifier.trim()) {
      setError('Service name and identifier are required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save workload');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNameChange = (val: string) => {
    const autoId = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    setFormData(prev => ({
      ...prev,
      name: val,
      identifier: initialData ? prev.identifier : autoId,
      endpoint_url: initialData ? prev.endpoint_url : `https://${autoId || 'service'}.internal.corp.net`
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {initialData ? 'Edit Workload Architecture' : 'Provision New Enterprise Workload'}
              </h3>
              <p className="text-xs text-slate-400">Configure deployment parameters, compute, and PostgreSQL pool bounds</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-lg">
              {error}
            </div>
          )}

          {/* Section 1: Identification */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Service Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Transaction Clearinghouse"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Identifier (Postgres Key) *
              </label>
              <input
                type="text"
                required
                disabled={!!initialData}
                value={formData.identifier}
                onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                placeholder="e.g. txn-clearinghouse"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 font-mono disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Section 2: SLA Tier, Environment, and Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                SLA Tier
              </label>
              <select
                value={formData.tier}
                onChange={(e: any) => setFormData({ ...formData, tier: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Tier 0">Tier 0 (99.99% Mission Critical)</option>
                <option value="Tier 1">Tier 1 (99.9% High Availability)</option>
                <option value="Tier 2">Tier 2 (99.0% Standard Batch)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Environment
              </label>
              <select
                value={formData.environment}
                onChange={(e: any) => setFormData({ ...formData, environment: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="production">Production</option>
                <option value="staging">Staging</option>
                <option value="canary">Canary</option>
                <option value="dr">Disaster Recovery (DR)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Initial Status
              </label>
              <select
                value={formData.status}
                onChange={(e: any) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="healthy">Healthy</option>
                <option value="warning">Degraded / Warning</option>
                <option value="provisioning">Provisioning</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          {/* Section 3: Owner & Release */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Lead Architect Owner (User Relation)
              </label>
              <select
                value={formData.owner_id}
                onChange={(e) => setFormData({ ...formData, owner_id: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} — {u.role} ({u.department})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Semantic Version
              </label>
              <input
                type="text"
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                placeholder="v1.0.0"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Section 4: Resource & PostgreSQL Pool Specs */}
          <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/60 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              <span>Compute & Relational Database Resources</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Instances (Pods)</label>
                <input
                  type="number"
                  min="1"
                  max="64"
                  value={formData.instances_count}
                  onChange={(e) => setFormData({ ...formData, instances_count: parseInt(e.target.value) || 1 })}
                  className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-sm text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">vCPU Cores</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="128"
                  value={formData.cpu_cores}
                  onChange={(e) => setFormData({ ...formData, cpu_cores: parseFloat(e.target.value) || 1 })}
                  className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-sm text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Memory (GB)</label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  max="256"
                  value={formData.memory_gb}
                  onChange={(e) => setFormData({ ...formData, memory_gb: parseFloat(e.target.value) || 1 })}
                  className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-sm text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Postgres Pool Size</label>
                <input
                  type="number"
                  min="2"
                  max="50"
                  value={formData.db_pool_size}
                  onChange={(e) => setFormData({ ...formData, db_pool_size: parseInt(e.target.value) || 5 })}
                  className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-sm text-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Endpoints & Repositories */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Ingress Endpoint URL
              </label>
              <input
                type="text"
                value={formData.endpoint_url}
                onChange={(e) => setFormData({ ...formData, endpoint_url: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                VCS Repository
              </label>
              <input
                type="text"
                value={formData.repository_url}
                onChange={(e) => setFormData({ ...formData, repository_url: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-800/50 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition flex items-center space-x-1.5 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? 'Committing...' : initialData ? 'Update Workload' : 'Deploy Workload'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
