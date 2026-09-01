import React, { useState } from 'react';
import { Share2, Copy, Check, X, ExternalLink, Sparkles } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareUrl: string;
  shareId: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  shareUrl,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="glass-panel w-full max-w-lg rounded-2xl p-6 border border-slate-700 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-400 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-cyan-500/20">
              <Share2 className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                Your Schema Result is Ready!
              </h3>
              <p className="text-xs text-slate-400">
                Shareable report link generated for your normalized dataset.
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

        <div className="space-y-3">
          <label className="block text-xs font-semibold text-slate-300">
            Shareable Result URL
          </label>
          <div className="flex items-center space-x-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800 font-mono text-xs text-cyan-300">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="bg-transparent border-none w-full focus:outline-none text-slate-200 select-all"
            />
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg transition-all shrink-0 flex items-center space-x-1"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs text-slate-300">
            <div className="font-semibold text-cyan-400 flex items-center space-x-1.5">
              <Sparkles className="h-4 w-4" />
              <span>What anyone with this link can view:</span>
            </div>
            <ul className="space-y-1 text-slate-400 list-disc list-inside text-[11px] font-mono">
              <li>Original Unnormalized Input Table</li>
              <li>Functional Dependency Diagnosis (2NF/3NF/BCNF violations & math proofs)</li>
              <li>Corrected Normalized 3NF Schema & Decomposed Tables</li>
              <li>Exportable SQL DDL/DML and Downloadable CSVs</li>
            </ul>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 font-semibold"
          >
            <span>Preview Result Page</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
