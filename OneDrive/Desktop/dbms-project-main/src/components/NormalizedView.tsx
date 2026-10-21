import React, { useState } from 'react';
import { Sparkles, Table, Key, Link as LinkIcon } from 'lucide-react';
import type { DecomposedTable } from '../engine/types';

interface NormalizedViewProps {
  decomposedTables: DecomposedTable[];
  originalTableName: string;
}

export const NormalizedView: React.FC<NormalizedViewProps> = ({
  decomposedTables,
}) => {
  const [activeTableId, setActiveTableId] = useState<string>(
    decomposedTables[0]?.id || ''
  );

  const activeTable = decomposedTables.find((t) => t.id === activeTableId) || decomposedTables[0];

  return (
    <div className="glass-panel rounded-2xl p-6 border border-emerald-900/60 space-y-6 shadow-2xl glow-emerald">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20">
            <Sparkles className="h-6 w-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-slate-100">
                After Doctor's Treatment (Normalized 3NF Schema)
              </h2>
              <span className="px-2.5 py-0.5 text-xs font-mono font-bold rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                Lossless Join & Dependency Preserving
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Original messy relation decomposed into {decomposedTables.length} normalized 3NF tables without data redundancy or anomalies.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {decomposedTables.map((tbl) => {
          const isActive = tbl.id === activeTableId;
          return (
            <div
              key={tbl.id}
              onClick={() => setActiveTableId(tbl.id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                isActive
                  ? 'bg-slate-900 border-cyan-500/80 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-500/30'
                  : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-1.5 font-mono font-bold text-sm text-cyan-300">
                    <Table className="h-4 w-4" />
                    <span>{tbl.name}</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    {tbl.data.length} tuples
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2">
                  {tbl.reason}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-xs font-mono">
                <div className="flex items-center space-x-1 text-slate-300">
                  <Key className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                  <span className="text-cyan-400 font-bold">PK:</span>
                  <span className="text-slate-200">&#123; {tbl.primaryKey.join(', ')} &#125;</span>
                </div>

                {tbl.foreignKeys.length > 0 && (
                  <div className="flex items-center space-x-1 text-slate-400 text-[11px]">
                    <LinkIcon className="h-3.5 w-3.5 text-teal-400 shrink-0" />
                    <span className="text-teal-400 font-bold">FK:</span>
                    <span>
                      {tbl.foreignKeys
                        .map(
                          (fk) =>
                            `[${fk.column.join(',')}] → ${fk.referencedTable}`
                        )
                        .join('; ')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {activeTable && (
        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-100 font-mono">
                  {activeTable.name}
                </h3>
                <span className="text-xs text-cyan-400 font-mono font-semibold px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800">
                  Primary Key: &#123; {activeTable.primaryKey.join(', ')} &#125;
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{activeTable.reason}</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/80 max-h-64 overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead className="bg-slate-900 text-slate-300 sticky top-0 z-10 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3 font-semibold text-slate-500 w-10 text-center">#</th>
                  {activeTable.attributes.map((attr) => {
                    const isPk = activeTable.primaryKey.includes(attr);
                    const isFk = activeTable.foreignKeys.some((fk) =>
                      fk.column.includes(attr)
                    );
                    return (
                      <th key={attr} className="py-2.5 px-3 font-semibold">
                        <div className="flex items-center space-x-1">
                          {isPk && <Key className="h-3.5 w-3.5 text-cyan-400" />}
                          {isFk && <LinkIcon className="h-3.5 w-3.5 text-teal-400" />}
                          <span
                            className={
                              isPk
                                ? 'text-cyan-300 font-bold underline decoration-cyan-500'
                                : isFk
                                ? 'text-teal-300 font-bold'
                                : 'text-slate-300'
                            }
                          >
                            {attr}
                          </span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {activeTable.data.length > 0 ? (
                  activeTable.data.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2 px-3 text-center text-slate-500 text-[11px] font-sans">
                        {idx + 1}
                      </td>
                      {activeTable.attributes.map((attr) => (
                        <td key={attr} className="py-2 px-3 whitespace-nowrap">
                          {row[attr] === null || row[attr] === undefined ? (
                            <span className="text-slate-600 italic">NULL</span>
                          ) : (
                            String(row[attr])
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={activeTable.attributes.length + 1}
                      className="py-4 text-center text-slate-500"
                    >
                      No sample tuples mapped.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
