import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, ShieldCheck, Cpu, ArrowRight, Table2, Layers, CheckCircle2 } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';

const FadeIn: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 0.8, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
  >
    {children}
  </motion.div>
);

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-200 font-sans selection:bg-sky-500/30 overflow-x-hidden">
      
      {/* Cinematic Hero Section */}
      <motion.section 
        style={{ opacity, scale }}
        className="relative h-screen flex flex-col items-center justify-center text-center px-6"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-sky-900/10 via-[#0a0a0a] to-[#0a0a0a] pointer-events-none" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="z-10 max-w-5xl space-y-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-800 bg-slate-900/50 text-sky-400 text-xs font-mono tracking-widest uppercase">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
            </span>
            Schema Doctor v2.0
          </div>
          
          <h1 className="text-6xl md:text-8xl font-medium tracking-tighter text-white leading-tight">
            Data Normalization. <br className="hidden md:block"/> 
            <span className="text-slate-500">Perfected.</span>
          </h1>
          
          <p className="text-lg md:text-2xl text-slate-400 max-w-2xl mx-auto font-light leading-relaxed">
            Transform chaotic spreadsheets into flawless, mathematically proven relational schemas without writing a single line of code.
          </p>
          
          <div className="pt-8 flex items-center justify-center gap-6">
            <button 
              onClick={() => navigate('/app')}
              className="px-8 py-4 bg-white hover:bg-slate-200 text-black font-semibold rounded-full transition-all flex items-center gap-2 group text-sm tracking-wide"
            >
              Get Started
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <a 
              href="https://github.com/Vatsal0729/SchemaDoc" 
              target="_blank" 
              rel="noreferrer"
              className="px-8 py-4 text-slate-300 hover:text-white font-semibold transition-all text-sm tracking-wide"
            >
              View Documentation
            </a>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-500"
        >
          <span className="text-[10px] uppercase tracking-widest font-mono">Scroll to explore</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-slate-500 to-transparent" />
        </motion.div>
      </motion.section>

      {/* Storytelling Section 1: The Problem */}
      <section className="py-32 md:py-48 px-6 max-w-5xl mx-auto border-t border-slate-900">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <FadeIn>
            <h2 className="text-4xl md:text-5xl font-medium text-white mb-6 tracking-tight">The liability of messy data.</h2>
            <p className="text-slate-400 text-lg leading-relaxed mb-6 font-light">
              Unstructured, duplicated data leads to insertion anomalies, update failures, and slow query performance. 
              Manually diagnosing functional dependencies and applying normal forms is tedious and prone to human error.
            </p>
            <ul className="space-y-4 text-slate-300 font-light">
              <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-slate-600" /> Redundant data storage</li>
              <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-slate-600" /> Complex update anomalies</li>
              <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-slate-600" /> Loss of data integrity</li>
            </ul>
          </FadeIn>
          
          <FadeIn delay={0.2}>
            <div className="relative aspect-square rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center p-8 overflow-hidden">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-rose-500 to-transparent blur-2xl" />
              <div className="grid grid-cols-3 gap-2 w-full transform -rotate-6 opacity-60">
                {[...Array(9)].map((_, i) => (
                  <motion.div 
                    key={i}
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: Math.random() * 2 + 2, repeat: Infinity }}
                    className="h-12 bg-rose-950 border border-rose-900/50 rounded-lg"
                  />
                ))}
              </div>
              <Table2 className="w-20 h-20 text-rose-500/50 absolute" />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Storytelling Section 2: The Solution */}
      <section className="py-32 md:py-48 px-6 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center flex-col-reverse md:flex-row">
          
          <FadeIn delay={0.2}>
            <div className="relative aspect-square rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center p-8 overflow-hidden">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-sky-500 to-transparent blur-2xl" />
              <div className="flex flex-col gap-4 w-full transform rotate-3">
                <motion.div initial={{ x: -20, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="h-16 bg-slate-800 rounded-lg border border-slate-700 w-full" />
                <motion.div initial={{ x: -20, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="h-16 bg-slate-800 rounded-lg border border-slate-700 w-4/5 ml-auto" />
                <motion.div initial={{ x: -20, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }} transition={{ delay: 0.7 }} className="h-16 bg-slate-800 rounded-lg border border-slate-700 w-3/5 ml-auto" />
              </div>
              <Layers className="w-20 h-20 text-sky-400 absolute" />
            </div>
          </FadeIn>

          <FadeIn>
            <h2 className="text-4xl md:text-5xl font-medium text-white mb-6 tracking-tight">Algorithmic Precision.</h2>
            <p className="text-slate-400 text-lg leading-relaxed font-light mb-6">
              Schema Doctor acts as an automated DBA. It mines your dataset for functional dependencies, calculates attribute closures using Armstrong's Axioms, and applies Bernstein's Algorithm to synthesize flawless 3NF, BCNF, 4NF, and 5NF schemas.
            </p>
            <div className="inline-flex items-center gap-2 text-sky-400 text-sm font-medium tracking-wide">
              <span>Explore the engine</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </FadeIn>
          
        </div>
      </section>

      {/* Storytelling Section 3: Features Grid */}
      <section className="py-32 md:py-48 px-6 bg-slate-950/50 border-t border-slate-900">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <h2 className="text-3xl md:text-4xl font-medium text-white mb-16 text-center tracking-tight">Engineered for professionals.</h2>
          </FadeIn>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Cpu, title: "Intelligent Mining", desc: "Automatically discovers functional dependencies from CSV samples." },
              { icon: ShieldCheck, title: "Zero-Trust Privacy", desc: "100% client-side. Your data never touches a server. RAM wipes on exit." },
              { icon: Database, title: "SQL Generation", desc: "Export decomposed tables as DDL/DML scripts for Postgres and MySQL." }
            ].map((feature, idx) => (
              <FadeIn key={idx} delay={idx * 0.2}>
                <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 hover:bg-slate-800/50 transition-colors h-full">
                  <feature.icon className="w-8 h-8 text-slate-300 mb-6" />
                  <h3 className="text-xl font-medium text-white mb-3">{feature.title}</h3>
                  <p className="text-slate-400 font-light leading-relaxed text-sm">
                    {feature.desc}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 md:py-48 px-6 max-w-4xl mx-auto text-center">
        <FadeIn>
          <h2 className="text-5xl md:text-7xl font-medium text-white mb-8 tracking-tight">Ready to normalize?</h2>
          <p className="text-xl text-slate-400 font-light mb-12">Experience the future of database schema design right in your browser.</p>
          <button 
            onClick={() => navigate('/app')}
            className="px-10 py-5 bg-white hover:bg-slate-200 text-black font-semibold rounded-full transition-all shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] inline-flex items-center gap-2 group"
          >
            Launch the Tool
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </FadeIn>
      </section>
      
      {/* Simple Footer */}
      <footer className="py-8 text-center text-slate-600 text-sm font-light border-t border-slate-900">
        <p>© {new Date().getFullYear()} Schema Doctor. Open Source.</p>
      </footer>
    </div>
  );
};
