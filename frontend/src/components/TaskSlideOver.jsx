import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tasksAPI, commentsAPI, subtasksAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { format, formatDistanceToNow, isPast } from 'date-fns';

const PRIORITY_STYLES = {
  high: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', label: '🔴 High' },
  medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: '🟡 Medium' },
  low: { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', label: '🔵 Low' },
};

const STATUS_OPTS = [
  { value: 'todo', label: '📝 To Do' },
  { value: 'in-progress', label: '⚡ In Progress' },
  { value: 'done', label: '✅ Done' },
];

export default function TaskSlideOver({ taskId, open, onClose, onUpdated }) {
  const { user, isAdmin } = useAuth();
  const [task, setTask] = useState(null);
  const [subtasks, setSubtasks] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newSubtask, setNewSubtask] = useState('');
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [addingSubtask, setAddingSubtask] = useState(false);
  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const commentRef = useRef(null);
  const intervalRef = useRef(null);

  const fetchAll = async () => {
    if (!taskId) return;
    setLoading(true);
    try {
      const [taskRes, subtasksRes, commentsRes] = await Promise.all([
        tasksAPI.getOne(taskId),
        subtasksAPI.getAll(taskId),
        commentsAPI.getAll(taskId),
      ]);
      setTask(taskRes.data.task);
      setSubtasks(subtasksRes.data.subtasks || []);
      setComments(commentsRes.data.comments || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (open && taskId) fetchAll();
    else { setTask(null); setSubtasks([]); setComments([]); }
  }, [open, taskId]);

  // Timer
  useEffect(() => {
    if (timerActive) {
      intervalRef.current = setInterval(() => setTimerSeconds(s => s + 1), 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [timerActive]);

  const formatTimer = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
      : `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  };

  const handleStatusChange = async (status) => {
    try {
      await tasksAPI.update(taskId, { status });
      setTask(t => ({ ...t, status }));
      onUpdated?.();
    } catch { /* silent */ }
  };

  const handleAddSubtask = async () => {
    if (!newSubtask.trim()) return;
    setAddingSubtask(true);
    try {
      const { data } = await subtasksAPI.add(taskId, newSubtask.trim());
      setSubtasks(s => [...s, data.subtask]);
      setNewSubtask('');
    } catch { /* silent */ }
    finally { setAddingSubtask(false); }
  };

  const handleToggleSubtask = async (sid) => {
    try {
      const { data } = await subtasksAPI.toggle(taskId, sid);
      setSubtasks(s => s.map(sub => sub._id === sid ? data.subtask : sub));
    } catch { /* silent */ }
  };

  const handleDeleteSubtask = async (sid) => {
    try {
      await subtasksAPI.delete(taskId, sid);
      setSubtasks(s => s.filter(sub => sub._id !== sid));
    } catch { /* silent */ }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      const { data } = await commentsAPI.add(taskId, newComment.trim());
      setComments(c => [...c, data.comment]);
      setNewComment('');
    } catch { /* silent */ }
    finally { setSubmitting(false); }
  };

  const doneSubtasks = subtasks.filter(s => s.done).length;
  const subtaskProgress = subtasks.length > 0 ? (doneSubtasks / subtasks.length) * 100 : 0;
  const isOverdue = task?.dueDate && isPast(new Date(task.dueDate)) && task?.status !== 'done';
  const priority = PRIORITY_STYLES[task?.priority] || PRIORITY_STYLES.medium;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80]"
            style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: 520 }}
            animate={{ x: 0 }}
            exit={{ x: 520 }}
            transition={{ type: 'spring', damping: 30, stiffness: 280 }}
            className="fixed right-0 top-0 bottom-0 z-[81] w-full max-w-[500px] flex flex-col overflow-hidden"
            style={{
              background: 'var(--surface-1)',
              borderLeft: '1px solid var(--border)',
              boxShadow: '-30px 0 80px rgba(0,0,0,0.5)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                <span>{task?.project?.name || '...'}</span>
                <span>›</span>
                <span className="text-[var(--text-secondary)]">Task Detail</span>
              </div>
              <button onClick={onClose} className="btn-ghost p-1.5">✕</button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              {loading ? (
                <div className="space-y-4">
                  <div className="skeleton h-7 w-3/4 rounded-lg" />
                  <div className="skeleton h-4 w-full rounded" />
                  <div className="skeleton h-4 w-2/3 rounded" />
                  <div className="skeleton h-24 w-full rounded-xl mt-4" />
                </div>
              ) : !task ? (
                <p className="text-[var(--text-muted)] text-sm">Task not found.</p>
              ) : (
                <>
                  {/* Title + Priority */}
                  <div>
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-1 flex-shrink-0 self-stretch rounded-full mt-1" style={{ background: priority.color, minHeight: '24px' }} />
                      <h2 className="text-lg font-bold text-[var(--text-primary)] leading-snug">{task.title}</h2>
                    </div>
                    {task.description && (
                      <p className="text-sm text-[var(--text-secondary)] ml-4 leading-relaxed">{task.description}</p>
                    )}
                  </div>

                  {/* Meta grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Status */}
                    <div className="p-3 rounded-xl" style={{ background: 'var(--surface-2)' }}>
                      <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest mb-2 font-semibold">Status</p>
                      {isAdmin ? (
                        <select
                          value={task.status}
                          onChange={e => handleStatusChange(e.target.value)}
                          className="input text-xs py-1.5"
                        >
                          {STATUS_OPTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                      ) : (
                        <span className={`badge-${task.status}`}>{STATUS_OPTS.find(s => s.value === task.status)?.label}</span>
                      )}
                    </div>

                    {/* Priority */}
                    <div className="p-3 rounded-xl" style={{ background: 'var(--surface-2)' }}>
                      <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest mb-2 font-semibold">Priority</p>
                      <span className="text-sm font-medium" style={{ color: priority.color }}>{priority.label}</span>
                    </div>

                    {/* Assignee */}
                    <div className="p-3 rounded-xl" style={{ background: 'var(--surface-2)' }}>
                      <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest mb-2 font-semibold">Assigned To</p>
                      {task.assignedTo ? (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                            {task.assignedTo.name?.charAt(0)}
                          </div>
                          <span className="text-sm text-[var(--text-secondary)]">{task.assignedTo.name}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-[var(--text-muted)]">Unassigned</span>
                      )}
                    </div>

                    {/* Due date */}
                    <div className="p-3 rounded-xl" style={{ background: 'var(--surface-2)' }}>
                      <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest mb-2 font-semibold">Due Date</p>
                      {task.dueDate ? (
                        <span className={`text-sm font-medium ${isOverdue ? 'text-red-400 animate-overdue' : 'text-[var(--text-secondary)]'}`}>
                          {isOverdue ? '⚠ ' : ''}{format(new Date(task.dueDate), 'MMM d, yyyy')}
                        </span>
                      ) : (
                        <span className="text-sm text-[var(--text-muted)]">No due date</span>
                      )}
                    </div>
                  </div>

                  {/* Time tracker */}
                  <div className="p-3 rounded-xl flex items-center justify-between" style={{ background: 'var(--surface-2)' }}>
                    <div>
                      <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-semibold">Time Tracking</p>
                      <p className="text-xl font-mono font-bold text-[var(--text-primary)] mt-0.5">{formatTimer(timerSeconds)}</p>
                    </div>
                    <button
                      onClick={() => setTimerActive(a => !a)}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                        timerActive
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                          : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/30'
                      }`}
                    >
                      {timerActive ? '⏹ Stop' : '▶ Start'}
                    </button>
                  </div>

                  {/* Subtasks */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">
                        Subtasks <span className="text-[var(--text-muted)] font-normal">({doneSubtasks}/{subtasks.length})</span>
                      </p>
                    </div>
                    {subtasks.length > 0 && (
                      <div className="h-1 rounded-full mb-3 overflow-hidden" style={{ background: 'var(--surface-3)' }}>
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: 'linear-gradient(90deg, #6366f1, #10b981)' }}
                          animate={{ width: `${subtaskProgress}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    )}
                    <div className="space-y-1.5">
                      {subtasks.map(sub => (
                        <div key={sub._id} className="flex items-center gap-2.5 group">
                          <button
                            onClick={() => handleToggleSubtask(sub._id)}
                            className="w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all"
                            style={{
                              borderColor: sub.done ? '#10b981' : 'var(--border-hover)',
                              background: sub.done ? 'rgba(16,185,129,0.2)' : 'transparent',
                            }}
                          >
                            {sub.done && <span className="text-emerald-400 text-[10px]">✓</span>}
                          </button>
                          <span className={`text-sm flex-1 ${sub.done ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-secondary)]'}`}>
                            {sub.title}
                          </span>
                          <button
                            onClick={() => handleDeleteSubtask(sub._id)}
                            className="opacity-0 group-hover:opacity-100 btn-ghost p-1 text-[var(--text-muted)] hover:text-red-400 text-xs transition-opacity"
                          >✕</button>
                        </div>
                      ))}
                    </div>
                    {/* Add subtask input */}
                    <div className="flex gap-2 mt-2.5">
                      <input
                        value={newSubtask}
                        onChange={e => setNewSubtask(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddSubtask()}
                        placeholder="Add subtask..."
                        className="input text-xs py-2 flex-1"
                      />
                      <button
                        onClick={handleAddSubtask}
                        disabled={addingSubtask || !newSubtask.trim()}
                        className="btn-secondary py-2 px-3 text-xs"
                      >
                        {addingSubtask ? '...' : '+ Add'}
                      </button>
                    </div>
                  </div>

                  {/* Comments */}
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)] mb-3">
                      Comments <span className="text-[var(--text-muted)] font-normal">({comments.length})</span>
                    </p>
                    <div className="space-y-3">
                      {comments.map(c => (
                        <div key={c._id} className="flex gap-3 animate-slide-up">
                          <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
                            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                            {c.user?.name?.charAt(0)}
                          </div>
                          <div className="flex-1 p-3 rounded-xl text-sm" style={{ background: 'var(--surface-2)' }}>
                            <div className="flex items-baseline gap-2 mb-1">
                              <span className="font-semibold text-[var(--text-primary)] text-xs">{c.user?.name}</span>
                              <span className="text-[10px] text-[var(--text-muted)]">
                                {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                              </span>
                            </div>
                            <p className="text-[var(--text-secondary)] leading-relaxed">{c.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add comment */}
                    <div className="flex gap-2 mt-3">
                      <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                        {user?.name?.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <textarea
                          ref={commentRef}
                          rows={2}
                          value={newComment}
                          onChange={e => setNewComment(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAddComment(); }}
                          placeholder="Add a comment... (⌘↵ to submit)"
                          className="input text-xs py-2 resize-none"
                        />
                        <button
                          onClick={handleAddComment}
                          disabled={submitting || !newComment.trim()}
                          className="btn-primary text-xs py-1.5 mt-1.5"
                        >
                          {submitting ? 'Posting...' : 'Comment'}
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
