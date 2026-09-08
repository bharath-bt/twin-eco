/**
 * Mock PostgreSQL Database Engine
 * Implements relational storage, connection pool telemetry, and an in-engine SQL query interpreter
 * designed to emulate PostgreSQL 16 behaviour with relational integrity, indexes, and execution plans.
 */

import type { UserRow, WorkloadRow, DatabaseMetricRow, AuditLogRow, SchemaTableDefinition } from './schema.ts';
import { POSTGRES_TABLE_SCHEMAS } from './schema.ts';

interface ConnectionPoolStats {
  totalCount: number;
  idleCount: number;
  waitingCount: number;
  activeCount: number;
  avgLatencyMs: number;
  maxConnections: number;
}

class MockPostgreSQLEngine {
  private users: Map<string, UserRow> = new Map();
  private workloads: Map<string, WorkloadRow> = new Map();
  private metrics: DatabaseMetricRow[] = [];
  private auditLogs: AuditLogRow[] = [];
  
  private poolStats: ConnectionPoolStats = {
    totalCount: 10,
    idleCount: 7,
    waitingCount: 0,
    activeCount: 3,
    avgLatencyMs: 1.42,
    maxConnections: 50,
  };

  constructor() {
    this.seedDatabase();
  }

  private seedDatabase() {
    // Seed Users
    const seedUsers: UserRow[] = [
      {
        id: 'u-1001-9876',
        email: 'alex.vance@enterprise-arch.internal',
        name: 'Alex Vance',
        role: 'Lead Architect',
        department: 'Core Infrastructure',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        created_at: new Date(Date.now() - 180 * 86400000).toISOString(),
        last_login: new Date(Date.now() - 12 * 60000).toISOString(),
      },
      {
        id: 'u-1002-8451',
        email: 'david.chen@enterprise-arch.internal',
        name: 'David Chen',
        role: 'Staff Engineer',
        department: 'Platform Engineering',
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
        created_at: new Date(Date.now() - 120 * 86400000).toISOString(),
        last_login: new Date(Date.now() - 45 * 60000).toISOString(),
      },
      {
        id: 'u-1003-3392',
        email: 'priya.sharma@enterprise-arch.internal',
        name: 'Priya Sharma',
        role: 'DevOps Specialist',
        department: 'SRE & Reliability',
        avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80',
        created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
        last_login: new Date(Date.now() - 5 * 60000).toISOString(),
      },
      {
        id: 'u-1004-7719',
        email: 'marcus.brooks@enterprise-arch.internal',
        name: 'Marcus Brooks',
        role: 'Security Auditor',
        department: 'InfoSec & Compliance',
        avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
        created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
        last_login: new Date(Date.now() - 2 * 3600000).toISOString(),
      }
    ];

    seedUsers.forEach(u => this.users.set(u.id, u));

    // Seed Workloads
    const seedWorkloads: WorkloadRow[] = [
      {
        id: 'wl-901-auth',
        name: 'Enterprise Auth & Identity Broker',
        identifier: 'auth-broker-service',
        tier: 'Tier 0',
        environment: 'production',
        status: 'healthy',
        owner_id: 'u-1001-9876',
        repository_url: 'git://corp-vcs/security/auth-broker.git',
        version: 'v3.8.4',
        instances_count: 8,
        cpu_cores: 16.0,
        memory_gb: 32.0,
        db_pool_size: 25,
        endpoint_url: 'https://auth.internal.corp.net/v1',
        p99_latency_ms: 8.4,
        error_rate_percent: 0.002,
        created_at: new Date(Date.now() - 45 * 86400000).toISOString(),
        updated_at: new Date(Date.now() - 10 * 60000).toISOString(),
      },
      {
        id: 'wl-902-checkout',
        name: 'Real-Time Transaction Clearinghouse',
        identifier: 'txn-clearinghouse',
        tier: 'Tier 0',
        environment: 'production',
        status: 'healthy',
        owner_id: 'u-1002-8451',
        repository_url: 'git://corp-vcs/finance/txn-clearinghouse.git',
        version: 'v4.1.0',
        instances_count: 12,
        cpu_cores: 32.0,
        memory_gb: 64.0,
        db_pool_size: 40,
        endpoint_url: 'https://clearing.internal.corp.net/rpc',
        p99_latency_ms: 14.2,
        error_rate_percent: 0.005,
        created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
        updated_at: new Date(Date.now() - 3 * 3600000).toISOString(),
      },
      {
        id: 'wl-903-stream',
        name: 'Kafka Ingestion & Telemetry Bus',
        identifier: 'kafka-event-pipeline',
        tier: 'Tier 1',
        environment: 'production',
        status: 'warning',
        owner_id: 'u-1003-3392',
        repository_url: 'git://corp-vcs/data/kafka-event-pipeline.git',
        version: 'v2.12.1',
        instances_count: 6,
        cpu_cores: 12.0,
        memory_gb: 24.0,
        db_pool_size: 15,
        endpoint_url: 'https://stream.internal.corp.net/consume',
        p99_latency_ms: 48.7,
        error_rate_percent: 0.082,
        created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
        updated_at: new Date(Date.now() - 8 * 60000).toISOString(),
      },
      {
        id: 'wl-904-graphql',
        name: 'Unified GraphQL Federation Gateway',
        identifier: 'graphql-federation',
        tier: 'Tier 1',
        environment: 'production',
        status: 'healthy',
        owner_id: 'u-1001-9876',
        repository_url: 'git://corp-vcs/gateway/graphql-federation.git',
        version: 'v5.0.2',
        instances_count: 6,
        cpu_cores: 8.0,
        memory_gb: 16.0,
        db_pool_size: 20,
        endpoint_url: 'https://api.corp.net/graphql',
        p99_latency_ms: 19.3,
        error_rate_percent: 0.012,
        created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
        updated_at: new Date(Date.now() - 2 * 60000).toISOString(),
      },
      {
        id: 'wl-905-etl',
        name: 'Nightly Postgres OLAP Sync Engine',
        identifier: 'postgres-olap-sync',
        tier: 'Tier 2',
        environment: 'staging',
        status: 'healthy',
        owner_id: 'u-1003-3392',
        repository_url: 'git://corp-vcs/analytics/postgres-olap-sync.git',
        version: 'v1.4.9',
        instances_count: 2,
        cpu_cores: 4.0,
        memory_gb: 8.0,
        db_pool_size: 8,
        endpoint_url: 'https://etl-staging.internal.corp.net',
        p99_latency_ms: 62.0,
        error_rate_percent: 0.000,
        created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
        updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
      },
      {
        id: 'wl-906-audit',
        name: 'Regulatory Compliance & Vault Logger',
        identifier: 'compliance-vault-logger',
        tier: 'Tier 0',
        environment: 'dr',
        status: 'healthy',
        owner_id: 'u-1004-7719',
        repository_url: 'git://corp-vcs/sec/compliance-vault-logger.git',
        version: 'v2.0.1',
        instances_count: 4,
        cpu_cores: 8.0,
        memory_gb: 16.0,
        db_pool_size: 16,
        endpoint_url: 'https://vault.internal.corp.net/append',
        p99_latency_ms: 11.8,
        error_rate_percent: 0.001,
        created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
        updated_at: new Date(Date.now() - 14 * 60000).toISOString(),
      }
    ];

    seedWorkloads.forEach(w => this.workloads.set(w.id, w));

    // Seed Metrics (24 hourly data points)
    const now = Date.now();
    for (let i = 24; i >= 0; i--) {
      const ts = new Date(now - i * 3600000).toISOString();
      const readIops = Math.floor(1800 + Math.sin(i / 3) * 450 + (Math.random() * 100));
      const writeIops = Math.floor(650 + Math.cos(i / 2) * 180 + (Math.random() * 50));
      const activeConn = Math.floor(12 + Math.sin(i / 4) * 6 + (Math.random() * 3));
      const avgQueryTime = Number((1.2 + Math.sin(i / 2) * 0.4 + Math.random() * 0.3).toFixed(2));
      const cpu = Number((28 + Math.sin(i / 3) * 14 + Math.random() * 5).toFixed(1));
      const mem = Number((42 + (24 - i) * 0.3 + Math.random() * 2).toFixed(1));

      this.metrics.push({
        id: `met-${1000 + i}`,
        workload_id: 'wl-901-auth',
        timestamp: ts,
        read_iops: readIops,
        write_iops: writeIops,
        active_connections: activeConn,
        idle_connections: 38 - activeConn,
        avg_query_time_ms: avgQueryTime,
        cpu_utilization_pct: cpu,
        memory_utilization_pct: mem,
      });
    }

    // Seed Audit Logs
    const seedAuditLogs: AuditLogRow[] = [
      {
        id: 'aud-001',
        actor_id: 'u-1001-9876',
        actor_name: 'Alex Vance',
        action: 'SCHEMA_INDEX_CREATION',
        entity_type: 'DATABASE',
        entity_id: 'idx_workloads_tier_env',
        details: 'Added composite btree index on workloads (tier, environment) to optimize p99 query latency',
        ip_address: '10.240.12.8',
        status: 'SUCCESS',
        created_at: new Date(Date.now() - 14 * 60000).toISOString(),
      },
      {
        id: 'aud-002',
        actor_id: 'u-1003-3392',
        actor_name: 'Priya Sharma',
        action: 'POOL_AUTO_SCALE',
        entity_type: 'WORKLOAD',
        entity_id: 'wl-903-stream',
        details: 'Scaled Postgres pool size from 10 to 15 connections during Kafka ingestion surge',
        ip_address: '10.240.18.22',
        status: 'SUCCESS',
        created_at: new Date(Date.now() - 42 * 60000).toISOString(),
      },
      {
        id: 'aud-003',
        actor_id: 'u-1002-8451',
        actor_name: 'David Chen',
        action: 'CANARY_PROMOTION',
        entity_type: 'WORKLOAD',
        entity_id: 'wl-902-checkout',
        details: 'Promoted txn-clearinghouse v4.1.0 to 100% production traffic post automated smoke tests',
        ip_address: '10.240.9.11',
        status: 'SUCCESS',
        created_at: new Date(Date.now() - 110 * 60000).toISOString(),
      },
      {
        id: 'aud-004',
        actor_id: 'u-1004-7719',
        actor_name: 'Marcus Brooks',
        action: 'SECURITY_AUDIT_CHECK',
        entity_type: 'SECURITY',
        entity_id: 'sec-pci-dss-q3',
        details: 'Completed cryptographic verification of pg_crypto column-level encryption keys',
        ip_address: '10.240.4.101',
        status: 'SUCCESS',
        created_at: new Date(Date.now() - 320 * 60000).toISOString(),
      },
      {
        id: 'aud-005',
        actor_id: 'u-1003-3392',
        actor_name: 'Priya Sharma',
        action: 'HEALTH_CHECK_ALERT',
        entity_type: 'WORKLOAD',
        entity_id: 'wl-903-stream',
        details: 'P99 latency threshold breached: 48.7ms (Warning threshold: 45ms). High buffer lock contention.',
        ip_address: '10.240.18.22',
        status: 'WARNING',
        created_at: new Date(Date.now() - 480 * 60000).toISOString(),
      }
    ];

    this.auditLogs = seedAuditLogs;
  }

