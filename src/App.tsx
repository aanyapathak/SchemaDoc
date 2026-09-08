import React, { useState, useMemo } from 'react';
import JSZip from 'jszip';
import { 
  Upload, 
  Download, 
  Check, 
  Copy, 
  FileText, 
  ChevronDown, 
  ChevronRight, 
  GraduationCap, 
  AlertCircle, 
  Key, 
  Layers, 
  Database,
  ShieldCheck
} from 'lucide-react';
import { BENCHMARK_PRESETS } from './engine/presets';
import { discoverFunctionalDependencies } from './engine/fdFinder';
import { analyzeNormalForm } from './engine/normalFormChecker';
import { decomposeTo1NF, decomposeTo2NF, decomposeTo3NF } from './engine/decomposer';
import { generateSQLScript } from './engine/sqlGenerator';
import type { BenchmarkPreset, Column, FunctionalDependency, TableRow } from './engine/types';

export function App() {
  const defaultPreset = BENCHMARK_PRESETS[0];

  const [attributes, setAttributes] = useState<string[]>(defaultPreset.columns.map((c) => c.name));
  const [columns, setColumns] = useState<Column[]>(defaultPreset.columns);
  const [rows, setRows] = useState<TableRow[]>(defaultPreset.sampleData);
  const [fds, setFds] = useState<FunctionalDependency[]>(() =>
    defaultPreset.fds.map((fd, idx) => ({ ...fd, id: `fd_${idx}` }))
  );

  const [pastedText, setPastedText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState(defaultPreset.id);
  const [activeTab, setActiveTab] = useState<'tool' | 'explanation'>('tool');

  const [isInputTableExpanded, setIsInputTableExpanded] = useState(true);
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({ 'tbl_0': true });

  const [targetNormalForm, setTargetNormalForm] = useState<'1NF' | '2NF' | '3NF'>('3NF');
  const [isNormalized, setIsNormalized] = useState(false);

  const toggleTableDropdown = (idxStr: string) => {
    setExpandedTables((prev) => ({
      ...prev,
      [idxStr]: !prev[idxStr],
    }));
  };

  const analysis = useMemo(() => analyzeNormalForm(attributes, columns, fds, rows), [attributes, columns, fds, rows]);
  
  const decomposedTables = useMemo(() => {
    if (!isNormalized) return [];
    if (targetNormalForm === '1NF') return decomposeTo1NF(attributes, fds, rows);
    if (targetNormalForm === '2NF') return decomposeTo2NF(attributes, fds, rows);
    return decomposeTo3NF(attributes, fds, rows);
  }, [isNormalized, targetNormalForm, attributes, fds, rows]);

  const handleLoadDataset = (newAttrs: string[], newCols: Column[], newRows: TableRow[], preset?: BenchmarkPreset) => {
    setErrorMsg(null);
    setAttributes(newAttrs);
    setColumns(newCols);
    setRows(newRows);
    setIsInputTableExpanded(true);
    setExpandedTables({ 'tbl_0': true });
    setIsNormalized(false);
    if (preset) {
      setSelectedPresetId(preset.id);
      setFds(preset.fds.map((fd, idx) => ({ ...fd, id: `fd_${idx}` })));
    } else {
      setSelectedPresetId('');
      setFds(discoverFunctionalDependencies(newAttrs, newRows));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      parseCSV(text);
      // Reset input value so re-uploading the same file triggers onChange
      e.target.value = '';
    };
    reader.onerror = () => {
      setErrorMsg('Failed to read uploaded file.');
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  const parseCSV = (text: string) => {
    setErrorMsg(null);
    try {
      // Split lines respecting both Windows CRLF and Unix LF
      const rawLines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
      const lines = rawLines.map((l) => l.trim()).filter(Boolean);

      if (lines.length < 2) {
        setErrorMsg('CSV must contain a header row and at least one data row.');
        return;
      }

      // Helper to parse a CSV row handling quotes and commas inside quotes
      const splitCSVLine = (line: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"' || char === "'") {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim().replace(/^["']|["']$/g, ''));
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim().replace(/^["']|["']$/g, ''));
        return result;
      };

      const rawHeaders = splitCSVLine(lines[0]);
      // Filter out empty headers and sanitize
      const headers = rawHeaders.map((h, i) => h || `Column_${i + 1}`);
      const parsedRows: TableRow[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = splitCSVLine(lines[i]);
        const rowObj: TableRow = {};
        headers.forEach((h, idx) => {
          const val = values[idx] ?? '';
          rowObj[h] = isNaN(Number(val)) || val === '' ? val : Number(val);
        });
        parsedRows.push(rowObj);
      }

      const cols: Column[] = headers.map((h) => ({
        name: h,
        type: typeof parsedRows[0]?.[h] === 'number' ? 'INT' : 'VARCHAR',
      }));

      handleLoadDataset(headers, cols, parsedRows);
    } catch (err: any) {
      setErrorMsg(`Invalid CSV format: ${err.message}`);
    }
  };

  const handlePasteSubmit = () => {
    if (!pastedText.trim()) return;
    if (pastedText.trim().startsWith('[') || pastedText.trim().startsWith('{')) {
      try {
        const json = JSON.parse(pastedText);
        const rowsArray = Array.isArray(json) ? json : [json];
        const headers = Array.from(new Set(rowsArray.flatMap((r) => Object.keys(r))));
        const cols: Column[] = headers.map((h) => ({
          name: h,
          type: typeof rowsArray[0]?.[h] === 'number' ? 'INT' : 'VARCHAR',
        }));
        handleLoadDataset(headers, cols, rowsArray);
        setPastedText('');
      } catch (err: any) {
        setErrorMsg(`Invalid JSON format: ${err.message}`);
      }
    } else {
      parseCSV(pastedText);
      setPastedText('');
    }
  };

  const handleDownloadZip = async () => {
    const zip = new JSZip();
    decomposedTables.forEach((t) => {
      const header = t.attributes.join(',');
      const rowLines = t.data.map((r) =>
        t.attributes
          .map((a) => {
            const v = r[a];
            if (v === null || v === undefined) return '';
            const s = String(v);
            return s.includes(',') ? `"${s}"` : s;
          })
          .join(',')
      );
      zip.file(`${t.name}.csv`, [header, ...rowLines].join('\n'));
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'normalized_tables.zip';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopySql = () => {
    const sql = generateSQLScript(decomposedTables, columns, rows, 'postgresql');
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 p-4 sm:p-8 max-w-6xl mx-auto space-y-8 font-sans">
      {/* Header */}
      <header className="border-b border-slate-800/80 pb-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-sky-400 shadow-sm">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight font-mono text-slate-100">
                SCHEMA DOCTOR
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Automated database normalization tool that diagnoses messy tables and splits them into clean 3NF relations.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs font-mono">
            <span className="text-slate-400">Sample Table:</span>
            <select
              value={selectedPresetId}
              onChange={(e) => {
                const preset = BENCHMARK_PRESETS.find((p) => p.id === e.target.value);
                if (preset) handleLoadDataset(preset.columns.map((c) => c.name), preset.columns, preset.sampleData, preset);
              }}
              className="bg-slate-900 border border-slate-700/80 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-sky-500 cursor-pointer font-mono transition-colors"
            >
              {BENCHMARK_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex space-x-2 pt-1 text-xs font-mono">
          <button
            onClick={() => setActiveTab('tool')}
            className={`px-4 py-2 rounded-lg font-semibold border transition-all cursor-pointer flex items-center space-x-2 ${
              activeTab === 'tool'
                ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-md shadow-sky-950/40'
                : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Normalization Tool</span>
          </button>

          <button
            onClick={() => setActiveTab('explanation')}
            className={`px-4 py-2 rounded-lg font-semibold border transition-all cursor-pointer flex items-center space-x-2 ${
              activeTab === 'explanation'
                ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-md shadow-sky-950/40'
                : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <GraduationCap className="h-3.5 w-3.5" />
            <span>Working Explanation</span>
          </button>
        </div>
      </header>

      {/* ============================================================ */}
      {/* TAB 1: MAIN TOOL VIEW */}
      {/* ============================================================ */}
      {activeTab === 'tool' && (
        <div className="space-y-8">
          {/* SECTION 1: UPLOAD MESSY TABLE FILE */}
          <section className="space-y-5">
            <div className="border-b border-slate-800/80 pb-2 flex items-center justify-between">
              <h2 className="text-sm font-bold font-mono tracking-wide flex items-center gap-2 text-slate-200">
                <span className="bg-sky-950 text-sky-400 border border-sky-800/60 text-[11px] font-bold px-2 py-0.5 rounded">
                  SECTION 1
                </span>
                <span>Upload Messy Table / Copy Data</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="subtle-card p-6 rounded-xl text-center space-y-3 flex flex-col justify-center items-center hover:border-sky-500/40 transition-colors">
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload-input"
                />
                <label htmlFor="file-upload-input" className="cursor-pointer space-y-2 block w-full">
                  <div className="h-10 w-10 rounded-full bg-slate-800/60 border border-slate-700/60 text-sky-400 flex items-center justify-center mx-auto">
                    <Upload className="h-5 w-5" />
                  </div>
                  <div className="text-sm font-semibold text-slate-200">Click to Upload CSV File</div>
                  <div className="text-xs text-slate-400">Upload unnormalized table datasets (.csv)</div>
                </label>
              </div>

              <div className="subtle-card p-4 rounded-xl space-y-3">
                <textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Or paste CSV rows / JSON data here..."
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500/60"
                />
                <button
                  onClick={handlePasteSubmit}
                  disabled={!pastedText.trim()}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-sky-300 font-semibold text-xs rounded-lg border border-slate-700/80 transition-all disabled:opacity-40 cursor-pointer"
                >
                  Parse Pasted Table
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-950/60 border border-rose-800 text-xs font-mono text-rose-300 rounded-lg">
                Error: {errorMsg}
              </div>
            )}

            {/* Normalization Target Selector */}
            {attributes.length > 0 && (
              <div className="subtle-card p-4 rounded-xl space-y-4 border border-slate-800/80 bg-slate-900/60 mt-4">
                <h3 className="text-xs font-bold font-mono text-sky-400">Select Normalization Technique</h3>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-6 text-xs font-mono">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                        <input type="radio" value="1NF" checked={targetNormalForm === '1NF'} onChange={(e) => setTargetNormalForm(e.target.value as any)} className="accent-sky-500 w-4 h-4" />
                        <span>1NF (Atomic Values)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                        <input type="radio" value="2NF" checked={targetNormalForm === '2NF'} onChange={(e) => setTargetNormalForm(e.target.value as any)} className="accent-sky-500 w-4 h-4" />
                        <span>2NF (Remove Partial Dependencies)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                        <input type="radio" value="3NF" checked={targetNormalForm === '3NF'} onChange={(e) => setTargetNormalForm(e.target.value as any)} className="accent-sky-500 w-4 h-4" />
                        <span>3NF (Remove Transitive Dependencies)</span>
                    </label>
                  </div>
                  <button
                    onClick={() => setIsNormalized(true)}
                    className="px-5 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold font-mono text-xs rounded-lg transition-all cursor-pointer shadow-md shadow-sky-950/40"
                  >
                    Normalize Data
                  </button>
                </div>
              </div>
            )}

            {/* Uploaded Table via Collapsible Dropdown */}
            {attributes.length > 0 && (
              <div className="subtle-card rounded-xl overflow-hidden font-mono">
                <button
                  onClick={() => setIsInputTableExpanded(!isInputTableExpanded)}
                  className="w-full p-3.5 bg-slate-900/90 hover:bg-slate-850 flex items-center justify-between text-xs font-semibold text-slate-200 transition-colors cursor-pointer border-b border-slate-800/80"
                >
                  <div className="flex items-center space-x-2">
                    {isInputTableExpanded ? (
                      <ChevronDown className="h-4 w-4 text-sky-400 shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                    )}
                    <span className="text-slate-100">Uploaded Input Table ({attributes.length} columns, {rows.length} rows)</span>
                  </div>

                  <div className="flex items-center space-x-2 text-xs">
                    <span className="text-slate-400">Primary Key:</span>
                    <span className="text-emerald-400 font-bold">&#123;{analysis.candidateKeys[0]?.attributes.join(', ')}&#125;</span>
                  </div>
                </button>

                {isInputTableExpanded && (
                  <div className="p-4 bg-slate-950/90 space-y-2 border-t border-slate-800/60">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>Showing sample preview ({Math.min(100, rows.length)} of {rows.length} rows)</span>
                      {rows.length > 100 && <span>Scroll horizontally / vertically for full view</span>}
                    </div>

                    <div className="overflow-x-auto border border-slate-800/80 rounded-lg max-h-64">
                      <table className="w-full text-left text-xs font-mono border-collapse">
                        <thead className="bg-slate-900 text-slate-300 border-b border-slate-800 sticky top-0 z-10">
                          <tr>
                            <th className="p-2 border-r border-slate-800 w-8 text-center bg-slate-900 text-slate-500">#</th>
                            {attributes.map((attr) => {
                              const isPk = analysis.candidateKeys[0]?.attributes.includes(attr);
                              return (
                                <th key={attr} className="p-2 border-r border-slate-800 whitespace-nowrap bg-slate-900">
                                  <span className={isPk ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                                    {attr} {isPk && '(PK)'}
                                  </span>
                                </th>
                              );
                            })}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-slate-300">
                          {rows.slice(0, 100).map((r, i) => (
                            <tr key={i} className="hover:bg-slate-900/40 transition-colors">
                              <td className="p-2 border-r border-slate-800 text-center text-slate-500">{i + 1}</td>
                              {attributes.map((attr) => {
                                const isPk = analysis.candidateKeys[0]?.attributes.includes(attr);
                                return (
                                  <td
                                    key={attr}
                                    className={`p-2 border-r border-slate-800 whitespace-nowrap ${
                                      isPk ? 'text-emerald-300/90 font-medium' : 'text-slate-300'
                                    }`}
                                  >
                                    {String(r[attr] ?? '')}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* SECTION 2: DOWNLOAD NORMALIZED DATA TABLE VIA DROPDOWNS */}
          <section className="space-y-5 pt-4 border-t border-slate-800/80">
            <div className="border-b border-slate-800/80 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-sm font-bold font-mono tracking-wide flex items-center gap-2 text-slate-200">
                <span className="bg-emerald-950 text-emerald-400 border border-emerald-800/60 text-[11px] font-bold px-2 py-0.5 rounded">
                  SECTION 2
                </span>
                <span>Download Normalized Data Tables</span>
              </h2>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCopySql}
                  disabled={!isNormalized || decomposedTables.length === 0}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700/80 text-slate-200 font-mono text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedSql ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedSql ? 'Copied SQL' : 'Copy SQL Script'}</span>
                </button>

                <button
                  onClick={handleDownloadZip}
                  disabled={!isNormalized || decomposedTables.length === 0}
                  className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold font-mono text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-950/40"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Corrected CSVs (.zip)</span>
                </button>
              </div>
            </div>

            {/* Normalized Tables via Collapsible Dropdowns or Blank State */}
            {!isNormalized ? (
              <div className="subtle-card p-10 rounded-xl text-center space-y-3 border border-slate-800/80 border-dashed bg-slate-900/30">
                <Database className="h-8 w-8 text-slate-600 mx-auto" />
                <div className="text-sm font-semibold text-slate-300 font-mono">No Normalization Applied Yet</div>
                <div className="text-xs text-slate-500 font-mono max-w-md mx-auto">
                  Select a normal form technique (1NF, 2NF, or 3NF) above and click <span className="text-sky-400 font-semibold">"Normalize Data"</span> to process the table and generate normalized relations.
                </div>
              </div>
            ) : (
              <div className="space-y-3 font-mono">
                {decomposedTables.map((table, tIdx) => {
                const isExpanded = !!expandedTables[`tbl_${tIdx}`];
                return (
                  <div key={tIdx} className="subtle-card rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggleTableDropdown(`tbl_${tIdx}`)}
                      className="w-full p-3.5 bg-slate-900/90 hover:bg-slate-850 flex items-center justify-between text-xs font-semibold text-slate-200 transition-colors cursor-pointer border-b border-slate-800/80"
                    >
                      <div className="flex items-center space-x-2">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-sky-400 shrink-0" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                        )}
                        <span className="font-bold text-sky-300">Table {tIdx + 1}: {table.name}</span>
                      </div>

                      <div className="flex items-center space-x-3 text-slate-400 font-normal">
                        <span>Primary Key: <strong className="text-emerald-400">&#123;{table.primaryKey.join(', ')}&#125;</strong></span>
                        <span className="text-[10px] bg-slate-950 px-2 py-0.5 border border-slate-800 rounded text-slate-300">
                          {table.data.length} Rows
                        </span>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="p-4 bg-slate-950/90 space-y-3 border-t border-slate-800/60">
                        <p className="text-xs text-slate-400 leading-relaxed">{table.reason}</p>

                        <div className="overflow-x-auto border border-slate-800/80 rounded-lg max-h-64">
                          <table className="w-full text-left text-xs font-mono border-collapse">
                            <thead className="bg-slate-900 text-slate-300 border-b border-slate-800 sticky top-0 z-10">
                              <tr>
                                {table.attributes.map((attr) => {
                                  const isPk = table.primaryKey.includes(attr);
                                  return (
                                    <th key={attr} className="p-2 border-r border-slate-800 whitespace-nowrap bg-slate-900">
                                      <span className={isPk ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                                        {attr} {isPk && '(PK)'}
                                      </span>
                                    </th>
                                  );
                                })}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 text-slate-300">
                              {table.data.slice(0, 100).map((r, rIdx) => (
                                <tr key={rIdx} className="hover:bg-slate-900/40 transition-colors">
                                  {table.attributes.map((attr) => {
                                    const isPk = table.primaryKey.includes(attr);
                                    return (
                                      <td
                                        key={attr}
                                        className={`p-2 border-r border-slate-800 whitespace-nowrap ${
                                          isPk ? 'text-emerald-300/90 font-medium' : 'text-slate-300'
                                        }`}
                                      >
                                        {String(r[attr] ?? '')}
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: WORKING EXPLANATION */}
      {/* ============================================================ */}
      {activeTab === 'explanation' && (
        <div className="subtle-card p-6 rounded-xl space-y-6 font-mono">
          <div className="border-b border-slate-800/80 pb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-sky-400" />
              <span>Working Explanation & Academic Normalization Proofs</span>
            </h2>
            <span className="text-xs bg-slate-900 text-sky-400 px-3 py-1 border border-slate-800 rounded font-semibold">
              Current Normal Form: {analysis.maxNormalForm}
            </span>
          </div>

          <div className="bg-slate-950 p-4 border border-slate-800/80 rounded-lg space-y-2 text-xs">
            <h3 className="font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
              <Key className="h-4 w-4" />
              <span>1. Primary Candidate Key & Attribute Closures (X+)</span>
            </h3>
            <p className="text-slate-400 leading-relaxed">
              To determine the primary key of the uploaded table, Schema Doctor computes the attribute closure for all attribute subsets.
            </p>
            <div className="bg-slate-900/90 p-3 rounded border border-slate-800 text-slate-300 space-y-1">
              <div>Derived Primary Candidate Key: <strong className="text-emerald-400">&#123; {analysis.candidateKeys[0]?.attributes.join(', ')} &#125;</strong></div>
              <div>Prime Attributes (belonging to key): &#123; {analysis.primeAttributes.join(', ')} &#125;</div>
              <div>Non-Prime Attributes: &#123; {analysis.nonPrimeAttributes.join(', ')} &#125;</div>
            </div>
          </div>

          <div className="bg-slate-950 p-4 border border-slate-800/80 rounded-lg space-y-3 text-xs">
            <h3 className="font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4" />
              <span>2. Problems & Redundancies Identified (Compact Summary)</span>
            </h3>
            
            {analysis.violations.length > 0 ? (
              <div className="space-y-2">
                {analysis.violations.map((v, idx) => (
                  <div key={idx} className="p-2.5 border border-slate-800 bg-slate-900/90 rounded text-slate-200 text-xs flex items-center gap-2.5 truncate">
                    <span className="font-bold text-rose-400 shrink-0 px-1.5 py-0.5 bg-rose-950/80 border border-rose-900 rounded text-[10px]">
                      [{v.level}]
                    </span>
                    <span className="truncate text-slate-300">{v.reason}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-slate-400 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>No normalization violations detected. Table is already in optimal 3NF form.</span>
              </div>
            )}
          </div>

          <div className="bg-slate-950 p-4 border border-slate-800/80 rounded-lg space-y-3 text-xs">
            <h3 className="font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="h-4 w-4" />
              <span>3. How Normalization Decomposed the Table (Step-by-Step)</span>
            </h3>
            <p className="text-slate-400 leading-relaxed">
              Schema Doctor applied Bernstein's 3NF Synthesis algorithm (Minimal Cover computation $\rightarrow$ Sub-relation formation $\rightarrow$ Foreign Key mapping).
            </p>

            <div className="space-y-2">
              {decomposedTables.map((t, idx) => (
                <div key={idx} className="p-3 border border-slate-800 bg-slate-900/90 rounded space-y-1">
                  <div className="flex items-center justify-between text-slate-100 font-bold">
                    <span className="text-sky-300">Table {idx + 1}: {t.name}</span>
                    <span className="text-emerald-400">PK: &#123;{t.primaryKey.join(', ')}&#125;</span>
                  </div>
                  <div className="text-slate-400 text-[11px]">Attributes: &#123;{t.attributes.join(', ')}&#125;</div>
                  <div className="text-slate-400 text-[11px] italic">Reason: {t.reason}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/60 pt-6 text-center text-xs text-slate-500 font-mono">
        SCHEMA DOCTOR — DBMS Normalization & Table Splitter Tool
      </footer>
    </div>
  );
}
