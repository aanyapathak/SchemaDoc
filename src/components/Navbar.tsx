import React from 'react';
import {
  Stethoscope,
  BookOpen,
  Download,
  RotateCcw,
  Share2,
} from 'lucide-react';
import { BENCHMARK_PRESETS } from '../engine/presets';
import type { BenchmarkPreset } from '../engine/types';

interface NavbarProps {
  currentPresetId: string;
  onSelectPreset: (preset: BenchmarkPreset) => void;
  onReset: () => void;
  onOpenSqlModal: () => void;
  onOpenCheatSheet: () => void;
  onOpenShareModal: () => void;
  hasData: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPresetId,
  onSelectPreset,
  onReset,
  onOpenSqlModal,
  onOpenCheatSheet,
  onOpenShareModal,
  hasData,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={onReset}>
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-400 flex items-center justify-center text-slate-950 shadow-lg shadow-cyan-500/20">
            <Stethoscope className="h-6 w-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
                Schema Doctor
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-cyan-950 text-cyan-400 border border-cyan-800/60 rounded-full tracking-wide uppercase">
                DBMS 2.0
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Automated Database Normalization & FD Analyzer
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative hidden md:block">
            <select
              value={currentPresetId}
              onChange={(e) => {
                const found = BENCHMARK_PRESETS.find((p) => p.id === e.target.value);
                if (found) onSelectPreset(found);
              }}
              className="bg-slate-900 border border-slate-700/80 hover:border-slate-600 text-slate-200 text-xs rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all cursor-pointer"
            >
              <option value="" disabled>
                -- Load Messy Dataset --
              </option>
              {BENCHMARK_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.expectedNormalForm})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onOpenCheatSheet}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/70 text-cyan-300 rounded-lg text-xs font-medium transition-all hover:border-cyan-500/50"
            title="Open DBMS Unit 2 Normalization Rules & Proofs Guide"
          >
            <BookOpen className="h-4 w-4 text-cyan-400" />
            <span className="hidden sm:inline">Unit 2 Solver Guide</span>
          </button>

          {hasData && (
            <>
              <button
                onClick={onOpenShareModal}
                className="flex items-center space-x-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-cyan-800/80 text-cyan-300 rounded-lg text-xs font-semibold transition-all hover:border-cyan-500"
                title="Generate shareable link to normalized schema result"
              >
                <Share2 className="h-4 w-4 text-cyan-400" />
                <span className="hidden sm:inline">Share Result Link</span>
              </button>

              <button
                onClick={onOpenSqlModal}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-slate-950 font-semibold rounded-lg text-xs transition-all shadow-md shadow-cyan-900/30"
              >
                <Download className="h-4 w-4 stroke-[2.5]" />
                <span>Export SQL & CSV</span>
              </button>
            </>
          )}

          <button
            onClick={onReset}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-lg transition-colors"
            title="Reset All Data"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
