import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { searchAPI } from '../api';
import { useAuth } from '../context/AuthContext';

const QUICK_ACTIONS = [
  { icon: '⬡', label: 'Go to Dashboard', action: 'nav', to: '/dashboard', shortcut: '⌘D' },
  { icon: '◈', label: 'Go to Projects', action: 'nav', to: '/projects', shortcut: '⌘P' },
  { icon: '⚙', label: 'Settings', action: 'nav', to: '/profile', shortcut: '⌘S' },
  { icon: '+', label: 'New Project', action: 'nav', to: '/projects?new=1', shortcut: '' },
];

export default function CommandPalette({ open, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ tasks: [], projects: [] });
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(0);
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  useEffect(() => {
    if (!open) { setQuery(''); setResults({ tasks: [], projects: [] }); setSelected(0); }
  }, [open]);

  useEffect(() => {
    if (!query.trim() || query.length < 2) { setResults({ tasks: [], projects: [] }); return; }
    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await searchAPI.search(query);
        setResults(data.results);
      } catch { /* silent */ }
      finally { setLoading(false); }
    }, 200);
    return () => clearTimeout(timeout);
  }, [query]);

  const allResults = [
    ...(!query ? QUICK_ACTIONS.map(a => ({ ...a, type: 'action' })) : []),
    ...(results.projects || []).map(p => ({ ...p, type: 'project', icon: '◈', label: p.name, to: `/projects/${p._id}` })),
    ...(results.tasks || []).map(t => ({ ...t, type: 'task', icon: '◻', label: t.title, to: `/projects/${t.projectId}` })),
  ];

  const handleSelect = useCallback((item) => {
    onClose();
    if (item.to) navigate(item.to);
  }, [navigate, onClose]);

  useEffect(() => {
    const handler = (e) => {
      if (!open) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, allResults.length - 1)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
      if (e.key === 'Enter' && allResults[selected]) { handleSelect(allResults[selected]); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, allResults, selected, handleSelect]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
            className="fixed top-[15vh] left-1/2 -translate-x-1/2 z-[101] w-full max-w-[560px] mx-4"
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border-hover)',
              borderRadius: '16px',
              boxShadow: '0 25px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.15)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]">
              <span className="text-[var(--text-muted)] text-sm">{loading ? '⟳' : '🔍'}</span>
              <input
                autoFocus
                value={query}
                onChange={e => { setQuery(e.target.value); setSelected(0); }}
                placeholder="Search tasks, projects, or type a command..."
                className="flex-1 bg-transparent text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none text-sm"
              />
              <kbd className="text-[10px] bg-white/5 text-[var(--text-muted)] px-1.5 py-0.5 rounded border border-[var(--border)] font-mono">ESC</kbd>
            </div>

            {/* Results */}
            <div className="py-2 max-h-[360px] overflow-y-auto">
              {!query && (
                <p className="text-[10px] uppercase font-semibold text-[var(--text-muted)] px-4 pt-1 pb-2 tracking-widest">
                  Quick Actions
                </p>
              )}
              {query && results.projects.length > 0 && (
                <p className="text-[10px] uppercase font-semibold text-[var(--text-muted)] px-4 pt-1 pb-1 tracking-widest">Projects</p>
              )}
              {query && results.tasks.length > 0 && results.projects.length === 0 && (
                <p className="text-[10px] uppercase font-semibold text-[var(--text-muted)] px-4 pt-1 pb-1 tracking-widest">Tasks</p>
              )}

              {allResults.length === 0 && query.length >= 2 && !loading && (
                <div className="text-center py-8 text-[var(--text-muted)] text-sm">
                  <p className="text-2xl mb-2">🔍</p>
                  <p>No results for "<span className="text-[var(--text-secondary)]">{query}</span>"</p>
                </div>
              )}

              {allResults.map((item, i) => (
                <button
                  key={i}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelected(i)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all duration-100"
                  style={{
                    background: i === selected ? 'rgba(99,102,241,0.12)' : 'transparent',
                  }}
                >
                  <span className="text-base w-5 text-center flex-shrink-0 text-[var(--text-muted)]">
                    {item.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{item.label}</p>
                    {item.type === 'task' && item.project && (
                      <p className="text-xs text-[var(--text-muted)] truncate">{item.project.name}</p>
                    )}
                    {item.type === 'project' && (
                      <p className="text-xs text-[var(--text-muted)]">Project</p>
                    )}
                  </div>
                  {item.shortcut && (
                    <kbd className="text-[10px] text-[var(--text-muted)] font-mono bg-white/5 px-1.5 py-0.5 rounded border border-[var(--border)]">
                      {item.shortcut}
                    </kbd>
                  )}
                  {i === selected && <span className="text-[var(--text-muted)] text-xs">↵</span>}
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-[var(--border)] flex items-center gap-4 text-[10px] text-[var(--text-muted)]">
              <span><kbd className="font-mono">↑↓</kbd> navigate</span>
              <span><kbd className="font-mono">↵</kbd> select</span>
              <span><kbd className="font-mono">ESC</kbd> close</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
