import React from 'react';
import { Table, Key, Hash } from 'lucide-react';
import type { Column, TableRow } from '../engine/types';

interface DataPreviewTableProps {
  attributes: string[];
  columns: Column[];
  rows: TableRow[];
  candidateKeys: string[][];
  primeAttributes: string[];
}

export const DataPreviewTable: React.FC<DataPreviewTableProps> = ({
  attributes,
  columns,
  rows,
  primeAttributes,
}) => {
  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Table className="h-5 w-5 text-cyan-400" />
            <span>Uploaded Messy Relation (Input Table)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Showing {rows.length} tuples across {attributes.length} attributes.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 inline-block shadow-sm shadow-cyan-400"></span>
            <span className="text-slate-300">Prime Attribute (In Key)</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-600 inline-block"></span>
            <span className="text-slate-400">Non-Prime</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60 max-h-72 overflow-y-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-950/90 text-slate-300 sticky top-0 z-10 border-b border-slate-800">
            <tr>
              <th className="py-2.5 px-3 font-semibold text-slate-500 w-10 text-center">#</th>
              {attributes.map((attr) => {
                const isPrime = primeAttributes.includes(attr);
                const colInfo = columns.find((c) => c.name === attr);
                return (
                  <th key={attr} className="py-2.5 px-3 font-semibold text-slate-200">
                    <div className="flex items-center space-x-1.5">
                      {isPrime ? (
                        <Key className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                      ) : (
                        <Hash className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      )}
                      <span className={isPrime ? 'text-cyan-300 font-bold' : 'text-slate-300'}>
                        {attr}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 font-normal mt-0.5">
                      {colInfo?.type || 'VARCHAR'}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
            {rows.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                <td className="py-2 px-3 text-center text-slate-500 text-[11px] font-sans">
                  {idx + 1}
                </td>
                {attributes.map((attr) => {
                  const val = row[attr];
                  const isPrime = primeAttributes.includes(attr);
                  return (
                    <td
                      key={attr}
                      className={`py-2 px-3 whitespace-nowrap ${
                        isPrime ? 'bg-cyan-950/20 text-cyan-200' : 'text-slate-300'
                      }`}
                    >
                      {val === null || val === undefined ? (
                        <span className="text-slate-600 italic">NULL</span>
                      ) : String(val)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
