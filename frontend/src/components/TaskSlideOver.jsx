import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tasksAPI, commentsAPI, subtasksAPI, activityAPI } from '../api';
import RichTextEditor from './RichTextEditor';
import ActivityFeed from './ActivityFeed';
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
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('comments'); // 'comments' or 'activity'
  const [newSubtask, setNewSubtask] = useState('');
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [addingSubtask, setAddingSubtask] = useState(false);
  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [editingDesc, setEditingDesc] = useState(false);
  const [descValue, setDescValue] = useState('');
  const [aiRefining, setAiRefining] = useState(false);
  const [files, setFiles] = useState([]);
  const commentRef = useRef(null);
  const intervalRef = useRef(null);

  const fetchAll = async () => {
    if (!taskId) return;
    setLoading(true);
    try {
      const [taskRes, commentsRes, activityRes] = await Promise.all([
        tasksAPI.getOne(taskId),
        commentsAPI.getAll(taskId),
        activityAPI.getAll({ entityId: taskId })
      ]);
      setTask(taskRes.data.task);
      setDescValue(taskRes.data.task.description || '');
      setSubtasks(taskRes.data.task.subtasks || []);
      setComments(commentsRes.data.comments || []);
      setActivities(activityRes.data.activities || []);
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
  
  const handleUpdateDescription = async () => {
    try {
      await tasksAPI.update(taskId, { description: descValue });
      setTask(t => ({ ...t, description: descValue }));
      setEditingDesc(false);
      onUpdated?.();
    } catch { /* silent */ }
  };

  const handleAIRefine = async () => {
    if (!descValue.trim()) return;
    setAiRefining(true);
    // Simulate AI processing
    setTimeout(async () => {
      const refined = `<h3>🚀 Refined Requirements</h3><p>${descValue}</p><ul><li><b>Goal:</b> Complete this task with high quality.</li><li><b>Acceptance Criteria:</b> Verified and tested.</li></ul><p><i>Automatically refined by Obsidian AI.</i></p>`;
      setDescValue(refined);
      setAiRefining(false);
    }, 1500);
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
            initial={{ x: 520, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 520, opacity: 0 }}
            transition={{ type: 'spring', damping: 35, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-[81] w-full max-w-[500px] flex flex-col overflow-hidden glass-premium border-l border-white/10"
            style={{
              boxShadow: '-40px 0 100px rgba(0,0,0,0.6)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                   <span className="text-lg">📋</span>
                </div>
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">{task?.project?.name || 'Project'}</h3>
                  <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest mt-1">Milestone Intel</p>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="w-10 h-10 rounded-xl hover:bg-white/10 flex items-center justify-center transition-all text-[var(--text-muted)] hover:text-white group"
              >
                <span className="text-xl group-hover:rotate-90 transition-transform duration-300">✕</span>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8 custom-scrollbar">
              {loading ? (
                <div className="space-y-6">
                  <div className="skeleton h-10 w-3/4 rounded-2xl" />
                  <div className="skeleton h-32 w-full rounded-3xl" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="skeleton h-20 rounded-2xl" />
                    <div className="skeleton h-20 rounded-2xl" />
                  </div>
                </div>
              ) : !task ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-30">
                  <div className="text-6xl mb-6">🛰</div>
                  <p className="text-xs font-black uppercase tracking-widest text-white">Milestone Not Found</p>
                </div>
              ) : (
                <>
                   {/* Title + Description */}
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-1.5 h-10 rounded-full flex-shrink-0 shadow-[0_0_15px_rgba(0,0,0,0.5)]" 
                           style={{ background: priority.color, boxShadow: `0 0 20px ${priority.color}60` }} />
                      <h2 className="text-2xl font-black text-white leading-tight tracking-tight uppercase tracking-[-0.02em]">{task.title}</h2>
                    </div>
                    
                    <div className="relative group/desc">
                      {editingDesc ? (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
                          <div className="rounded-3xl overflow-hidden border border-white/10 bg-white/5">
                            <RichTextEditor 
                              content={descValue} 
                              onChange={setDescValue} 
                              placeholder="Define the strategic intent..." 
                            />
                          </div>
                          <div className="flex gap-3 justify-between items-center">
                            <button 
                              onClick={handleAIRefine} 
                              disabled={aiRefining}
                              className="px-4 py-2 text-[10px] font-black text-indigo-400 hover:text-indigo-300 flex items-center gap-2 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-xl transition-all border border-indigo-500/20 uppercase tracking-widest"
                            >
                              {aiRefining ? '✨ Syncing...' : '✨ AI Refine'}
                            </button>
                            <div className="flex gap-2">
                              <button onClick={() => { setEditingDesc(false); setDescValue(task.description || ''); }} className="px-5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest transition-all">Abort</button>
                              <button onClick={handleUpdateDescription} className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20">Commit</button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div 
                          onClick={() => isAdmin && setEditingDesc(true)}
                          className={`group cursor-pointer p-6 rounded-[32px] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all ${!task.description ? 'border-dashed' : ''}`}
                        >
                          {task.description ? (
                            <div className="prose prose-invert prose-sm max-w-none text-[var(--text-secondary)] font-medium leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity" dangerouslySetInnerHTML={{ __html: task.description }} />
                          ) : (
                            <div className="flex flex-col items-center py-4 opacity-30 group-hover:opacity-50 transition-opacity">
                              <span className="text-2xl mb-2">🖊</span>
                              <span className="text-[10px] font-black uppercase tracking-widest">Initial Intent Undefined</span>
                            </div>
                          )}
                          {isAdmin && (
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                               <span className="text-[9px] font-black text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-lg uppercase tracking-widest border border-indigo-500/20">Edit Intel</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Meta grid */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Status */}
                    <div className="p-5 rounded-[24px] bg-white/[0.03] border border-white/5 flex flex-col justify-between h-24">
                      <p className="text-[9px] text-[var(--text-muted)] uppercase tracking-[0.2em] font-black opacity-60">Deployment State</p>
                      {isAdmin ? (
                        <select
                          value={task.status}
                          onChange={e => handleStatusChange(e.target.value)}
                          className="bg-transparent text-white font-black text-xs uppercase tracking-widest focus:outline-none cursor-pointer hover:text-indigo-400 transition-colors"
                        >
                          {STATUS_OPTS.map(s => <option key={s.value} value={s.value} className="bg-[#1a1a1a]">{s.label}</option>)}
                        </select>
                      ) : (
                        <span className="text-xs font-black uppercase tracking-widest text-white">{STATUS_OPTS.find(s => s.value === task.status)?.label}</span>
                      )}
                    </div>

                    {/* Priority */}
                    <div className="p-5 rounded-[24px] bg-white/[0.03] border border-white/5 flex flex-col justify-between h-24">
                      <p className="text-[9px] text-[var(--text-muted)] uppercase tracking-[0.2em] font-black opacity-60">Threat Level</p>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full shadow-[0_0_10px_currentColor]" style={{ color: priority.color, background: 'currentColor' }} />
                        <span className="text-xs font-black uppercase tracking-widest text-white">{priority.label.split(' ')[1]} Impact</span>
                      </div>
                    </div>

                    {/* Assignee */}
                    <div className="p-5 rounded-[24px] bg-white/[0.03] border border-white/5 flex flex-col justify-between h-24">
                      <p className="text-[9px] text-[var(--text-muted)] uppercase tracking-[0.2em] font-black opacity-60">Lead Specialist</p>
                      {task.assignedTo ? (
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-black shadow-xl border border-white/10"
                            style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
                            {task.assignedTo.name?.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs font-black text-white tracking-tight">{task.assignedTo.name}</span>
                        </div>
                      ) : (
                        <span className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest opacity-40">Open Protocol</span>
                      )}
                    </div>

                    {/* Due date */}
                    <div className="p-5 rounded-[24px] bg-white/[0.03] border border-white/5 flex flex-col justify-between h-24">
                      <p className="text-[9px] text-[var(--text-muted)] uppercase tracking-[0.2em] font-black opacity-60">Target Deadline</p>
                      {task.dueDate ? (
                        <div className="flex items-center gap-2">
                           <span className={`text-xs font-black uppercase tracking-widest ${isOverdue ? 'text-rose-500' : 'text-indigo-400'}`}>
                             {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                           </span>
                           {isOverdue && <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_#f43f5e]" />}
                        </div>
                      ) : (
                        <span className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest opacity-40">Infinite Window</span>
                      )}
                    </div>
                  </div>

                  {/* Time tracker */}
                  <div className="p-6 rounded-[28px] flex items-center justify-between border border-indigo-500/20 bg-indigo-500/[0.03] shadow-inner">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/20">
                         <span className="text-xl">⏱</span>
                      </div>
                      <div>
                        <p className="text-[9px] text-indigo-400/60 uppercase tracking-[0.3em] font-black">Active Pulse</p>
                        <p className="text-2xl font-black text-white mt-1 tabular-nums tracking-tighter">{formatTimer(timerSeconds)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setTimerActive(a => !a)}
                      className={`h-12 px-8 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 ${
                        timerActive
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30 shadow-[0_10px_20px_rgba(244,63,94,0.1)]'
                          : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-[0_10px_20px_rgba(99,102,241,0.2)]'
                      }`}
                    >
                      {timerActive ? (
                        <><div className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" /> Stop</>
                      ) : (
                        <>▶ Start</>
                      )}
                    </button>
                  </div>
                  
                  {/* Subtasks */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                      <div className="flex flex-col">
                        <p className="text-[9px] text-[var(--text-muted)] uppercase tracking-[0.2em] font-black opacity-60">Requirement Fragments</p>
                        <h4 className="text-xs font-black text-white uppercase tracking-widest mt-1">
                          Operational Logic <span className="text-indigo-400 ml-2">[{doneSubtasks}/{subtasks.length}]</span>
                        </h4>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {subtasks.length > 0 && (
                        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden p-[1px]">
                          <motion.div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-600 via-purple-500 to-emerald-400 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                            animate={{ width: `${subtaskProgress}%` }}
                            transition={{ type: 'spring', bounce: 0, duration: 0.8 }}
                          />
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <AnimatePresence mode='popLayout'>
                          {subtasks.map(sub => (
                            <motion.div 
                              key={sub._id}
                              layout
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className="flex items-center gap-4 group p-3 hover:bg-white/[0.03] rounded-2xl transition-all border border-transparent hover:border-white/5"
                            >
                              <button
                                onClick={() => handleToggleSubtask(sub._id)}
                                className={`w-5 h-5 rounded-lg flex-shrink-0 flex items-center justify-center transition-all border-2 ${
                                  sub.done ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'border-white/10 hover:border-indigo-500/40'
                                }`}
                              >
                                {sub.done && <span className="text-[10px] font-black">✓</span>}
                              </button>
                              <span className={`text-[13px] font-medium flex-1 transition-all ${sub.done ? 'line-through text-[var(--text-muted)] opacity-50' : 'text-white'}`}>
                                {sub.title}
                              </span>
                              <button
                                onClick={() => handleDeleteSubtask(sub._id)}
                                className="opacity-0 group-hover:opacity-100 p-2 text-[var(--text-muted)] hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                              >✕</button>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>

                      {/* Add subtask */}
                      <div className="flex gap-3 mt-4 pt-2 group/add">
                        <div className="flex-1 relative">
                          <input
                            value={newSubtask}
                            onChange={e => setNewSubtask(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddSubtask()}
                            placeholder="Add next requirement fragment..."
                            className="w-full bg-white/5 border border-white/5 focus:border-indigo-500/40 rounded-2xl py-3 px-5 text-[13px] text-white placeholder:text-[var(--text-muted)]/40 transition-all font-medium"
                          />
                        </div>
                        <button
                          onClick={handleAddSubtask}
                          disabled={addingSubtask || !newSubtask.trim()}
                          className="h-[46px] px-6 rounded-2xl bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-20 border border-white/5"
                        >
                          {addingSubtask ? 'Syncing...' : '+ Integrate'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Tabs for Comments / Activity */}
                  <div className="pt-10 border-t border-white/5">
                    <div className="flex gap-8 mb-8 border-b border-white/5">
                      {['comments', 'activity'].map(t => (
                        <button
                          key={t}
                          onClick={() => setTab(t)}
                          className={`pb-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${
                            tab === t ? 'text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] opacity-60 hover:opacity-100'
                          }`}
                        >
                          {t}
                          {tab === t && (
                            <motion.div layoutId="task-tab" className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,1)] rounded-t-full" />
                          )}
                        </button>
                      ))}
                    </div>

                    {tab === 'comments' ? (
                      <div className="space-y-8 pb-10">
                        <div className="space-y-6">
                          {comments.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12 opacity-20">
                               <span className="text-4xl mb-4">🧊</span>
                               <p className="text-[10px] font-black uppercase tracking-[0.3em]">Communication Channel Void</p>
                            </div>
                          )}
                          <AnimatePresence mode='popLayout'>
                            {comments.map(c => (
                              <motion.div 
                                key={c._id} 
                                layout
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex gap-4 group/comment"
                              >
                                <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-[10px] font-black shadow-2xl border border-white/10"
                                  style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
                                  {c.user?.name?.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <span className="font-black text-white text-[11px] uppercase tracking-tight">{c.user?.name}</span>
                                      <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-tighter opacity-40">
                                        {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                                      </span>
                                    </div>
                                    <div className="w-1.5 h-1.5 rounded-full bg-white/5 group-hover/comment:bg-indigo-500 transition-colors" />
                                  </div>
                                  <div className="p-4 rounded-[20px] bg-white/[0.03] border border-white/5 text-[13px] text-[var(--text-secondary)] font-medium leading-relaxed group-hover/comment:bg-white/[0.05] group-hover/comment:border-white/10 transition-all">
                                    {c.text}
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>

                        {/* Add comment area */}
                        <div className="pt-6 border-t border-white/5">
                          <div className="flex gap-4">
                            <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-[10px] font-black shadow-2xl border border-white/10"
                              style={{ background: 'linear-gradient(135deg, #1f2937, #111827)' }}>
                              {user?.name?.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 space-y-3">
                              <textarea
                                ref={commentRef}
                                rows={2}
                                value={newComment}
                                onChange={e => setNewComment(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAddComment(); }}
                                placeholder="Transmit intel... (⌘+Enter)"
                                className="w-full bg-white/5 border border-white/5 focus:border-indigo-500/40 rounded-2xl py-4 px-5 text-[13px] text-white placeholder:text-[var(--text-muted)]/40 transition-all font-medium resize-none"
                              />
                              <div className="flex justify-between items-center">
                                <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-30 italic">Secure Transmission active</p>
                                <button
                                  onClick={handleAddComment}
                                  disabled={submitting || !newComment.trim()}
                                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-20"
                                >
                                  {submitting ? 'Transmitting...' : 'Broadcast Intel'}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="pb-10">
                        <ActivityFeed activities={activities} />
                      </div>
                    )}
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
