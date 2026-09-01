import React, { useState } from 'react';
import { Upload, Database, ArrowRight } from 'lucide-react';
import { BENCHMARK_PRESETS } from '../engine/presets';
import type { BenchmarkPreset, Column, TableRow } from '../engine/types';

interface DatasetUploaderProps {
  onLoadDataset: (
    attributes: string[],
    columns: Column[],
    rows: TableRow[],
    preset?: BenchmarkPreset
  ) => void;
}

export const DatasetUploader: React.FC<DatasetUploaderProps> = ({
  onLoadDataset,
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'csv' | 'paste'>('presets');
  const [pastedText, setPastedText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      parseAndLoadCSV(text);
    };
    reader.readAsText(file);
  };

  const parseAndLoadCSV = (csvText: string) => {
    setErrorMsg(null);
    try {
      const lines = csvText
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);

      if (lines.length < 2) {
        setErrorMsg('CSV must contain a header row and at least one data row.');
        return;
      }

      const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
      const rows: TableRow[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map((v) => v.trim().replace(/^["']|["']$/g, ''));
        const rowObj: TableRow = {};
        headers.forEach((h, idx) => {
          const val = values[idx] ?? '';
          rowObj[h] = isNaN(Number(val)) || val === '' ? val : Number(val);
        });
        rows.push(rowObj);
      }

      const columns: Column[] = headers.map((h) => ({
        name: h,
        type: typeof rows[0]?.[h] === 'number' ? 'INT' : 'VARCHAR',
      }));

      onLoadDataset(headers, columns, rows);
    } catch (err: any) {
      setErrorMsg(`Failed to parse CSV: ${err.message}`);
    }
  };

  const handlePasteSubmit = () => {
    setErrorMsg(null);
    if (!pastedText.trim()) {
      setErrorMsg('Please paste valid CSV or JSON text.');
      return;
    }

    try {
      if (pastedText.trim().startsWith('[') || pastedText.trim().startsWith('{')) {
        const json = JSON.parse(pastedText);
        const rowsArray = Array.isArray(json) ? json : [json];
        if (rowsArray.length === 0) throw new Error('Empty JSON array.');

        const headers = Array.from(new Set(rowsArray.flatMap((r) => Object.keys(r))));
        const columns: Column[] = headers.map((h) => ({
          name: h,
          type: typeof rowsArray[0]?.[h] === 'number' ? 'INT' : 'VARCHAR',
        }));

        onLoadDataset(headers, columns, rowsArray);
      } else {
        parseAndLoadCSV(pastedText);
      }
    } catch (err: any) {
      setErrorMsg(`Invalid data format: ${err.message}`);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-2xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Database className="h-5 w-5 text-cyan-400" />
            <span>Upload or Select a Messy Database Table</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Schema Doctor will analyze columns, discover Functional Dependencies, check 2NF/3NF/BCNF, and normalize it automatically.
          </p>
        </div>

        <div className="flex bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('presets')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'presets'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Presets
          </button>
          <button
            onClick={() => setActiveTab('csv')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'csv'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Upload File
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'paste'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Paste Data
          </button>
        </div>
      </div>

      {activeTab === 'presets' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {BENCHMARK_PRESETS.map((preset) => (
            <div
              key={preset.id}
              onClick={() => onLoadDataset(preset.columns.map((c) => c.name), preset.columns, preset.sampleData, preset)}
              className="group glass-card p-4 rounded-xl border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900/80 transition-all cursor-pointer flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                    {preset.category}
                  </span>
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800">
                    {preset.expectedNormalForm} Violations
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">
                  {preset.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  {preset.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs text-slate-400">
                <span>{preset.columns.length} Columns • {preset.sampleData.length} Tuples</span>
                <span className="text-cyan-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform font-medium">
                  Diagnose & Fix <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'csv' && (
        <div className="border-2 border-dashed border-slate-700 hover:border-cyan-500/60 rounded-xl p-8 text-center transition-colors bg-slate-900/40">
          <input
            type="file"
            accept=".csv,.txt"
            onChange={handleFileUpload}
            className="hidden"
            id="csv-upload-input"
          />
          <label htmlFor="csv-upload-input" className="cursor-pointer space-y-3 block">
            <div className="h-12 w-12 rounded-full bg-cyan-950/60 border border-cyan-800 text-cyan-400 flex items-center justify-center mx-auto">
              <Upload className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">
                Click to upload CSV table
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Supports standard comma-separated files (.csv)
              </p>
            </div>
          </label>
        </div>
      )}

      {activeTab === 'paste' && (
        <div className="space-y-3">
          <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder={`Paste CSV data or JSON array here...\nExample:\nStudent_ID,Student_Name,Course_ID,Grade\n101,Aanya,CS301,A\n101,Aanya,CS302,B+`}
            rows={6}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <button
            onClick={handlePasteSubmit}
            className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-slate-950 font-semibold text-xs rounded-xl shadow-lg transition-all"
          >
            Process & Analyze Table
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-300 text-xs">
          {errorMsg}
        </div>
      )}
    </div>
  );
};
