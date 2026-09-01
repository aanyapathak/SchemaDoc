import React, { useState, useEffect } from 'react';
import { Sparkles, Key, Search, X } from 'lucide-react';
import { generateFilterFunction } from '../lib/ai';

interface AIFilterPanelProps {
  attributes: string[];
  rows: Record<string, string>[];
  onFilterResult: (filteredRows: Record<string, string>[] | null) => void;
}

export const AIFilterPanel: React.FC<AIFilterPanelProps> = ({ attributes, rows, onFilterResult }) => {
  const [apiKey, setApiKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFiltered, setIsFiltered] = useState(false);

  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
      setApiKey(savedKey);
    } else {
      setShowKeyInput(true);
    }
  }, []);

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('gemini_api_key', apiKey);
    setShowKeyInput(false);
  };

  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    if (!apiKey) {
      setError('Please provide a Gemini API key first.');
      setShowKeyInput(true);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const filterFn = await generateFilterFunction(apiKey, attributes, query);
      const filtered = rows.filter(filterFn);
      setIsFiltered(true);
      onFilterResult(filtered);
    } catch (err: any) {
      setError(err.message || 'An error occurred while filtering data.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setIsFiltered(false);
    setError(null);
    onFilterResult(null);
  };

  if (attributes.length === 0 || rows.length === 0) return null;

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 shadow-lg mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-400" />
          AI Data Extraction
        </h3>
        <button
          onClick={() => setShowKeyInput(!showKeyInput)}
          className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
        >
          <Key className="h-3 w-3" />
          {apiKey ? 'Update API Key' : 'Set API Key'}
        </button>
      </div>

      {showKeyInput && (
        <form onSubmit={handleSaveKey} className="mb-4 flex gap-2">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter Google Gemini API Key"
            className="flex-1 bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="submit"
            className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Save
          </button>
        </form>
      )}

      <form onSubmit={handleQuery} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="E.g. Show me all records where Department is IT and Salary > 50000"
            className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg pl-9 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={isLoading}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          {isLoading ? (
            <span className="animate-pulse">Thinking...</span>
          ) : (
            'Extract'
          )}
        </button>
        {isFiltered && (
          <button
            type="button"
            onClick={handleClear}
            className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-2.5 rounded-lg transition-colors flex items-center justify-center"
            title="Clear Filter"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </form>

      {error && (
        <div className="mt-3 text-red-400 text-sm bg-red-950/30 p-2 rounded border border-red-900/50">
          {error}
        </div>
      )}
    </div>
  );
};
