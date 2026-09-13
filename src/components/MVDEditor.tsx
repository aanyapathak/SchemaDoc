import React, { useState } from 'react';
import type { MultivaluedDependency } from '../engine/types';
import { Plus, Trash2 } from 'lucide-react';

interface MVDEditorProps {
  attributes: string[];
  mvds: MultivaluedDependency[];
  setMvds: (mvds: MultivaluedDependency[]) => void;
}

export const MVDEditor: React.FC<MVDEditorProps> = ({ attributes: _attributes, mvds, setMvds }) => {
  const [lhs, setLhs] = useState<string>('');
  const [rhs, setRhs] = useState<string>('');

  const handleAdd = () => {
    if (!lhs || !rhs) return;
    const lhsAttrs = lhs.split(',').map(s => s.trim()).filter(Boolean);
    const rhsAttrs = rhs.split(',').map(s => s.trim()).filter(Boolean);
    
    if (lhsAttrs.length === 0 || rhsAttrs.length === 0) return;

    const newMvd: MultivaluedDependency = {
      id: `mvd_${Date.now()}`,
      lhs: lhsAttrs,
      rhs: rhsAttrs,
      isActive: true,
    };
    
    setMvds([...mvds, newMvd]);
    setLhs('');
    setRhs('');
  };

  const handleRemove = (id: string) => {
    setMvds(mvds.filter(m => m.id !== id));
  };

  return (
    <div className="subtle-card p-4 rounded-xl space-y-4 border border-slate-800/80 bg-slate-900/60 mt-4">
      <h3 className="text-xs font-bold font-mono text-fuchsia-400">Define Multivalued Dependencies (MVDs)</h3>
      <p className="text-[11px] text-slate-400 font-mono">
        MVDs (X ↠ Y) indicate that a single attribute X determines multiple independent values of Y.
      </p>

      <div className="space-y-2">
        {mvds.length === 0 ? (
          <div className="text-xs text-slate-500 font-mono italic p-2 bg-slate-950/50 rounded border border-slate-800/50">
            No MVDs defined. 4NF will default to BCNF if no MVDs exist.
          </div>
        ) : (
          mvds.map(mvd => (
            <div key={mvd.id} className="flex items-center justify-between p-2 bg-slate-950 rounded border border-slate-800 text-xs font-mono">
              <span className="text-slate-300">
                <span className="text-sky-300">&#123; {mvd.lhs.join(', ')} &#125;</span>
                <span className="text-slate-500 mx-2">↠</span>
                <span className="text-emerald-300">&#123; {mvd.rhs.join(', ')} &#125;</span>
              </span>
              <button onClick={() => handleRemove(mvd.id)} className="text-rose-400 hover:text-rose-300 p-1">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="flex items-end gap-2 pt-2">
        <div className="flex-1 space-y-1">
          <label className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Determinant (X)</label>
          <input 
            type="text" 
            placeholder="e.g. Course" 
            value={lhs} 
            onChange={e => setLhs(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs font-mono text-slate-200 outline-none focus:border-fuchsia-500/50"
          />
        </div>
        <div className="pb-2 text-slate-500 font-mono">↠</div>
        <div className="flex-1 space-y-1">
          <label className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Dependent (Y)</label>
          <input 
            type="text" 
            placeholder="e.g. Instructor" 
            value={rhs} 
            onChange={e => setRhs(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs font-mono text-slate-200 outline-none focus:border-fuchsia-500/50"
          />
        </div>
        <button 
          onClick={handleAdd}
          disabled={!lhs || !rhs}
          className="p-2 bg-fuchsia-900/30 text-fuchsia-400 border border-fuchsia-900/50 hover:bg-fuchsia-900/50 rounded disabled:opacity-50 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <p className="text-[10px] text-slate-500 font-mono">
        * Separate multiple attributes with commas.
      </p>
    </div>
  );
};
