import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { ToolPage } from './pages/ToolPage';
import { Navbar } from './components/Navbar';

export function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
        <header className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-slate-900">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-lg font-medium font-sans tracking-tight text-white">
                Schema Doctor
              </span>
            </Link>
            <nav className="flex items-center gap-6 text-sm font-mono text-slate-300">
              <Link to="/app" className="hover:text-sky-400 transition-colors">Tool</Link>
              <a href="https://github.com/Vatsal0729/SchemaDoc" target="_blank" rel="noreferrer" className="hover:text-sky-400 transition-colors">GitHub</a>
            </nav>
          </div>
        </header>

        <div className="flex-1">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/app" element={<ToolPage />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
