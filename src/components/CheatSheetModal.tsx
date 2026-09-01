import React from 'react';
import { BookOpen, X, ShieldCheck, Key } from 'lucide-react';

interface CheatSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CheatSheetModal: React.FC<CheatSheetModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="glass-panel w-full max-w-4xl rounded-2xl p-6 border border-slate-800 shadow-2xl space-y-5 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                DBMS Unit 2 Normalization & FD Solver Cheat Sheet
              </h3>
              <p className="text-xs text-slate-400">
                Comprehensive academic reference for functional dependency closures, candidate key rules, and 1NF to BCNF definitions.
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

        <div className="flex-1 overflow-y-auto space-y-6 pr-2 text-xs text-slate-300">
          <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2">
            <h4 className="font-bold text-cyan-300 text-sm flex items-center gap-1.5">
              <Key className="h-4 w-4" />
              <span>1. Attribute Closure (X+) Algorithm</span>
            </h4>
            <p>
              Given attribute set <code className="text-cyan-300 font-bold">X</code> and functional dependencies <code className="text-emerald-300 font-bold">F</code>:
            </p>
            <ol className="list-decimal list-inside space-y-1 font-mono text-[11px] bg-slate-950 p-3 rounded-lg border border-slate-800/80">
              <li>Initialize <code className="text-cyan-300">X+ = X</code></li>
              <li>For each FD <code className="text-emerald-300">A → B</code> in <code className="text-emerald-300">F</code>:</li>
              <li className="pl-4">If <code className="text-cyan-300">A ⊆ X+</code>, then add <code className="text-cyan-300">B</code> to <code className="text-cyan-300">X+</code></li>
              <li>Repeat until no new attributes can be added to <code className="text-cyan-300">X+</code></li>
            </ol>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-slate-200 text-sm">
              2. Normal Forms Comparison Table (Unit 2 Rules)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-sans">
              <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-cyan-400">1NF (First Normal Form)</span>
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">Atomicity</span>
                </div>
                <p className="text-slate-300">
                  Every attribute value must be indivisible and atomic. No multi-valued attributes or repeating groups in relation cells.
                </p>
              </div>

              <div className="bg-slate-900/90 p-4 rounded-xl border border-amber-900/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-amber-400">2NF (Second Normal Form)</span>
                  <span className="text-[10px] bg-amber-950 text-amber-400 px-2 py-0.5 rounded">No Partial Dependency</span>
                </div>
                <p className="text-slate-300">
                  Must be in 1NF. Every non-prime attribute must be fully dependent on the primary candidate key. No FD <code className="font-mono text-amber-300">X → A</code> where <code className="font-mono text-amber-300">X ⊂ K</code> (proper key subset).
                </p>
              </div>

              <div className="bg-slate-900/90 p-4 rounded-xl border border-emerald-900/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-emerald-400">3NF (Third Normal Form)</span>
                  <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded">No Transitive Dependency</span>
                </div>
                <p className="text-slate-300">
                  Must be in 2NF. For every non-trivial FD <code className="font-mono text-emerald-300">X → Y</code>, either <code className="font-mono text-emerald-300">X</code> is a Superkey OR <code className="font-mono text-emerald-300">Y</code> is a Prime Attribute.
                </p>
              </div>

              <div className="bg-slate-900/90 p-4 rounded-xl border border-cyan-900/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-cyan-400">BCNF (Boyce-Codd Normal Form)</span>
                  <span className="text-[10px] bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded">Strict Superkeys</span>
                </div>
                <p className="text-slate-300">
                  Must be in 3NF. For EVERY non-trivial FD <code className="font-mono text-cyan-300">X → Y</code>, the determinant <code className="font-mono text-cyan-300">X</code> MUST be a Superkey (<code className="font-mono text-cyan-300">X+ = R</code>).
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2">
            <h4 className="font-bold text-emerald-300 text-sm flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4" />
              <span>3. Lossless Join Guarantee</span>
            </h4>
            <p className="text-slate-300">
              A relation decomposition of <code className="font-mono text-cyan-300">R</code> into <code className="font-mono text-cyan-300">R1</code> and <code className="font-mono text-cyan-300">R2</code> is <strong>lossless</strong> if and only if:
            </p>
            <div className="font-mono text-[11px] bg-slate-950 p-3 rounded-lg border border-slate-800/80 text-emerald-300">
              (R1 ∩ R2) → R1  OR  (R1 ∩ R2) → R2
            </div>
            <p className="text-[11px] text-slate-400">
              This guarantees that joining <code className="font-mono text-cyan-300">R1 ⋈ R2</code> recreates the original relation without spurious tuples.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
