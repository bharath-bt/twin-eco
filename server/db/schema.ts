/**
 * PostgreSQL Database Relational Schema Definitions
 * Architected for enterprise workload management, telemetry, and audit compliance.
 */

export interface UserRow {
  id: string;
  email: string;
  name: string;
  role: 'Lead Architect' | 'Staff Engineer' | 'DevOps Specialist' | 'Security Auditor';
  department: string;
  avatar_url: string;
  created_at: string;
  last_login: string;
}

export interface WorkloadRow {
  id: string;
  name: string;
  identifier: string;
  tier: 'Tier 0' | 'Tier 1' | 'Tier 2';
  environment: 'production' | 'staging' | 'canary' | 'dr';
  status: 'healthy' | 'warning' | 'critical' | 'provisioning';
  owner_id: string;
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

export interface DatabaseMetricRow {
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

export interface AuditLogRow {
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

export const POSTGRES_TABLE_SCHEMAS: Record<string, SchemaTableDefinition> = {
  users: {
    tableName: 'users',
    description: 'Enterprise team members, roles, and authorization credentials',
    primaryKey: 'id',
    columns: [
      { name: 'id', type: 'UUID', nullable: false, isPrimary: true, description: 'Primary unique identifier' },
      { name: 'email', type: 'VARCHAR(255)', nullable: false, description: 'Unique corporate email address' },
      { name: 'name', type: 'VARCHAR(120)', nullable: false, description: 'Full legal/display name' },
      { name: 'role', type: 'VARCHAR(60)', nullable: false, description: 'RBAC Authorization tier' },
      { name: 'department', type: 'VARCHAR(100)', nullable: false, description: 'Engineering organization unit' },
      { name: 'avatar_url', type: 'TEXT', nullable: true, description: 'Profile avatar URI' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, description: 'Creation timestamp' },
      { name: 'last_login', type: 'TIMESTAMPTZ', nullable: false, description: 'Last authenticated session' }
    ],
    indexes: [
      { name: 'idx_users_email_unique', columns: ['email'], type: 'btree', unique: true },
      { name: 'idx_users_role', columns: ['role'], type: 'btree', unique: false }
    ],
    ddl: `CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  role VARCHAR(60) NOT NULL CHECK (role IN ('Lead Architect', 'Staff Engineer', 'DevOps Specialist', 'Security Auditor')),
  department VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_users_email_unique ON users (email);
CREATE INDEX idx_users_role ON users (role);`
  },
  workloads: {
    tableName: 'workloads',
    description: 'Mission-critical microservices, API gateways, and distributed compute workloads',
    primaryKey: 'id',
    columns: [
      { name: 'id', type: 'UUID', nullable: false, isPrimary: true, description: 'Primary UUID' },
      { name: 'name', type: 'VARCHAR(150)', nullable: false, description: 'Human-readable service title' },
      { name: 'identifier', type: 'VARCHAR(100)', nullable: false, description: 'DNS-safe kebab service tag' },
      { name: 'tier', type: 'VARCHAR(20)', nullable: false, description: 'SLA Criticality: Tier 0, Tier 1, Tier 2' },
      { name: 'environment', type: 'VARCHAR(30)', nullable: false, description: 'Deployment realm' },
      { name: 'status', type: 'VARCHAR(30)', nullable: false, description: 'Telemetry state: healthy, warning, critical' },
      { name: 'owner_id', type: 'UUID', nullable: false, isForeignKey: true, references: 'users(id)', description: 'Lead architect owner' },
      { name: 'repository_url', type: 'TEXT', nullable: false, description: 'VCS Repository' },
      { name: 'version', type: 'VARCHAR(40)', nullable: false, description: 'Semantic deployment release' },
      { name: 'instances_count', type: 'INT', nullable: false, description: 'Horizontal replica count' },
      { name: 'cpu_cores', type: 'FLOAT', nullable: false, description: 'Allocated vCPUs' },
      { name: 'memory_gb', type: 'FLOAT', nullable: false, description: 'Allocated memory in GB' },
      { name: 'db_pool_size', type: 'INT', nullable: false, description: 'PostgreSQL max dedicated pool size' },
      { name: 'endpoint_url', type: 'TEXT', nullable: false, description: 'Public/Internal ingress URI' },
      { name: 'p99_latency_ms', type: 'FLOAT', nullable: false, description: '99th percentile latency in milliseconds' },
      { name: 'error_rate_percent', type: 'FLOAT', nullable: false, description: 'Trailing 24h error percentage' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, description: 'Deployment registration time' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', nullable: false, description: 'Last state sync time' }
    ],
    indexes: [
      { name: 'idx_workloads_identifier', columns: ['identifier'], type: 'btree', unique: true },
      { name: 'idx_workloads_tier_env', columns: ['tier', 'environment'], type: 'btree', unique: false },
      { name: 'idx_workloads_owner', columns: ['owner_id'], type: 'btree', unique: false }
    ],
    ddl: `CREATE TABLE workloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  identifier VARCHAR(100) NOT NULL UNIQUE,
  tier VARCHAR(20) NOT NULL CHECK (tier IN ('Tier 0', 'Tier 1', 'Tier 2')),
  environment VARCHAR(30) NOT NULL CHECK (environment IN ('production', 'staging', 'canary', 'dr')),
  status VARCHAR(30) NOT NULL DEFAULT 'healthy',
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  repository_url TEXT NOT NULL,
  version VARCHAR(40) NOT NULL,
  instances_count INT NOT NULL DEFAULT 2,
  cpu_cores NUMERIC(5,2) NOT NULL DEFAULT 2.0,
  memory_gb NUMERIC(5,2) NOT NULL DEFAULT 4.0,
  db_pool_size INT NOT NULL DEFAULT 10,
  endpoint_url TEXT NOT NULL,
  p99_latency_ms NUMERIC(7,2) NOT NULL DEFAULT 12.50,
  error_rate_percent NUMERIC(5,3) NOT NULL DEFAULT 0.010,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_workloads_identifier ON workloads (identifier);
CREATE INDEX idx_workloads_tier_env ON workloads (tier, environment);
CREATE INDEX idx_workloads_owner ON workloads (owner_id);`
  },
  database_metrics: {
    tableName: 'database_metrics',
    description: 'High-resolution time-series PostgreSQL telemetry and resource saturation logs',
    primaryKey: 'id',
    columns: [
      { name: 'id', type: 'UUID', nullable: false, isPrimary: true, description: 'Metric sample ID' },
      { name: 'workload_id', type: 'UUID', nullable: false, isForeignKey: true, references: 'workloads(id)', description: 'Target workload relation' },
      { name: 'timestamp', type: 'TIMESTAMPTZ', nullable: false, description: 'Sample collection window' },
      { name: 'read_iops', type: 'INT', nullable: false, description: 'Disk read operations per second' },
      { name: 'write_iops', type: 'INT', nullable: false, description: 'Disk write operations per second' },
      { name: 'active_connections', type: 'INT', nullable: false, description: 'Live running queries in pg_stat_activity' },
      { name: 'idle_connections', type: 'INT', nullable: false, description: 'Idle pool sockets' },
      { name: 'avg_query_time_ms', type: 'FLOAT', nullable: false, description: 'Average query execution time' },
      { name: 'cpu_utilization_pct', type: 'FLOAT', nullable: false, description: 'Host CPU load percentage' },
      { name: 'memory_utilization_pct', type: 'FLOAT', nullable: false, description: 'Host RAM load percentage' }
    ],
    indexes: [
      { name: 'idx_metrics_workload_time', columns: ['workload_id', 'timestamp'], type: 'btree', unique: false }
    ],
    ddl: `CREATE TABLE database_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workload_id UUID NOT NULL REFERENCES workloads(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_iops INT NOT NULL,
  write_iops INT NOT NULL,
  active_connections INT NOT NULL,
  idle_connections INT NOT NULL,
  avg_query_time_ms NUMERIC(6,2) NOT NULL,
  cpu_utilization_pct NUMERIC(5,2) NOT NULL,
  memory_utilization_pct NUMERIC(5,2) NOT NULL
);
CREATE INDEX idx_metrics_workload_time ON database_metrics (workload_id, timestamp DESC);`
  },
  audit_logs: {
    tableName: 'audit_logs',
    description: 'Immutable append-only enterprise security and operational audit trail',
    primaryKey: 'id',
    columns: [
      { name: 'id', type: 'UUID', nullable: false, isPrimary: true, description: 'Immutable log entry ID' },
      { name: 'actor_id', type: 'UUID', nullable: false, isForeignKey: true, references: 'users(id)', description: 'User making the modification' },
      { name: 'actor_name', type: 'VARCHAR(120)', nullable: false, description: 'Cached actor full name' },
      { name: 'action', type: 'VARCHAR(100)', nullable: false, description: 'Action opcode or verb' },
      { name: 'entity_type', type: 'VARCHAR(50)', nullable: false, description: 'Subject domain category' },
      { name: 'entity_id', type: 'VARCHAR(100)', nullable: false, description: 'Subject record identifier' },
      { name: 'details', type: 'TEXT', nullable: false, description: 'JSON or plaintext audit context' },
      { name: 'ip_address', type: 'INET', nullable: false, description: 'Client IP origin' },
      { name: 'status', type: 'VARCHAR(20)', nullable: false, description: 'SUCCESS, FAILURE, or WARNING' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, description: 'Log commit timestamp' }
    ],
    indexes: [
      { name: 'idx_audit_logs_created', columns: ['created_at'], type: 'btree', unique: false },
      { name: 'idx_audit_logs_actor', columns: ['actor_id'], type: 'btree', unique: false }
    ],
    ddl: `CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID NOT NULL REFERENCES users(id),
  actor_name VARCHAR(120) NOT NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('WORKLOAD', 'DATABASE', 'SECURITY', 'SCHEMA')),
  entity_id VARCHAR(100) NOT NULL,
  details TEXT NOT NULL,
  ip_address INET NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('SUCCESS', 'FAILURE', 'WARNING')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_audit_logs_created ON audit_logs (created_at DESC);
CREATE INDEX idx_audit_logs_actor ON audit_logs (actor_id);`
  }
};
