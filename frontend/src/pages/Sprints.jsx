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
      const [projRes, sprintRes] = await Promise.allSettled([
        projectsAPI.getAll(),
        sprintsAPI.getAll(selectedProjectId === 'all' ? undefined : selectedProjectId)
      ]);

      if (projRes.status === 'fulfilled') {
        setProjects(projRes.value.data.projects || []);
      } else {
        console.error('Failed to fetch projects:', projRes.reason);
      }

      if (sprintRes.status === 'fulfilled') {
        setSprints(sprintRes.value.data.sprints || []);
      } else {
        console.error('Failed to fetch sprints:', sprintRes.reason);
      }
    } catch (err) {
      console.error('Fetch all error:', err);
    } finally {
      setLoading(false);
    }
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

  const filteredProjects = projects.filter(p => selectedProjectId === 'all' || p._id === selectedProjectId);

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black gradient-text tracking-tight">Roadmap & Sprints</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1.5 font-medium flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-primary)] animate-pulse" />
            Strategic planning and execution velocity
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 backdrop-blur-xl">
            <button 
              onClick={() => setView('list')}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${view === 'list' ? 'bg-[var(--brand-primary)] text-white shadow-[0_8px_20px_rgba(99,102,241,0.3)]' : 'text-[var(--text-muted)] hover:text-white'}`}
            >
              ◈ Sprints
            </button>
            <button 
              onClick={() => setView('roadmap')}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${view === 'roadmap' ? 'bg-[var(--brand-primary)] text-white shadow-[0_8px_20px_rgba(99,102,241,0.3)]' : 'text-[var(--text-muted)] hover:text-white'}`}
            >
              📅 Roadmap
            </button>
          </div>

          <select 
            value={selectedProjectId} 
            onChange={e => setSelectedProjectId(e.target.value)}
            className="glass-premium px-4 py-2.5 rounded-xl text-xs font-bold text-white border-white/10 outline-none hover:border-white/20 transition-all cursor-pointer"
          >
            <option value="all">All Projects</option>
            {projects.map(p => <option key={p._id} value={p._id} className="bg-[#0f172a]">{p.name}</option>)}
          </select>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {view === 'list' ? (
          <motion.div 
            key="list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 gap-6"
          >
            {filteredProjects.length > 0 ? (
              filteredProjects.map((p, idx) => (
                <motion.div 
                  key={p._id} 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="glass-premium p-8 group hover:border-[var(--brand-primary)]/40 transition-all duration-500 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--brand-primary)]/5 blur-[80px] -mr-32 -mt-32 rounded-full" />
                  
                  <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-2xl border border-white/10" 
                           style={{ background: `linear-gradient(135deg, ${p.color || '#6366f1'}20, ${p.color || '#6366f1'}05)`, color: p.color || '#6366f1' }}>
                        ◈
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-white tracking-tight">{p.name}</h3>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-white/5 text-[var(--text-muted)] border border-white/5">
                            {p.status}
                          </span>
                          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--brand-primary)]">
                            {sprints.filter(s => s.projectId === p._id).length} Active Sprints
                          </span>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => {
                        setSprintForm({ ...sprintForm, projectId: p._id });
                        setSprintModal(true);
                      }} 
                      className="btn-primary py-3 px-8 text-xs uppercase tracking-widest group-hover:scale-105 transition-transform"
                    >
                      + Create New Sprint
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
                    {sprints.filter(s => s.projectId === p._id).length > 0 ? (
                      sprints.filter(s => s.projectId === p._id).map(s => (
                        <div key={s._id} className="p-5 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors relative overflow-hidden group/sprint">
                          <div className="absolute top-0 left-0 w-1 h-full bg-[var(--brand-primary)] opacity-0 group-hover/sprint:opacity-100 transition-opacity" />
                          <p className="text-xs font-black text-white uppercase tracking-wider mb-2">{s.name}</p>
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <p className="text-[10px] text-[var(--text-muted)] font-mono uppercase tracking-tight">
                              {s.startDate ? format(new Date(s.startDate), 'MMM d') : '?'} — {s.endDate ? format(new Date(s.endDate), 'MMM d') : '?'}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full py-10 rounded-2xl border border-dashed border-white/10 bg-white/[0.01] flex flex-col items-center justify-center text-center">
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-[var(--text-muted)] mb-3 text-xl">◌</div>
                        <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">No active sprints for this project</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="py-24 text-center glass-premium rounded-[40px] border-dashed border-white/10">
                <div className="text-6xl mb-6">🛰️</div>
                <h3 className="text-2xl font-black text-white tracking-tight">No Projects Found</h3>
                <p className="text-[var(--text-muted)] max-w-sm mx-auto mt-2 font-medium">Select a project or create a new one to start planning your sprints and roadmap.</p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="roadmap"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-premium overflow-hidden rounded-[32px] border-white/10 shadow-2xl"
          >
            <div className="overflow-x-auto custom-scrollbar">
              <div className="min-w-[1200px]">
                <div className="grid grid-cols-[240px_repeat(14,1fr)] border-b border-white/5">
                  <div className="p-6 bg-white/[0.02] font-black text-[10px] text-[var(--text-muted)] uppercase tracking-[0.2em] flex items-center">Project Velocity</div>
                  {roadmapDays.map(day => (
                    <div key={day.toISOString()} className={`p-5 text-center border-l border-white/5 ${isSameDay(day, startOfToday()) ? 'bg-[var(--brand-primary)]/10' : ''}`}>
                      <p className="text-[9px] text-[var(--text-muted)] uppercase font-black tracking-widest mb-1">{format(day, 'EEE')}</p>
                      <p className={`text-sm font-black ${isSameDay(day, startOfToday()) ? 'text-[var(--brand-primary)]' : 'text-white'}`}>{format(day, 'd')}</p>
                    </div>
                  ))}
                </div>

                <div className="divide-y divide-white/5">
                  {filteredProjects.map(p => (
                    <div key={p._id} className="grid grid-cols-[240px_repeat(14,1fr)] group hover:bg-white/[0.02] transition-colors">
                      <div className="p-6 flex items-center gap-3 border-r border-white/5">
                        <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]" style={{ background: p.color || '#6366f1', boxShadow: `0 0 15px ${p.color || '#6366f1'}40` }} />
                        <span className="text-xs font-black text-white uppercase tracking-wider truncate">{p.name}</span>
                      </div>
                      {roadmapDays.map((day, i) => (
                        <div key={i} className={`p-2 border-l border-white/5 h-24 relative ${isSameDay(day, startOfToday()) ? 'bg-[var(--brand-primary)]/5' : ''}`}>
                          {/* Sample Task Bar */}
                          {i === 1 && (
                            <motion.div 
                              initial={{ opacity: 0, scaleX: 0 }}
                              animate={{ opacity: 1, scaleX: 1 }}
                              className="absolute inset-y-4 left-4 right-[-200%] z-10 rounded-2xl p-3 text-[10px] font-black text-white shadow-2xl flex items-center gap-2 overflow-hidden whitespace-nowrap border border-white/20 origin-left"
                              style={{ background: `linear-gradient(90deg, ${p.color || '#6366f1'}, ${p.color || '#6366f1'}aa)` }}
                            >
                              🚀 SPRINT ALPHA: CORE INFRASTRUCTURE
                            </motion.div>
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

      <Modal isOpen={sprintModal} onClose={() => setSprintModal(false)} title="Create New Sprint">
        <form onSubmit={handleCreateSprint} className="space-y-6">
          <div className="space-y-2">
            <label className="label">Sprint Identifier</label>
            <input 
              required
              className="input" 
              placeholder="e.g. Q3 DELTA / SPRINT 04"
              value={sprintForm.name}
              onChange={e => setSprintForm({ ...sprintForm, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="label">Target Project</label>
            <select 
              required
              className="input"
              value={sprintForm.projectId}
              onChange={e => setSprintForm({ ...sprintForm, projectId: e.target.value })}
            >
              <option value="" className="bg-[#0f172a]">Select Project...</option>
              {projects.map(p => <option key={p._id} value={p._id} className="bg-[#0f172a]">{p.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="label">Commencement Date</label>
              <input 
                type="date"
                className="input"
                value={sprintForm.startDate}
                onChange={e => setSprintForm({ ...sprintForm, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="label">Conclusion Date</label>
              <input 
                type="date"
                className="input"
                value={sprintForm.endDate}
                onChange={e => setSprintForm({ ...sprintForm, endDate: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-4 pt-4">
            <button type="button" onClick={() => setSprintModal(false)} className="btn-secondary flex-1 justify-center py-4 uppercase tracking-[0.2em] text-[10px] font-black">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1 justify-center py-4 uppercase tracking-[0.2em] text-[10px] font-black">
              {submitting ? 'Creating...' : 'Initialize Sprint'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
