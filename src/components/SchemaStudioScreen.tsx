import React, { useState } from 'react';
import { 
  Database, Play, Code, Copy, Check, Terminal, FileText, 
  Layers, Key, Link2, Sparkles, RefreshCw, Cpu
} from 'lucide-react';
import { SchemaTableDefinition, SqlQueryResult } from '../types.ts';
import { executeSql } from '../services/api.ts';

interface SchemaStudioScreenProps {
  schemas: Record<string, SchemaTableDefinition>;
}

export const SchemaStudioScreen: React.FC<SchemaStudioScreenProps> = ({ schemas }) => {
  const tableKeys = Object.keys(schemas);
  const [selectedTable, setSelectedTable] = useState<string>(tableKeys[0] || 'workloads');
  const [queryInput, setQueryInput] = useState<string>(
    `SELECT id, name, tier, environment, p99_latency_ms \nFROM workloads \nWHERE tier = 'Tier 0' \nORDER BY p99_latency_ms DESC;`
  );
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [queryResult, setQueryResult] = useState<SqlQueryResult | null>(null);
  const [copiedDdl, setCopiedDdl] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'columns' | 'indexes' | 'ddl'>('columns');

  const currentSchema = schemas[selectedTable];

  const presets = [
    {
      label: 'Tier 0 Mission-Critical Services',
      sql: `SELECT id, name, tier, environment, p99_latency_ms \nFROM workloads \nWHERE tier = 'Tier 0' \nORDER BY p99_latency_ms DESC;`
    },
    {
      label: 'EXPLAIN ANALYZE (Execution Plan)',
      sql: `EXPLAIN ANALYZE SELECT * FROM workloads WHERE tier = 'Tier 0';`
    },
    {
      label: 'Inspect Users & Authorization Roles',
      sql: `SELECT id, name, email, role, department FROM users ORDER BY name;`
    },
    {
      label: 'PostgreSQL Server Version',
      sql: `SELECT version();`
    },
    {
      label: 'Recent Operational Audit Events',
      sql: `SELECT actor_name, action, entity_type, ip_address, created_at \nFROM audit_logs \nLIMIT 5;`
    }
  ];

  const handleRunQuery = async () => {
    if (!queryInput.trim()) return;
    try {
      setIsExecuting(true);
      const res = await executeSql(queryInput);
      setQueryResult(res);
    } catch (err: any) {
      setQueryResult({
        success: false,
        error: err.message || 'Execution failed'
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCopyDdl = () => {
    if (currentSchema?.ddl) {
      navigator.clipboard.writeText(currentSchema.ddl);
      setCopiedDdl(true);
      setTimeout(() => setCopiedDdl(false), 2000);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">PostgreSQL Schema & SQL Studio</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Relational catalog inspector, DDL specifications, foreign keys, and live SQL query console
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
            Engine: PostgreSQL 16.2
          </span>
        </div>
      </div>

      {/* Main Split View: Left = Schema Catalog, Right = SQL Runner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Schema Table Explorer (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Table Selector Pills */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-2">
              <Database className="w-3.5 h-3.5 text-blue-400" />
              <span>Relational Tables ({tableKeys.length})</span>
            </h3>

            <div className="grid grid-cols-2 gap-2">
              {tableKeys.map((tblName) => {
                const isSelected = selectedTable === tblName;
                return (
                  <button
                    key={tblName}
                    onClick={() => setSelectedTable(tblName)}
                    className={`p-2.5 rounded-xl text-left border transition text-xs font-mono flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-600/15 border-blue-500/40 text-blue-400 font-semibold'
                        : 'bg-slate-800/40 border-slate-700/50 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="truncate">{tblName}</span>
                    <span className="text-[10px] text-slate-500">
                      {schemas[tblName]?.columns.length} col
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Table Inspection Card */}
          {currentSchema && (
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-sm font-bold text-white">{currentSchema.tableName}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      PK: {currentSchema.primaryKey}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{currentSchema.description}</p>
                </div>

                <div className="flex items-center space-x-1 border border-slate-700 rounded-lg p-0.5 bg-slate-800 text-[11px]">
                  <button
                    onClick={() => setActiveTab('columns')}
                    className={`px-2 py-0.5 rounded ${activeTab === 'columns' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
                  >
                    Columns
                  </button>
                  <button
                    onClick={() => setActiveTab('indexes')}
                    className={`px-2 py-0.5 rounded ${activeTab === 'indexes' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
                  >
                    Indexes
                  </button>
                  <button
                    onClick={() => setActiveTab('ddl')}
                    className={`px-2 py-0.5 rounded ${activeTab === 'ddl' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
                  >
                    DDL
                  </button>
                </div>
              </div>

              {/* Tab 1: Columns */}
              {activeTab === 'columns' && (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {currentSchema.columns.map((col) => (
                    <div
                      key={col.name}
                      className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/40 text-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-semibold text-slate-200">{col.name}</span>
                          {col.isPrimary && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center space-x-1">
                              <Key className="w-2.5 h-2.5 inline" />
                              <span>PK</span>
                            </span>
                          )}
                          {col.isForeignKey && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center space-x-1">
                              <Link2 className="w-2.5 h-2.5 inline" />
                              <span>FK: {col.references}</span>
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{col.description}</div>
                      </div>
                      <div className="text-right font-mono text-[11px]">
                        <span className="text-purple-400">{col.type}</span>
                        <div className="text-[10px] text-slate-500">{col.nullable ? 'NULL' : 'NOT NULL'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 2: Indexes */}
              {activeTab === 'indexes' && (
                <div className="space-y-2">
                  {currentSchema.indexes.map((idx) => (
                    <div key={idx.name} className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/40 text-xs">
                      <div className="flex items-center justify-between font-mono">
                        <span className="text-emerald-400 font-semibold">{idx.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                          {idx.unique ? 'UNIQUE' : 'INDEX'} ({idx.type})
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 font-mono">
                        Columns: ({idx.columns.join(', ')})
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 3: DDL */}
              {activeTab === 'ddl' && (
                <div className="relative">
                  <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-72">
                    {currentSchema.ddl}
                  </pre>
                  <button
                    onClick={handleCopyDdl}
                    className="absolute top-2 right-2 p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition flex items-center space-x-1 text-[10px]"
                  >
                    {copiedDdl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedDdl ? 'Copied' : 'Copy DDL'}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: SQL Studio Runner (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-4">
            {/* Studio Header & Presets */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-2">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span>Interactive SQL Query Console</span>
              </h3>
              <span className="text-[11px] text-slate-500">Press Run to execute against Postgres engine</span>
            </div>

            {/* Presets Chips */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
              {presets.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => setQueryInput(p.sql)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 whitespace-nowrap transition border border-slate-700/60 flex items-center space-x-1"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>{p.label}</span>
                </button>
              ))}
            </div>

            {/* Editor Area */}
            <div className="relative rounded-xl border border-slate-700/80 bg-slate-950 overflow-hidden">
              <textarea
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                rows={5}
                className="w-full p-3.5 bg-transparent font-mono text-xs text-slate-100 placeholder-slate-600 focus:outline-none resize-none leading-relaxed"
                placeholder="Write standard PostgreSQL query: SELECT, INSERT, UPDATE, EXPLAIN ANALYZE..."
              />
              <div className="px-3 py-2 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">
                  Schema: <span className="text-slate-200">public</span> • Transaction: <span className="text-emerald-400">AUTO-COMMIT</span>
                </span>
                <button
                  onClick={handleRunQuery}
                  disabled={isExecuting}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
                >
                  <Play className={`w-3.5 h-3.5 fill-current ${isExecuting ? 'animate-spin' : ''}`} />
                  <span>{isExecuting ? 'Executing...' : 'Run Query'}</span>
                </button>
              </div>
            </div>

            {/* Query Results / Execution Plan Output */}
            {queryResult && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className={`w-2 h-2 rounded-full ${queryResult.success ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                    <span className="font-semibold text-white">
                      {queryResult.success ? 'Query Succeeded' : 'Query Error'}
                    </span>
                    {queryResult.executionTimeMs && (
                      <span className="text-slate-400 font-mono text-[11px]">
                        ({queryResult.executionTimeMs} ms)
                      </span>
                    )}
                  </div>
                  {queryResult.rowCount !== undefined && (
                    <span className="text-[11px] font-mono text-slate-400">
                      {queryResult.rowCount} rows returned
                    </span>
                  )}
                </div>

                {queryResult.error ? (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-mono">
                    {queryResult.error}
                  </div>
                ) : queryResult.executionPlan ? (
                  /* EXPLAIN ANALYZE View */
                  <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-emerald-300 space-y-1">
                    <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">PostgreSQL Query Execution Plan</div>
                    {queryResult.executionPlan.map((line, lIdx) => (
                      <div key={lIdx} className="leading-relaxed">{line}</div>
                    ))}
                  </div>
                ) : (
                  /* Relational Tabular Results */
                  <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden max-h-64 overflow-y-auto">
                    {queryResult.rows && queryResult.rows.length > 0 ? (
                      <table className="w-full text-left text-xs font-mono text-slate-300">
                        <thead className="bg-slate-900 border-b border-slate-800 text-[10px] text-slate-400 uppercase">
                          <tr>
                            {Object.keys(queryResult.rows[0]).map((col) => (
                              <th key={col} className="px-3 py-2">{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {queryResult.rows.map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-slate-900/50">
                              {Object.values(row).map((val: any, cIdx) => (
                                <td key={cIdx} className="px-3 py-1.5 truncate max-w-xs">
                                  {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="p-4 text-center text-xs text-slate-500">0 rows returned.</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
