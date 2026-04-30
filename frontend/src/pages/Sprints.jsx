import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { projectsAPI, sprintsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { format, addDays, startOfToday, isSameDay } from 'date-fns';
import SkeletonLoader from '../components/SkeletonLoader';
import Modal from '../components/Modal';
import { toast } from 'react-hot-toast';

export default function Sprints() {
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [view, setView] = useState('list'); // 'list' or 'roadmap'
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  
  // Create Sprint Modal
  const [sprintModal, setSprintModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sprintForm, setSprintForm] = useState({
    name: '',
    projectId: '',
    startDate: '',
    endDate: ''
  });

  const [sprints, setSprints] = useState([]);

  const fetchAll = async () => {
    try {
      const [projRes, sprintRes] = await Promise.all([
        projectsAPI.getAll(),
        sprintsAPI.getAll(selectedProjectId === 'all' ? undefined : selectedProjectId)
      ]);
      setProjects(projRes.data.projects);
      setSprints(sprintRes.data.sprints);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const handleCreateSprint = async (e) => {
    e.preventDefault();
    if (!sprintForm.projectId) return toast.error('Please select a project');
    setSubmitting(true);
    try {
      await sprintsAPI.create(sprintForm);
      toast.success('Sprint created successfully!');
      setSprintModal(false);
      setSprintForm({ name: '', projectId: '', startDate: '', endDate: '' });
      fetchAll();
    } catch (err) {
      toast.error('Failed to create sprint');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => { fetchAll(); }, [selectedProjectId]);

  const roadmapDays = [...Array(14)].map((_, i) => addDays(startOfToday(), i));

  if (loading) return <div className="space-y-6"><div className="skeleton h-10 w-48 rounded-xl" /><div className="skeleton h-64 rounded-2xl" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Roadmap & Sprints</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Plan and visualize your project velocity.</p>
        </div>
        <div className="flex bg-[var(--surface-2)] p-1 rounded-xl border border-[var(--border)]">
          <button 
            onClick={() => setView('list')}
            className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all ${view === 'list' ? 'bg-[var(--brand-primary)] text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-white'}`}
          >
            Sprints
          </button>
          <button 
            onClick={() => setView('roadmap')}
            className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all ${view === 'roadmap' ? 'bg-[var(--brand-primary)] text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-white'}`}
          >
            Roadmap
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3">
        <select 
          value={selectedProjectId} 
          onChange={e => setSelectedProjectId(e.target.value)}
          className="input w-auto py-2 text-xs"
        >
          <option value="all">All Projects</option>
          {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select>
      </div>

      <AnimatePresence mode="wait">
        {view === 'list' ? (
          <motion.div 
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            {projects.filter(p => selectedProjectId === 'all' || p._id === selectedProjectId).map(p => (
              <div key={p._id} className="card p-5 group hover:border-[var(--brand-primary)]/50 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-inner" style={{ background: `${p.color || '#6366f1'}20`, color: p.color || '#6366f1' }}>
                      ◈
                    </div>
                    <div>
                      <h3 className="font-bold text-[var(--text-primary)]">{p.name}</h3>
                      <p className="text-xs text-[var(--text-muted)]">
                        {p.status} · {sprints.filter(s => s.projectId === p._id).length} sprints
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setSprintForm({ ...sprintForm, projectId: p._id });
                      setSprintModal(true);
                    }} 
                    className="btn-secondary text-xs"
                  >
                    + Create Sprint
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {sprints.filter(s => s.projectId === p._id).length > 0 ? (
                    sprints.filter(s => s.projectId === p._id).map(s => (
                      <div key={s._id} className="p-4 rounded-xl border border-[var(--border)] bg-white/[0.01]">
                        <p className="text-sm font-bold text-[var(--text-primary)]">{s.name}</p>
                        <p className="text-[10px] text-[var(--text-muted)] font-mono mt-1 uppercase">
                          {s.startDate ? format(new Date(s.startDate), 'MMM d') : '?'} - {s.endDate ? format(new Date(s.endDate), 'MMM d') : '?'}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 rounded-xl border border-dashed border-[var(--border)] bg-white/[0.01] flex flex-col items-center justify-center text-center w-full">
                      <p className="text-xs text-[var(--text-muted)]">No active sprints.</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            key="roadmap"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="card overflow-hidden"
          >
            <div className="overflow-x-auto">
              <div className="min-w-[1000px]">
                {/* Timeline Header */}
                <div className="grid grid-cols-[200px_repeat(14,1fr)] border-b border-[var(--border)]">
                  <div className="p-4 bg-[var(--surface-2)] font-semibold text-xs text-[var(--text-muted)] uppercase tracking-wider">Project</div>
                  {roadmapDays.map(day => (
                    <div key={day.toISOString()} className={`p-4 text-center border-l border-[var(--border)] ${isSameDay(day, startOfToday()) ? 'bg-indigo-500/10' : ''}`}>
                      <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold">{format(day, 'EEE')}</p>
                      <p className={`text-xs font-bold ${isSameDay(day, startOfToday()) ? 'text-indigo-400' : 'text-[var(--text-secondary)]'}`}>{format(day, 'd')}</p>
                    </div>
                  ))}
                </div>

                {/* Timeline Rows */}
                <div className="divide-y divide-[var(--border)]">
                  {projects.filter(p => selectedProjectId === 'all' || p._id === selectedProjectId).map(p => (
                    <div key={p._id} className="grid grid-cols-[200px_repeat(14,1fr)] group hover:bg-white/[0.01] transition-colors">
                      <div className="p-4 flex items-center gap-2 border-r border-[var(--border)]">
                        <div className="w-2 h-2 rounded-full" style={{ background: p.color || '#6366f1' }} />
                        <span className="text-xs font-medium text-[var(--text-secondary)] truncate">{p.name}</span>
                      </div>
                      {roadmapDays.map((day, i) => (
                        <div key={i} className={`p-2 border-l border-[var(--border)] h-16 relative ${isSameDay(day, startOfToday()) ? 'bg-indigo-500/5' : ''}`}>
                          {/* Sample Task Bar */}
                          {i === 1 && (
                            <div 
                              className="absolute inset-y-2 left-2 right-[-200%] z-10 rounded-lg p-1.5 text-[9px] font-bold text-white shadow-lg flex items-center gap-1.5 overflow-hidden whitespace-nowrap"
                              style={{ background: `linear-gradient(90deg, ${p.color || '#6366f1'}, ${p.color || '#6366f1'}CC)` }}
                            >
                              🚀 Sprint 1: Foundation
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Sprint Modal */}
      <Modal isOpen={sprintModal} onClose={() => setSprintModal(false)} title="Create New Sprint">
        <form onSubmit={handleCreateSprint} className="space-y-4">
          <div>
            <label className="label">Sprint Name</label>
            <input 
              required
              className="input" 
              placeholder="e.g. Q2 Foundation / Sprint 1"
              value={sprintForm.name}
              onChange={e => setSprintForm({ ...sprintForm, name: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Project</label>
            <select 
              required
              className="input"
              value={sprintForm.projectId}
              onChange={e => setSprintForm({ ...sprintForm, projectId: e.target.value })}
            >
              <option value="">Select a project...</option>
              {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Start Date</label>
              <input 
                type="date"
                className="input"
                value={sprintForm.startDate}
                onChange={e => setSprintForm({ ...sprintForm, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="label">End Date</label>
              <input 
                type="date"
                className="input"
                value={sprintForm.endDate}
                onChange={e => setSprintForm({ ...sprintForm, endDate: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setSprintModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1 justify-center">
              {submitting ? 'Creating...' : 'Create Sprint'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
