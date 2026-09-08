import { Workload, User, DatabaseMetric, AuditLog, SystemHealth, SchemaTableDefinition, SqlQueryResult, ConnectionPoolStats } from '../types.ts';

const BASE_URL = '/api';

export async function fetchHealth(): Promise<SystemHealth> {
  const res = await fetch(`${BASE_URL}/health`);
  if (!res.ok) throw new Error(`Failed to fetch health: ${res.statusText}`);
  return res.json();
}

export async function fetchWorkloads(filters?: { tier?: string; environment?: string; search?: string }): Promise<Workload[]> {
  const params = new URLSearchParams();
  if (filters?.tier) params.append('tier', filters.tier);
  if (filters?.environment) params.append('environment', filters.environment);
  if (filters?.search) params.append('search', filters.search);

  const res = await fetch(`${BASE_URL}/workloads?${params.toString()}`);
  if (!res.ok) throw new Error(`Failed to fetch workloads: ${res.statusText}`);
  const data = await res.json();
  return data.data || [];
}

export async function fetchWorkloadById(id: string): Promise<Workload> {
  const res = await fetch(`${BASE_URL}/workloads/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch workload: ${res.statusText}`);
  const data = await res.json();
  return data.data;
}

export async function createWorkload(payload: Partial<Workload>): Promise<Workload> {
  const res = await fetch(`${BASE_URL}/workloads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to create workload');
  }
  return data.data;
}

export async function updateWorkload(id: string, payload: Partial<Workload>): Promise<Workload> {
  const res = await fetch(`${BASE_URL}/workloads/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to update workload');
  }
  return data.data;
}

export async function deleteWorkload(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/workloads/${id}`, {
    method: 'DELETE',
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to delete workload');
  }
}

export async function fetchMetrics(): Promise<{ pool: ConnectionPoolStats; metrics: DatabaseMetric[] }> {
  const res = await fetch(`${BASE_URL}/metrics`);
  if (!res.ok) throw new Error(`Failed to fetch metrics: ${res.statusText}`);
  const data = await res.json();
  return { pool: data.pool, metrics: data.metrics };
}

export async function fetchUsers(): Promise<User[]> {
  const res = await fetch(`${BASE_URL}/users`);
  if (!res.ok) throw new Error(`Failed to fetch users: ${res.statusText}`);
  const data = await res.json();
  return data.data || [];
}

export async function fetchAuditLogs(): Promise<AuditLog[]> {
  const res = await fetch(`${BASE_URL}/audit-logs`);
  if (!res.ok) throw new Error(`Failed to fetch audit logs: ${res.statusText}`);
  const data = await res.json();
  return data.data || [];
}

export async function fetchSchemas(): Promise<Record<string, SchemaTableDefinition>> {
  const res = await fetch(`${BASE_URL}/schemas`);
  if (!res.ok) throw new Error(`Failed to fetch schemas: ${res.statusText}`);
  const data = await res.json();
  return data.data || {};
}

export async function executeSql(query: string): Promise<SqlQueryResult> {
  const res = await fetch(`${BASE_URL}/sql/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  const data = await res.json();
  return data;
}
