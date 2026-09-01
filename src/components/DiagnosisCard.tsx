import React from 'react';
import {
  Stethoscope,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Key,
  Layers,
  Wand2,
  HelpCircle,
  ChevronRight,
} from 'lucide-react';
import type { NormalizationAnalysis } from '../engine/types';

interface DiagnosisCardProps {
  analysis: NormalizationAnalysis;
  onNormalizeClick: () => void;
  isNormalized: boolean;
}

export const DiagnosisCard: React.FC<DiagnosisCardProps> = ({
  analysis,
  onNormalizeClick,
  isNormalized,
}) => {
  const getBadgeStyle = (nf: string) => {
    switch (nf) {
      case 'BCNF':
      case '3NF':
        return 'bg-emerald-950 text-emerald-400 border-emerald-700 glow-emerald';
      case '2NF':
        return 'bg-amber-950 text-amber-400 border-amber-700';
      case '1NF':
      case 'UNNORMALIZED':
        return 'bg-rose-950 text-rose-400 border-rose-700 glow-rose';
      default:
        return 'bg-slate-900 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-6 shadow-2xl relative overflow-hidden">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div className="flex items-start space-x-3.5">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-emerald-400 flex items-center justify-center text-slate-950 shadow-lg shrink-0">
            <Stethoscope className="h-7 w-7 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-lg font-bold text-slate-100">
                Doctor's Diagnosis & Prescription
              </h2>
              <span
                className={`px-3 py-1 text-xs font-mono font-bold rounded-full border shadow-sm ${getBadgeStyle(
                  analysis.maxNormalForm
                )}`}
              >
                Highest NF: {analysis.maxNormalForm}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Automated relational database analysis based on functional dependency closures and normal form rules.
            </p>
          </div>
        </div>

        {!isNormalized && analysis.maxNormalForm !== 'BCNF' && analysis.maxNormalForm !== '3NF' && (
          <button
            onClick={onNormalizeClick}
            className="flex items-center justify-center space-x-2 px-5 py-3 bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-xl shadow-cyan-950/50 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Wand2 className="h-4 w-4 stroke-[2.5]" />
            <span>Apply Doctor's Treatment (Auto-Split into 3NF)</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center space-x-2 text-cyan-400 text-xs font-semibold">
            <Key className="h-4 w-4" />
            <span>Candidate Primary Keys</span>
          </div>
          <div className="font-mono text-xs text-slate-200 space-y-1">
            {analysis.candidateKeys.map((ck, idx) => (
              <div
                key={idx}
                className="bg-slate-950/80 px-2.5 py-1.5 rounded border border-slate-800/80 flex items-center justify-between"
              >
                <span>&#123; {ck.attributes.join(', ')} &#125;</span>
                {ck.isPrimary && (
                  <span className="text-[10px] text-cyan-400 uppercase font-bold">Primary</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold">
            <Layers className="h-4 w-4" />
            <span>Attribute Classification</span>
          </div>
          <div className="text-xs space-y-1 font-mono">
            <div className="text-slate-300">
              <span className="text-cyan-400 font-bold">Prime:</span>{' '}
              {analysis.primeAttributes.join(', ') || 'None'}
            </div>
            <div className="text-slate-400">
              <span className="text-slate-500 font-bold">Non-Prime:</span>{' '}
              {analysis.nonPrimeAttributes.join(', ') || 'None'}
            </div>
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="text-xs font-semibold text-slate-300">Normal Form Checklist</div>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="flex items-center space-x-1.5">
              {analysis.is1NF ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              ) : (
                <XCircle className="h-4 w-4 text-rose-400" />
              )}
              <span className={analysis.is1NF ? 'text-emerald-300' : 'text-rose-400'}>1NF</span>
            </div>
            <div className="flex items-center space-x-1.5">
              {analysis.is2NF ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              ) : (
                <XCircle className="h-4 w-4 text-rose-400" />
              )}
              <span className={analysis.is2NF ? 'text-emerald-300' : 'text-rose-400'}>2NF</span>
            </div>
            <div className="flex items-center space-x-1.5">
              {analysis.is3NF ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              ) : (
                <XCircle className="h-4 w-4 text-rose-400" />
              )}
              <span className={analysis.is3NF ? 'text-emerald-300' : 'text-rose-400'}>3NF</span>
            </div>
            <div className="flex items-center space-x-1.5">
              {analysis.isBCNF ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              ) : (
                <XCircle className="h-4 w-4 text-rose-400" />
              )}
              <span className={analysis.isBCNF ? 'text-emerald-300' : 'text-rose-400'}>BCNF</span>
            </div>
          </div>
        </div>
      </div>

      {analysis.violations.length > 0 && (
        <div className="space-y-4 pt-2">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-400" />
            <span>Detected Normalization Violations ({analysis.violations.length})</span>
          </h3>

          <div className="space-y-3">
            {analysis.violations.map((violation, idx) => (
              <div
                key={idx}
                className="bg-slate-900/90 rounded-xl border border-rose-900/60 p-4 space-y-3 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                    Violates {violation.level}
                  </span>
                  {violation.fd && (
                    <span className="font-mono text-slate-400">
                      FD: &#123; {violation.fd.lhs.join(', ')} &#125; → &#123;{' '}
                      {violation.fd.rhs.join(', ')} &#125;
                    </span>
                  )}
                </div>

                <p className="text-slate-300 font-medium">{violation.reason}</p>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1.5">
                  <div className="text-[11px] font-semibold text-cyan-400 flex items-center gap-1">
                    <HelpCircle className="h-3.5 w-3.5" />
                    <span>Unit 2 Textbook Step-by-Step Proof:</span>
                  </div>
                  <ul className="space-y-1 font-mono text-[11px] text-slate-300 list-disc list-inside">
                    {violation.mathProof.map((step, sIdx) => (
                      <li key={sIdx}>{step}</li>
                    ))}
                  </ul>
                </div>

                <div className="text-emerald-400 font-medium flex items-center gap-1 text-[11px]">
                  <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                  <span>Prescription: {violation.recommendation}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
