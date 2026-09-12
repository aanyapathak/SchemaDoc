import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, ShieldCheck, Cpu, ArrowRight } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-sky-500/30 overflow-x-hidden pt-20">
      <main className="max-w-6xl mx-auto px-6 py-20">
        <div className="flex flex-col items-center text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-sky-400 text-xs font-mono mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
            </span>
            Schema Doctor v2.0 is live
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white leading-tight">
            Normalize your messy data <br className="hidden md:block"/> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-500">instantly.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl">
            The automated Relational Database Theory engine that diagnoses, closures, and synthesizes 1NF-5NF schemas securely in your browser.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 pt-8">
            <button 
              onClick={() => navigate('/app')}
              className="px-8 py-4 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl transition-all shadow-[0_0_40px_-10px_rgba(14,165,233,0.5)] flex items-center justify-center gap-2 group"
            >
              Get Started
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <a 
              href="https://github.com/Vatsal0729/SchemaDoc" 
              target="_blank" 
              rel="noreferrer"
              className="px-8 py-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold rounded-xl transition-all flex items-center justify-center"
            >
              View on GitHub
            </a>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-32">
          <div className="p-6 bg-slate-900/50 border border-slate-800/80 rounded-2xl space-y-4">
            <div className="w-12 h-12 bg-sky-900/30 rounded-xl flex items-center justify-center border border-sky-800/50">
              <Cpu className="w-6 h-6 text-sky-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-200">Algorithmic Precision</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Computes attribute closures and candidate keys using Armstrong's Axioms. Synthesizes flawless 3NF tables using Bernstein's Algorithm.
            </p>
          </div>
          
          <div className="p-6 bg-slate-900/50 border border-slate-800/80 rounded-2xl space-y-4">
            <div className="w-12 h-12 bg-emerald-900/30 rounded-xl flex items-center justify-center border border-emerald-800/50">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-200">100% Client-Side Privacy</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Your data never leaves your machine. Processing runs entirely in your browser memory and self-destructs upon closing or inactivity.
            </p>
          </div>

          <div className="p-6 bg-slate-900/50 border border-slate-800/80 rounded-2xl space-y-4">
            <div className="w-12 h-12 bg-fuchsia-900/30 rounded-xl flex items-center justify-center border border-fuchsia-800/50">
              <Database className="w-6 h-6 text-fuchsia-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-200">Multi-Dialect Export</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Download your newly normalized relations as clean CSV archives or generate DDL/DML scripts for PostgreSQL, MySQL, and SQL Server.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};