  // Workloads CRUD
  public getWorkloads(filters?: { tier?: string; environment?: string; search?: string }): (WorkloadRow & { owner: UserRow | null })[] {
    let list = Array.from(this.workloads.values());

    if (filters?.tier && filters.tier !== 'all') {
      list = list.filter(w => w.tier === filters.tier);
    }
    if (filters?.environment && filters.environment !== 'all') {
      list = list.filter(w => w.environment === filters.environment);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(w => w.name.toLowerCase().includes(q) || w.identifier.toLowerCase().includes(q));
    }

    return list.map(w => ({
      ...w,
      owner: this.users.get(w.owner_id) || null
    }));
  }

  public getWorkloadById(id: string): (WorkloadRow & { owner: UserRow | null }) | null {
    const w = this.workloads.get(id);
    if (!w) return null;
    return {
      ...w,
      owner: this.users.get(w.owner_id) || null
    };
  }

  public createWorkload(data: Omit<WorkloadRow, 'id' | 'created_at' | 'updated_at'>, actorId: string = 'u-1001-9876'): WorkloadRow {
    const id = `wl-${Date.now().toString().slice(-4)}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    
    // Foreign key validation
    if (!this.users.has(data.owner_id)) {
      throw new Error(`Foreign Key Violation: owner_id '${data.owner_id}' does not exist in 'users' table.`);
    }

    // Unique identifier check
    for (const existing of this.workloads.values()) {
      if (existing.identifier === data.identifier) {
        throw new Error(`Unique Constraint Violation: Identifier '${data.identifier}' already exists in 'workloads'.`);
      }
    }

    const newWorkload: WorkloadRow = {
      ...data,
      id,
      created_at: now,
      updated_at: now,
    };

    this.workloads.set(id, newWorkload);

    // Append to audit log
    const actor = this.users.get(actorId);
    this.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      actor_id: actorId,
      actor_name: actor?.name || 'System Operator',
      action: 'WORKLOAD_CREATED',
      entity_type: 'WORKLOAD',
      entity_id: id,
      details: `Provisioned workload '${newWorkload.name}' (${newWorkload.identifier}) with ${newWorkload.instances_count} replicas`,
      ip_address: '127.0.0.1',
      status: 'SUCCESS',
      created_at: now,
    });

    return newWorkload;
  }

  public updateWorkload(id: string, updates: Partial<WorkloadRow>, actorId: string = 'u-1001-9876'): WorkloadRow {
    const existing = this.workloads.get(id);
    if (!existing) {
      throw new Error(`Record with id '${id}' not found in 'workloads' table.`);
    }

    if (updates.owner_id && !this.users.has(updates.owner_id)) {
      throw new Error(`Foreign Key Violation: owner_id '${updates.owner_id}' does not exist in 'users' table.`);
    }

    const updated: WorkloadRow = {
      ...existing,
      ...updates,
      id: existing.id, // Immutable PK
      updated_at: new Date().toISOString(),
    };

    this.workloads.set(id, updated);

    const actor = this.users.get(actorId);
    this.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      actor_id: actorId,
      actor_name: actor?.name || 'System Operator',
      action: 'WORKLOAD_UPDATED',
      entity_type: 'WORKLOAD',
      entity_id: id,
      details: `Updated workload '${updated.name}' fields: ${Object.keys(updates).join(', ')}`,
      ip_address: '127.0.0.1',
      status: 'SUCCESS',
      created_at: new Date().toISOString(),
    });

    return updated;
  }

  public deleteWorkload(id: string, actorId: string = 'u-1001-9876'): boolean {
    const existing = this.workloads.get(id);
    if (!existing) {
      throw new Error(`Workload with id '${id}' not found.`);
    }

    this.workloads.delete(id);

    const actor = this.users.get(actorId);
    this.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      actor_id: actorId,
      actor_name: actor?.name || 'System Operator',
      action: 'WORKLOAD_DECOMMISSIONED',
      entity_type: 'WORKLOAD',
      entity_id: id,
      details: `Decommissioned workload '${existing.name}' (${existing.identifier})`,
      ip_address: '127.0.0.1',
      status: 'SUCCESS',
      created_at: new Date().toISOString(),
    });

    return true;
  }

  // Users
  public getUsers(): UserRow[] {
    return Array.from(this.users.values());
  }

  // Telemetry & Metrics
  public getMetrics(): DatabaseMetricRow[] {
    return this.metrics;
  }

  public getPoolStats(): ConnectionPoolStats {
    // Dynamic slight oscillation to reflect active query engine
    return {
      ...this.poolStats,
      activeCount: Math.min(this.poolStats.maxConnections, Math.max(1, 3 + Math.floor(Math.random() * 4))),
      avgLatencyMs: Number((1.35 + (Math.random() * 0.2)).toFixed(2))
    };
  }

  // Audit Logs
  public getAuditLogs(): AuditLogRow[] {
    return this.auditLogs.slice(0, 50);
  }

  // Schemas
  public getSchemas(): Record<string, SchemaTableDefinition> {
    return POSTGRES_TABLE_SCHEMAS;
  }

  // SQL Query Execution Engine
  public executeSql(sqlQuery: string) {
    const trimmed = sqlQuery.trim();
    const startTime = performance.now();
    const lower = trimmed.toLowerCase();

    // EXPLAIN ANALYZE support
    const isExplain = lower.startsWith('explain') || lower.startsWith('explain analyze');
    const cleanQuery = isExplain 
      ? trimmed.replace(/^explain\s+(analyze\s+)?/i, '').trim()
      : trimmed;
    const cleanLower = cleanQuery.toLowerCase();

    let resultRows: any[] = [];
    let affectedRows = 0;
    let queryType = 'SELECT';

    try {
      if (cleanLower.startsWith('select')) {
        queryType = 'SELECT';
        if (cleanLower.includes('from workloads')) {
          resultRows = this.getWorkloads();
          if (cleanLower.includes('tier 0')) {
            resultRows = resultRows.filter((r: any) => r.tier === 'Tier 0');
          }
          if (cleanLower.includes('where status =') || cleanLower.includes("where status='warning'") || cleanLower.includes("where status = 'warning'")) {
            resultRows = resultRows.filter((r: any) => r.status === 'warning');
          }
          if (cleanLower.includes('order by p99_latency_ms desc')) {
            resultRows = [...resultRows].sort((a, b) => b.p99_latency_ms - a.p99_latency_ms);
          }
          if (cleanLower.includes('limit 3')) {
            resultRows = resultRows.slice(0, 3);
          } else if (cleanLower.includes('limit 5')) {
            resultRows = resultRows.slice(0, 5);
          }
        } else if (cleanLower.includes('from users')) {
          resultRows = this.getUsers();
        } else if (cleanLower.includes('from audit_logs')) {
          resultRows = this.getAuditLogs();
        } else if (cleanLower.includes('from database_metrics')) {
          resultRows = this.getMetrics().slice(-10);
        } else if (cleanLower.includes('version()')) {
          resultRows = [{ version: 'PostgreSQL 16.2 (Debian 16.2-1.pgdg120+1) on x86_64-pc-linux-gnu' }];
        } else {
          // Generic fallback
          resultRows = this.getWorkloads().slice(0, 4);
        }
        affectedRows = resultRows.length;
      } else if (cleanLower.startsWith('insert into workloads')) {
        queryType = 'INSERT';
        affectedRows = 1;
        resultRows = [{ status: 'INSERT 0 1', message: 'Row inserted successfully into workloads' }];
      } else if (cleanLower.startsWith('update workloads')) {
        queryType = 'UPDATE';
        affectedRows = 1;
        resultRows = [{ status: 'UPDATE 1', message: 'Updated 1 row in workloads' }];
      } else {
        queryType = 'COMMAND';
        resultRows = [{ status: 'OK', query: cleanQuery }];
        affectedRows = 1;
      }

      const executionTimeMs = Number((performance.now() - startTime + (Math.random() * 2 + 0.8)).toFixed(3));

      let executionPlan = null;
      if (isExplain) {
        executionPlan = [
          `Seq Scan on workloads (cost=0.00..1.08 rows=${affectedRows} width=182) (actual time=0.018..${executionTimeMs} rows=${affectedRows} loops=1)`,
          `  Filter: (tier = 'Tier 0'::character varying)`,
          `  Buffers: shared hit=2`,
          `Planning Time: 0.082 ms`,
          `Execution Time: ${executionTimeMs} ms`,
          `Index Condition: idx_workloads_tier_env used for btree scan`
        ];
      }

      return {
        success: true,
        queryType,
        rowCount: affectedRows,
        executionTimeMs,
        rows: resultRows,
        executionPlan,
        rawSql: trimmed
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'PostgreSQL Syntax or Execution Error',
        executionTimeMs: Number((performance.now() - startTime).toFixed(3)),
        rawSql: trimmed
      };
    }
  }
}

// Singleton storage engine
export const postgresEngine = new MockPostgreSQLEngine();
