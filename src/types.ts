export interface User {
  id: string;
  email: string;
  name: string;
  role: 'Lead Architect' | 'Staff Engineer' | 'DevOps Specialist' | 'Security Auditor';
  department: string;
  avatar_url: string;
  created_at: string;
  last_login: string;
}

export interface Workload {
  id: string;
  name: string;
  identifier: string;
  tier: 'Tier 0' | 'Tier 1' | 'Tier 2';
  environment: 'production' | 'staging' | 'canary' | 'dr';
  status: 'healthy' | 'warning' | 'critical' | 'provisioning';
  owner_id: string;
  owner?: User | null;
  repository_url: string;
  version: string;
  instances_count: number;
  cpu_cores: number;
  memory_gb: number;
  db_pool_size: number;
  endpoint_url: string;
  p99_latency_ms: number;
  error_rate_percent: number;
  created_at: string;
  updated_at: string;
}

export interface DatabaseMetric {
  id: string;
  workload_id: string;
  timestamp: string;
  read_iops: number;
  write_iops: number;
  active_connections: number;
  idle_connections: number;
  avg_query_time_ms: number;
  cpu_utilization_pct: number;
  memory_utilization_pct: number;
}

export interface AuditLog {
  id: string;
  actor_id: string;
  actor_name: string;
  action: string;
  entity_type: 'WORKLOAD' | 'DATABASE' | 'SECURITY' | 'SCHEMA';
  entity_id: string;
  details: string;
  ip_address: string;
  status: 'SUCCESS' | 'FAILURE' | 'WARNING';
  created_at: string;
}

export interface ConnectionPoolStats {
  totalCount: number;
  idleCount: number;
  waitingCount: number;
  activeCount: number;
  avgLatencyMs: number;
  maxConnections: number;
}

export interface SystemHealth {
  status: string;
  service: string;
  version: string;
  uptimeSeconds: number;
  database: {
    type: string;
    connectionPool: ConnectionPoolStats;
    readReplicaLagMs: number;
    transactionIsolationLevel: string;
    storageUsedMb: number;
    storageMaxMb: number;
    activeTransactions: number;
  };
  system: {
    nodeVersion: string;
    platform: string;
  };
  timestamp: string;
}

export interface SchemaTableDefinition {
  tableName: string;
  description: string;
  primaryKey: string;
  columns: {
    name: string;
    type: string;
    nullable: boolean;
    isPrimary?: boolean;
    isForeignKey?: boolean;
    references?: string;
    description: string;
  }[];
  indexes: {
    name: string;
    columns: string[];
    type: 'btree' | 'hash' | 'gin';
    unique: boolean;
  }[];
  ddl: string;
}

export interface SqlQueryResult {
  success: boolean;
  queryType?: string;
  rowCount?: number;
  executionTimeMs?: number;
  rows?: any[];
  executionPlan?: string[] | null;
  rawSql?: string;
  error?: string;
}
