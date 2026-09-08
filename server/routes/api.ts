/**
 * Express REST API Router for Enterprise Architecture Platform
 * Senior Architect standard: typed contracts, validation, structured errors.
 */

import { Router, Request, Response } from 'express';
import { postgresEngine } from '../db/mock-postgres.ts';

export const apiRouter = Router();

// Health Check & Infrastructure Topology
apiRouter.get('/health', (req: Request, res: Response) => {
  const pool = postgresEngine.getPoolStats();
  res.json({
    status: 'HEALTHY',
    service: 'Enterprise Architecture Platform Core',
    version: '1.0.0',
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      type: 'PostgreSQL 16.2 Enterprise Cluster',
      connectionPool: pool,
      readReplicaLagMs: 0.4,
      transactionIsolationLevel: 'READ COMMITTED',
      storageUsedMb: 1420.5,
      storageMaxMb: 51200.0,
      activeTransactions: 4,
    },
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      memoryUsage: process.memoryUsage(),
    },
    timestamp: new Date().toISOString(),
  });
});

// Workloads / Services CRUD
apiRouter.get('/workloads', (req: Request, res: Response) => {
  try {
    const { tier, environment, search } = req.query;
    const workloads = postgresEngine.getWorkloads({
      tier: typeof tier === 'string' ? tier : undefined,
      environment: typeof environment === 'string' ? environment : undefined,
      search: typeof search === 'string' ? search : undefined,
    });
    res.json({ success: true, count: workloads.length, data: workloads });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.get('/workloads/:id', (req: Request, res: Response) => {
  try {
    const workload = postgresEngine.getWorkloadById(req.params.id);
    if (!workload) {
      return res.status(404).json({ success: false, error: 'Workload not found' });
    }
    res.json({ success: true, data: workload });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.post('/workloads', (req: Request, res: Response) => {
  try {
    const {
      name,
      identifier,
      tier,
      environment,
      status,
      owner_id,
      repository_url,
      version,
      instances_count,
      cpu_cores,
      memory_gb,
      db_pool_size,
      endpoint_url,
    } = req.body;

    if (!name || !identifier || !tier || !environment || !owner_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, identifier, tier, environment, owner_id'
      });
    }

    const created = postgresEngine.createWorkload({
      name,
      identifier: identifier.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      tier: tier || 'Tier 1',
      environment: environment || 'production',
      status: status || 'healthy',
      owner_id,
      repository_url: repository_url || 'git://corp-vcs/internal/service.git',
      version: version || 'v1.0.0',
      instances_count: Number(instances_count) || 2,
      cpu_cores: Number(cpu_cores) || 2.0,
      memory_gb: Number(memory_gb) || 4.0,
      db_pool_size: Number(db_pool_size) || 10,
      endpoint_url: endpoint_url || `https://${identifier}.internal.corp.net`,
      p99_latency_ms: Number((Math.random() * 15 + 5).toFixed(1)),
      error_rate_percent: 0.001,
    });

    res.status(201).json({ success: true, data: created });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

apiRouter.put('/workloads/:id', (req: Request, res: Response) => {
  try {
    const updated = postgresEngine.updateWorkload(req.params.id, req.body);
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

apiRouter.delete('/workloads/:id', (req: Request, res: Response) => {
  try {
    postgresEngine.deleteWorkload(req.params.id);
    res.json({ success: true, message: `Workload ${req.params.id} successfully decommissioned` });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Telemetry Metrics
apiRouter.get('/metrics', (req: Request, res: Response) => {
  try {
    const metrics = postgresEngine.getMetrics();
    const pool = postgresEngine.getPoolStats();
    res.json({
      success: true,
      pool,
      metrics,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Users
apiRouter.get('/users', (req: Request, res: Response) => {
  try {
    const users = postgresEngine.getUsers();
    res.json({ success: true, count: users.length, data: users });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Audit Logs
apiRouter.get('/audit-logs', (req: Request, res: Response) => {
  try {
    const logs = postgresEngine.getAuditLogs();
    res.json({ success: true, count: logs.length, data: logs });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Database Schemas & DDL Catalog
apiRouter.get('/schemas', (req: Request, res: Response) => {
  try {
    const schemas = postgresEngine.getSchemas();
    res.json({ success: true, data: schemas });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Interactive SQL Executor
apiRouter.post('/sql/execute', (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ success: false, error: 'Query string is required.' });
    }

    const executionResult = postgresEngine.executeSql(query);
    res.json(executionResult);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
