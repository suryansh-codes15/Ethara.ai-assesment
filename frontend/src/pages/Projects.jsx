import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { projectsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { toast } from '../components/Toast';
import Modal from '../components/Modal';
import SkeletonLoader from '../components/SkeletonLoader';
import ProgressRing from '../components/ProgressRing';
import { format } from 'date-fns';

const PROJECT_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6'];

const STATUS_STYLES = {
  active: { bg: 'rgba(16,185,129,0.15)', color: '#34d399', border: 'rgba(16,185,129,0.3)', label: '● Active' },
  completed: { bg: 'rgba(99,102,241,0.15)', color: '#818cf8', border: 'rgba(99,102,241,0.3)', label: '✓ Completed' },
  'on-hold': { bg: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: 'rgba(245,158,11,0.3)', label: '⏸ On Hold' },
};

const healthScore = (project) => {
  if (!project.taskCount) return 100;
  const overduePct = (project.overdueCount || 0) / project.taskCount;
  if (overduePct === 0) return 100;
  if (overduePct < 0.2) return 80;
  if (overduePct < 0.5) return 50;
  return 20;
};

const HealthDot = ({ score }) => {
  const color = score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div className="w-2 h-2 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} title={`Health: ${score}%`} />
  );
};

export default function Projects() {
  const { isAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(searchParams.get('new') === '1');
  const [form, setForm] = useState({ name: '', description: '', status: 'active', color: '#6366f1' });
  const [submitting, setSubmitting] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [view, setView] = useState('grid'); // 'grid' | 'list'

  const fetchProjects = async () => {
    try {
      const { data } = await projectsAPI.getAll();
      setProjects(data.projects);
    } catch (err) {
      console.error(err);
    }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProjects(); }, []);

  const openCreate = () => {
    setForm({ name: '', description: '', status: 'active', color: '#6366f1' });
    setEditProject(null);
    setModal(true);
  };

  const openEdit = (p) => {
    setForm({ name: p.name, description: p.description, status: p.status, color: p.color || '#6366f1' });
    setEditProject(p);
    setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editProject) {
        await projectsAPI.update(editProject._id, form);
      } else {
        await projectsAPI.create(form);
      }
      setModal(false);
      setSearchParams({});
      fetchProjects();
      window.dispatchEvent(new Event('refreshDashboard'));
      toast.success(editProject ? 'Project updated' : 'Project created');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save project');
    }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this project and all its tasks? This cannot be undone.')) return;
    try {
      await projectsAPI.delete(id);
      fetchProjects();
    } catch (err) {
      console.error(err);
    }
  };

  const completionPct = (p) =>
    p.taskCount > 0 ? Math.round((p.completedCount / p.taskCount) * 100) : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="skeleton h-8 w-40 rounded-xl" />
            <div className="skeleton h-4 w-24 rounded" />
          </div>
          <div className="skeleton h-10 w-36 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <SkeletonLoader key={i} type="project" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-[var(--text-primary)]">Projects</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            {projects.length} project{projects.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex rounded-xl overflow-hidden border border-[var(--border)]" style={{ background: 'var(--surface-2)' }}>
            {['grid', 'list'].map(v => (
              <button key={v} onClick={() => setView(v)}
                className="px-3 py-2 text-sm transition-all"
                style={{
                  background: view === v ? 'var(--brand-primary)' : 'transparent',
                  color: view === v ? 'white' : 'var(--text-muted)',
                }}>
                {v === 'grid' ? '⊞' : '≡'}
              </button>
            ))}
          </div>
          {isAdmin && (
            <button onClick={openCreate} className="btn-primary">
              + New Project
            </button>
          )}
        </div>
      </motion.div>

      {/* Empty state */}
      {projects.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-16 text-center dot-grid">
          <div className="text-5xl mb-4 animate-float">◈</div>
          <p className="text-lg font-semibold text-[var(--text-secondary)]">No projects yet</p>
          <p className="text-sm text-[var(--text-muted)] mt-1 mb-6">
            {isAdmin ? 'Create your first project to get the team started.' : "You haven't been added to any projects yet."}
          </p>
          {isAdmin && <button onClick={openCreate} className="btn-primary mx-auto">Create First Project</button>}
        </motion.div>
      ) : view === 'grid' ? (
        /* Grid view */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project, i) => {
            const pct = completionPct(project);
            const status = STATUS_STYLES[project.status] || STATUS_STYLES.active;
            const health = healthScore(project);
            const accentColor = project.color || '#6366f1';

            return (
              <motion.div
                key={project._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="card p-5 flex flex-col group hover:border-[var(--border-hover)] cursor-default relative overflow-hidden"
                style={{ borderTop: `2px solid ${accentColor}` }}
              >
                {/* Accent glow */}
                <div className="absolute top-0 left-0 right-0 h-20 opacity-10"
                  style={{ background: `radial-gradient(ellipse at top, ${accentColor}, transparent)` }} />

                <div className="relative z-10 flex-1 flex flex-col">
                  {/* Top row */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: status.bg, color: status.color, border: `1px solid ${status.border}` }}>
                          {status.label}
                        </span>
                        <HealthDot score={health} />
                      </div>
                      <h3 className="font-display font-semibold text-[var(--text-primary)] truncate">{project.name}</h3>
                    </div>
                    {/* Progress ring */}
                    <div className="relative ml-2 flex-shrink-0">
                      <ProgressRing progress={pct} size={48} strokeWidth={4} color={accentColor} />
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold" style={{ color: accentColor }}>
                        {pct}%
                      </span>
                    </div>
                  </div>

                  {project.description && (
                    <p className="text-xs text-[var(--text-muted)] line-clamp-2 mb-3">{project.description}</p>
                  )}

                  {/* Task count bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-[var(--text-muted)] mb-1.5">
                      <span>{project.completedCount}/{project.taskCount} tasks done</span>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--surface-4)' }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: `linear-gradient(90deg, ${accentColor}, ${accentColor}aa)` }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: i * 0.05 + 0.3 }}
                      />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-[var(--border)]">
                    {/* Member avatars */}
                    <div className="flex -space-x-2">
                      {project.members?.slice(0, 4).map(m => (
                        <div key={m._id} title={m.name}
                          className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-white text-[9px] font-bold"
                          style={{ borderColor: 'var(--surface-2)', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                          {m.name?.charAt(0)}
                        </div>
                      ))}
                      {project.members?.length > 4 && (
                        <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-[9px] text-[var(--text-muted)] font-bold"
                          style={{ borderColor: 'var(--surface-2)', background: 'var(--surface-4)' }}>
                          +{project.members.length - 4}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {isAdmin && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEdit(project)} className="btn-ghost p-1.5 text-xs" title="Edit">✏</button>
                          <button onClick={() => handleDelete(project._id)} className="btn-ghost p-1.5 text-xs hover:text-red-400" title="Delete">🗑</button>
                        </div>
                      )}
                      <Link to={`/projects/${project._id}`}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                        style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }}
                      >
                        Open →
                      </Link>
                    </div>
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)] mt-2">Created {format(new Date(project.createdAt), 'MMM d, yyyy')}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* List view */
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card overflow-hidden">
          <div className="divide-y divide-[var(--border)]">
            {projects.map((project, i) => {
              const pct = completionPct(project);
              const status = STATUS_STYLES[project.status] || STATUS_STYLES.active;
              const accentColor = project.color || '#6366f1';
              return (
                <motion.div
                  key={project._id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] group transition-colors"
                  style={{ borderLeft: `3px solid ${accentColor}` }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-semibold text-[var(--text-primary)] truncate">{project.name}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold hidden sm:inline"
                        style={{ background: status.bg, color: status.color }}>
                        {status.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex-1 max-w-[160px] h-1 rounded-full overflow-hidden" style={{ background: 'var(--surface-4)' }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: accentColor }} />
                      </div>
                      <span className="text-xs text-[var(--text-muted)]">{pct}%</span>
                    </div>
                  </div>
                  <div className="text-xs text-[var(--text-muted)] hidden md:block">{project.taskCount} tasks</div>
                  <div className="flex -space-x-1.5 hidden sm:flex">
                    {project.members?.slice(0, 3).map(m => (
                      <div key={m._id}
                        className="w-5 h-5 rounded-full border flex items-center justify-center text-white text-[8px] font-bold"
                        style={{ borderColor: 'var(--surface-2)', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                        {m.name?.charAt(0)}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-1">
                    {isAdmin && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(project)} className="btn-ghost p-1.5 text-xs">✏</button>
                        <button onClick={() => handleDelete(project._id)} className="btn-ghost p-1.5 text-xs hover:text-red-400">🗑</button>
                      </div>
                    )}
                    <Link to={`/projects/${project._id}`}
                      className="text-xs px-3 py-1.5 rounded-lg transition-all"
                      style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
                      Open →
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={modal} onClose={() => { setModal(false); setSearchParams({}); }} title={editProject ? 'Edit Project' : 'New Project'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Project name *</label>
            <input className="input" placeholder="e.g. Marketing Website" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} required minLength={2} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input resize-none" rows={3} placeholder="What's this project about?"
              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="active">Active</option>
                <option value="on-hold">On Hold</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="label">Accent Color</label>
              <div className="flex gap-2 flex-wrap pt-1">
                {PROJECT_COLORS.map(c => (
                  <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                    className="w-6 h-6 rounded-full transition-all"
                    style={{
                      background: c,
                      outline: form.color === c ? `2px solid ${c}` : '2px solid transparent',
                      outlineOffset: '2px',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => { setModal(false); setSearchParams({}); }} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1 justify-center">
              {submitting ? 'Saving...' : editProject ? 'Update Project' : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
