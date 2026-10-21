import React, { useState } from 'react';
import { Download, Copy, Check, X, FileCode2, FileSpreadsheet } from 'lucide-react';
import JSZip from 'jszip';
import type { Column, DecomposedTable, SQLDialect, TableRow } from '../engine/types';
import { generateSQLScript } from '../engine/sqlGenerator';

interface SQLExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tables: DecomposedTable[];
  columns: Column[];
  originalRows: TableRow[];
}

export const SQLExportModal: React.FC<SQLExportModalProps> = ({
  isOpen,
  onClose,
  tables,
  columns,
  originalRows,
}) => {
  const [dialect, setDialect] = useState<SQLDialect>('postgresql');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const sqlCode = generateSQLScript(tables, columns, originalRows, dialect);

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSQL = () => {
    const blob = new Blob([sqlCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schema_doctor_normalized_${dialect}.sql`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCSVsZip = async () => {
    const zip = new JSZip();

    tables.forEach((t) => {
      const header = t.attributes.join(',');
      const rows = t.data.map((r) =>
        t.attributes
          .map((a) => {
            const v = r[a];
            if (v === null || v === undefined) return '';
            const s = String(v);
            return s.includes(',') ? `"${s}"` : s;
          })
          .join(',')
      );

      const csvContent = [header, ...rows].join('\n');
      zip.file(`${t.name}.csv`, csvContent);
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'normalized_tables_csv.zip';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="glass-panel w-full max-w-4xl rounded-2xl p-6 border border-slate-800 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center">
              <FileCode2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                Export Normalized SQL DDL & DML Scripts
              </h3>
              <p className="text-xs text-slate-400">
                Generates CREATE TABLE schema with Foreign Keys and migrated INSERT INTO statements.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800 shrink-0 text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-slate-400 font-medium">SQL Dialect:</span>
            <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 font-mono">
              {(['postgresql', 'mysql', 'sqlite', 'mssql'] as SQLDialect[]).map(
                (d) => (
                  <button
                    key={d}
                    onClick={() => setDialect(d)}
                    className={`px-2.5 py-1 rounded capitalize transition-all ${
                      dialect === d
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {d}
                  </button>
                )
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition-all"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy SQL</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadSQL}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-lg transition-all"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download .SQL</span>
            </button>

            <button
              onClick={handleDownloadCSVsZip}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-lg transition-all"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Download CSVs (.zip)</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-300 leading-relaxed select-all">
          <pre>{sqlCode}</pre>
        </div>
      </div>
    </div>
  );
};
