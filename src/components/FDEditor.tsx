import React, { useState } from 'react';
import { ArrowRight, Plus, CheckCircle, AlertTriangle, Trash2, ShieldCheck } from 'lucide-react';
import type { FunctionalDependency, TableRow } from '../engine/types';
import { checkFDConfidence } from '../engine/fdFinder';

interface FDEditorProps {
  attributes: string[];
  fds: FunctionalDependency[];
  rows: TableRow[];
  onToggleFD: (id: string) => void;
  onAddFD: (fd: FunctionalDependency) => void;
  onDeleteFD: (id: string) => void;
}

export const FDEditor: React.FC<FDEditorProps> = ({
  attributes,
  fds,
  rows,
  onToggleFD,
  onAddFD,
  onDeleteFD,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedLhs, setSelectedLhs] = useState<string[]>([]);
  const [selectedRhs, setSelectedRhs] = useState<string[]>([]);

  const handleLhsToggle = (attr: string) => {
    setSelectedLhs((prev) =>
      prev.includes(attr) ? prev.filter((a) => a !== attr) : [...prev, attr]
    );
  };

  const handleRhsToggle = (attr: string) => {
    setSelectedRhs((prev) =>
      prev.includes(attr) ? prev.filter((a) => a !== attr) : [...prev, attr]
    );
  };

  const handleSaveCustomFD = () => {
    if (selectedLhs.length === 0 || selectedRhs.length === 0) return;

    const { confidence, violations } = checkFDConfidence(
      selectedLhs,
      selectedRhs[0],
      rows
    );

    const newFD: FunctionalDependency = {
      id: `custom_${Date.now()}`,
      lhs: selectedLhs,
      rhs: selectedRhs,
      confidence,
      violationsCount: violations,
      isUserDefined: true,
      isActive: true,
    };

    onAddFD(newFD);
    setSelectedLhs([]);
    setSelectedRhs([]);
    setIsAddModalOpen(false);
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-5 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            <span>Functional Dependencies (FDs: X → Y)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Auto-discovered relationships from sample tuples. You can enable/disable FDs or specify custom domain rules.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 rounded-lg text-xs font-semibold transition-all hover:border-cyan-500/50"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Custom FD</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {fds.map((fd) => {
          const is100Percent = fd.confidence === 1.0;
          return (
            <div
              key={fd.id}
              className={`p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                fd.isActive !== false
                  ? 'bg-slate-900/80 border-slate-700/80 hover:border-slate-600'
                  : 'bg-slate-950/40 border-slate-900 opacity-60'
              }`}
            >
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={fd.isActive !== false}
                  onChange={() => onToggleFD(fd.id)}
                  className="h-4 w-4 rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-cyan-500/50 cursor-pointer"
                />

                <div>
                  <div className="flex items-center space-x-2 font-mono text-sm font-bold text-slate-200">
                    <span className="text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60">
                      &#123; {fd.lhs.join(', ')} &#125;
                    </span>
                    <ArrowRight className="h-4 w-4 text-slate-400 shrink-0" />
                    <span className="text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                      &#123; {fd.rhs.join(', ')} &#125;
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 mt-1.5 text-[11px]">
                    <span
                      className={`flex items-center space-x-1 px-1.5 py-0.5 rounded ${
                        is100Percent
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                          : 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
                      }`}
                    >
                      {is100Percent ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <AlertTriangle className="h-3 w-3" />
                      )}
                      <span>
                        {(fd.confidence * 100).toFixed(0)}% Holds in Data
                      </span>
                    </span>

                    {fd.isUserDefined && (
                      <span className="px-1.5 py-0.5 rounded bg-purple-950 text-purple-400 border border-purple-800 text-[10px]">
                        User Specified
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {fd.isUserDefined && (
                <button
                  onClick={() => onDeleteFD(fd.id)}
                  className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 border border-slate-700 shadow-2xl space-y-5">
            <h4 className="text-base font-bold text-slate-100">Add Custom Functional Dependency (X → Y)</h4>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Select Determinant Attributes (LHS: X)
                </label>
                <div className="flex flex-wrap gap-2">
                  {attributes.map((attr) => (
                    <button
                      key={attr}
                      onClick={() => handleLhsToggle(attr)}
                      className={`px-2.5 py-1 rounded-lg border text-xs font-mono transition-all ${
                        selectedLhs.includes(attr)
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold'
                          : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      {attr}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Select Dependent Attributes (RHS: Y)
                </label>
                <div className="flex flex-wrap gap-2">
                  {attributes.map((attr) => (
                    <button
                      key={attr}
                      onClick={() => handleRhsToggle(attr)}
                      disabled={selectedLhs.includes(attr)}
                      className={`px-2.5 py-1 rounded-lg border text-xs font-mono transition-all ${
                        selectedRhs.includes(attr)
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                          : selectedLhs.includes(attr)
                          ? 'bg-slate-950 text-slate-600 border-slate-900 cursor-not-allowed'
                          : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      {attr}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCustomFD}
                disabled={selectedLhs.length === 0 || selectedRhs.length === 0}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl transition-all disabled:opacity-50"
              >
                Add Functional Dependency
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
