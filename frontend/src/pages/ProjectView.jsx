import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import confetti from 'canvas-confetti';
import api, { projectsAPI, tasksAPI, authAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { toast } from 'react-hot-toast';
import Modal from '../components/Modal';
import TaskCard from '../components/TaskCard';
import TaskSlideOver from '../components/TaskSlideOver';
import SkeletonLoader from '../components/SkeletonLoader';
import RichTextEditor from '../components/RichTextEditor';
import { format } from 'date-fns';
import AIAssistant from '../components/AIAssistant';
import { Sparkles, Brain, Loader2 } from 'lucide-react';

import ChatPanel from '../components/ChatPanel';

const STATUSES = ['todo', 'in-progress', 'done'];
const STATUS_META = {
  todo:        { label: '📝 To Do',      color: '#94a3b8', bg: 'rgba(148,163,184,0.08)' },
  'in-progress': { label: '⚡ In Progress', color: '#fbbf24', bg: 'rgba(245,158,11,0.08)' },
  done:        { label: '✅ Done',        color: '#34d399', bg: 'rgba(16,185,129,0.08)' },
};

const fireConfetti = () => {
  confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, colors: ['#6366f1', '#8b5cf6', '#10b981', '#fbbf24'] });
};

export default function ProjectView() {
  const { id } = useParams();
  const { isAdmin, user } = useAuth();
  const { socket } = useSocket();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  // Sidebars
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [showChat, setShowChat] = useState(false);

  // Task modal
  const [taskModal, setTaskModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [taskForm, setTaskForm] = useState({
    title: '', description: '', assignedTo: '', status: 'todo', priority: 'medium', dueDate: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [projectSummary, setProjectSummary] = useState('');
  const [summarizing, setSummarizing] = useState(false);

  // Inline add task
  const [inlineCol, setInlineCol] = useState(null);
  const [inlineTitle, setInlineTitle] = useState('');

  // Member modal
  const [memberModal, setMemberModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');

  const fetchAll = async () => {
    try {
      const [projRes, tasksRes] = await Promise.all([
        projectsAPI.getOne(id),
        tasksAPI.getAll({ project: id }),
      ]);
      setProject(projRes.data.project);
      setTasks(tasksRes.data.tasks);
      
      // Auto-select task from URL
      const params = new URLSearchParams(window.location.search);
      const taskId = params.get('task');
      if (taskId) setSelectedTaskId(taskId);

      if (isAdmin) {
        const usersRes = await authAPI.getAllUsers();
        setAllUsers(usersRes.data.users);
      }
    } catch (err) {
      console.error("FetchAll failed:", err);
    }
    finally { setLoading(false); }
  };

  useEffect(() => { 
    fetchAll(); 
    if (socket && id) {
      socket.emit('join-project', id);
      
      socket.on('task-created', (newTask) => {
        setTasks(ts => [newTask, ...ts]);
        toast.success(`New task: ${newTask.title}`, { icon: '📝', duration: 3000 });
      });

      socket.on('task-updated', (updatedTask) => {
        setTasks(ts => ts.map(t => t._id === updatedTask._id ? updatedTask : t));
      });

      socket.on('task-deleted', (taskId) => {
        setTasks(ts => ts.filter(t => t._id !== taskId));
      });

      return () => {
        socket.emit('leave-project', id);
        socket.off('task-created');
        socket.off('task-updated');
        socket.off('task-deleted');
      };
    }
  }, [id, socket]);

  const openCreateTask = (status = 'todo') => {
    setEditTask(null);
    setTaskForm({ title: '', description: '', assignedTo: '', status, priority: 'medium', dueDate: '' });
    setTaskModal(true);
  };

  const openEditTask = (task) => {
    setEditTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      assignedTo: task.assignedTo?._id || '',
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '',
    });
    setTaskModal(true);
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { 
        ...taskForm, 
        assignedTo: taskForm.assignedTo || null, 
        dueDate: taskForm.dueDate || null 
      };

      if (editTask) {
        // Remove 'project' from update payload to satisfy Joi validation
        const { project, ...updatePayload } = payload;
        await tasksAPI.update(editTask._id, updatePayload);
      } else {
        await tasksAPI.create({ ...payload, project: id });
      }
      setTaskModal(false);
      fetchAll();
    } catch (err) {
      console.error("Task submit failed:", err);
    }
    finally { setSubmitting(false); }
  };

  const handleInlineAdd = async (status) => {
    if (!inlineTitle.trim()) { setInlineCol(null); return; }
    try {
      await tasksAPI.create({ title: inlineTitle.trim(), project: id, status, priority: 'medium' });
      setInlineTitle('');
      setInlineCol(null);
      fetchAll();
    } catch (err) {
      console.error("Inline add failed:", err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try {
      await tasksAPI.delete(taskId);
      fetchAll();
    } catch { /* silent */ }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    // Optimistic update
    setTasks(ts => ts.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
    try {
      await tasksAPI.update(taskId, { status: newStatus });
      if (newStatus === 'done') fireConfetti();
    } catch { fetchAll(); }
  };

  const handleSummarize = async () => {
    setSummarizing(true);
    try {
      const { data } = await api.post('/ai/summarize-project', { projectId: id });
      setProjectSummary(data.summary);
      toast.success("Executive summary generated!");
    } catch {
      toast.error("AI summary failed");
    } finally {
      setSummarizing(false);
    }
  };

  // Drag and drop
  const onDragEnd = useCallback(async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) return;

    const sourceStatus = source.droppableId;
    const destStatus = destination.droppableId;

    // Create a copy of all tasks
    const newTasks = [...tasks];
    
    // Separate tasks by status
    const colTasks = {
      todo: tasks.filter(t => t.status === 'todo').sort((a, b) => (a.order || 0) - (b.order || 0)),
      'in-progress': tasks.filter(t => t.status === 'in-progress').sort((a, b) => (a.order || 0) - (b.order || 0)),
      done: tasks.filter(t => t.status === 'done').sort((a, b) => (a.order || 0) - (b.order || 0)),
    };

    // Remove from source
    const [movedTask] = colTasks[sourceStatus].splice(source.index, 1);
    movedTask.status = destStatus;
    
    // Insert into destination
    colTasks[destStatus].splice(destination.index, 0, movedTask);

    // Re-calculate orders for affected columns
    const updatedStatusTasks = [];
    
    // Just update the moved task and its neighbors in the dest column for simplicity in API
    // Or update everything in both columns to be safe
    [sourceStatus, destStatus].forEach(status => {
      colTasks[status].forEach((t, idx) => {
        t.order = idx;
        updatedStatusTasks.push({ id: t._id, status: t.status, order: t.order });
      });
    });

    // Optimistic Update
    setTasks(prev => {
      const filtered = prev.filter(t => t._id !== movedTask._id);
      // We need to rebuild the full list with new statuses and orders
      // For simplicity, let's just use the logic from colTasks
      return Object.values(colTasks).flat();
    });

    try {
      await tasksAPI.reorder(updatedStatusTasks);
      if (destStatus === 'done' && sourceStatus !== 'done') fireConfetti();
    } catch {
      fetchAll();
      toast.error('Failed to save task order');
    }
  }, [tasks]);

  const handleAddMember = async () => {
    if (!selectedUser) return;
    try {
      await projectsAPI.addMember(id, selectedUser);
      setSelectedUser('');
      setMemberModal(false);
      fetchAll();
    } catch { /* silent */ }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm('Remove this member from the project?')) return;
    try {
      await projectsAPI.removeMember(id, userId);
      fetchAll();
    } catch { /* silent */ }
  };

  const filteredTasks = tasks.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    return true;
  });

  const tasksByStatus = (status) => filteredTasks.filter(t => t.status === status);
  const nonMembers = (allUsers || []).filter(u => !project?.members?.some(m => m._id === u._id || m.id === u.id));
  const accentColor = project?.color || '#6366f1';
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.status === 'done').length;
  const pct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-8 w-64 rounded-xl" />
        <div className="skeleton h-16 rounded-xl" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(9)].map((_, i) => <SkeletonLoader key={i} type="task" />)}
        </div>
      </div>
    );
  }

  if (!project) return (
    <div className="flex flex-col items-center justify-center h-64 text-[var(--text-muted)] dot-grid rounded-2xl">
      <p className="text-3xl mb-3">◈</p>
      <p className="font-semibold text-[var(--text-secondary)]">Project not found.</p>
      <Link to="/projects" className="btn-secondary mt-4">← Back to Projects</Link>
    </div>
  );

  return (
    <div className="space-y-8 animate-slide-up pb-10">
      {/* Dynamic Background Glow */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] rounded-full blur-[120px] opacity-10 pointer-events-none" 
           style={{ background: accentColor }} />

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <Link to="/projects" className="group flex items-center gap-2 text-xs font-bold text-[var(--text-muted)] hover:text-indigo-400 transition-all mb-4 uppercase tracking-widest">
            <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Projects
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl relative group overflow-hidden" 
                 style={{ background: `linear-gradient(135deg, ${accentColor}, #000)` }}>
              <span className="text-2xl font-black text-white relative z-10">{project.name?.charAt(0).toUpperCase()}</span>
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">{project.name}</h1>
                <div className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10 glass-premium" 
                     style={{ color: accentColor }}>
                  {project.status}
                </div>
              </div>
              {project.description && (
                <p className="text-sm text-[var(--text-muted)] mt-1.5 font-medium max-w-xl leading-relaxed">
                  {project.description}
                </p>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
          <AIAssistant 
            projectId={id} 
            projectName={project.name} 
            projectDescription={project.description} 
            onTasksGenerated={fetchAll} 
          />
          <div className="h-10 w-px bg-white/10 mx-2 hidden md:block" />
          <button onClick={() => setShowChat(true)} className="btn-secondary py-2.5 px-4 flex items-center gap-2 group">
            <span className="group-hover:scale-125 transition-transform">💬</span>
            <span className="text-sm font-bold uppercase tracking-wider">Chat</span>
          </button>
          <button onClick={() => setMemberModal(true)} className="btn-secondary py-2.5 px-4 group">
             <span className="group-hover:scale-110 transition-transform">👥</span>
          </button>
          <button onClick={() => openCreateTask()} className="btn-primary py-2.5 px-6 shadow-indigo-500/20 group">
            <span className="group-hover:rotate-90 transition-transform inline-block">+</span>
            <span className="text-sm font-bold uppercase tracking-wider ml-1">New Task</span>
          </button>
        </motion.div>
      </div>

      {/* Overview Stats + AI Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Summary */}
        <div className="lg:col-span-8 h-full">
          <AnimatePresence mode="wait">
            {projectSummary ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-premium rounded-[32px] p-8 relative overflow-hidden group border-white/10 glow-pulse"
              >
                <div className="absolute top-0 right-0 p-6 z-20">
                   <button onClick={() => setProjectSummary('')} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all text-[var(--text-muted)]">✕</button>
                </div>
                
                {/* Background Decoration */}
                <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px]" />
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />

                <div className="flex gap-6 relative z-10">
                  <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-2xl animate-float">
                    <Brain className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <h4 className="text-lg font-black text-white tracking-tight uppercase tracking-[0.2em]">
                        AI Executive Intel
                      </h4>
                      <div className="flex gap-1">
                        {[1,2,3].map(i => (
                          <div key={i} className="w-1 h-1 rounded-full bg-indigo-400 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                        ))}
                      </div>
                    </div>
                    <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed font-medium">
                      {projectSummary}
                    </p>
                    <div className="flex items-center gap-6 mt-6 pt-6 border-t border-white/5">
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-emerald-500" />
                           <span className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Strategy Ready</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-amber-500" />
                           <span className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Optimized Plan</span>
                        </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSummarize}
                disabled={summarizing}
                className="w-full h-full min-h-[160px] glass-premium rounded-[32px] border-dashed border-white/10 flex flex-col items-center justify-center gap-4 group transition-all"
              >
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-indigo-500/20 transition-all">
                  {summarizing ? <Loader2 className="w-6 h-6 animate-spin text-indigo-400" /> : <Brain className="w-6 h-6 text-[var(--text-muted)] group-hover:text-indigo-400" />}
                </div>
                <div className="text-center">
                  <p className="text-sm font-black text-white uppercase tracking-widest">Generate Intel</p>
                  <p className="text-[10px] text-[var(--text-muted)] font-medium mt-1">AI-driven project health and priority analysis</p>
                </div>
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Stats */}
        <div className="lg:col-span-4 h-full">
           <div className="glass-premium rounded-[32px] p-8 h-full border-white/10 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-1">Velocity</p>
                  <h3 className="text-4xl font-black text-white">{pct}%</h3>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-black">
                   🚀
                </div>
              </div>
              
              <div className="my-8 relative h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex -space-x-2.5">
                  {project.members?.slice(0, 4).map(m => (
                    <div key={m._id} className="w-9 h-9 rounded-xl border-2 border-[var(--surface-1)] flex items-center justify-center text-white text-[10px] font-black shadow-xl"
                         style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
                      {m.name?.charAt(0).toUpperCase()}
                    </div>
                  ))}
                  {project.members?.length > 4 && (
                    <div className="w-9 h-9 rounded-xl border-2 border-[var(--surface-1)] bg-white/10 flex items-center justify-center text-[10px] font-black text-white">
                      +{project.members.length - 4}
                    </div>
                  )}
                </div>
                <div className="text-right">
                   <p className="text-xs font-bold text-white uppercase tracking-wider">{doneTasks} / {totalTasks}</p>
                   <p className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-widest">Milestones</p>
                </div>
              </div>
           </div>
        </div>
      </div>

      {/* Board View */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-6">
               <h3 className="text-sm font-black text-white uppercase tracking-[0.3em]">Sprint Board</h3>
               <div className="flex items-center gap-2 glass-premium rounded-full p-1 border-white/5">
                  {['all', ...STATUSES].map(s => (
                    <button key={s} onClick={() => setFilterStatus(s)}
                      className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                        filterStatus === s ? 'bg-white/10 text-white shadow-xl' : 'text-[var(--text-muted)] hover:text-white'
                      }`}>
                      {s}
                    </button>
                  ))}
               </div>
            </div>
            <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
              className="bg-transparent text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] outline-none cursor-pointer hover:text-white transition-colors">
              <option value="all">Priority: All</option>
              <option value="high">Priority: High</option>
              <option value="medium">Priority: Med</option>
              <option value="low">Priority: Low</option>
            </select>
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STATUSES.map(status => {
              const colTasks = tasksByStatus(status);
              const meta = STATUS_META[status];

              return (
                <div key={status} className="flex flex-col min-h-[600px]">
                  <div className="flex items-center justify-between px-3 py-4 glass-premium rounded-2xl border-white/5 mb-4 shadow-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.5)]" style={{ background: meta.color }} />
                      <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em]">{status.replace('-', ' ')}</h3>
                    </div>
                    <span className="text-[10px] font-black bg-white/5 px-2 py-0.5 rounded-md text-[var(--text-muted)]">
                      {colTasks.length}
                    </span>
                  </div>

                  <Droppable droppableId={status}>
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`flex-1 rounded-3xl transition-all duration-300 ${
                          snapshot.isDraggingOver ? 'bg-white/[0.03] scale-[0.99] ring-1 ring-white/10' : ''
                        }`}
                      >
                        <div className="space-y-4 p-1">
                          {colTasks.map((t, idx) => (
                            <Draggable key={t._id} draggableId={t._id} index={idx}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={snapshot.isDragging ? 'z-[100]' : ''}
                                >
                                  <TaskCard 
                                    task={t} 
                                    index={idx}
                                    onStatusChange={handleStatusChange}
                                    onDelete={handleDeleteTask}
                                    onEdit={openEditTask}
                                    onClick={setSelectedTaskId}
                                  />
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                          
                          {isAdmin && (
                            <motion.button 
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                              onClick={() => openCreateTask(status)}
                              className="w-full py-4 rounded-2xl border border-dashed border-white/5 hover:border-white/20 hover:bg-white/[0.02] text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest transition-all"
                            >
                              + New Milestone
                            </motion.button>
                          )}
                        </div>
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      </div>

      {/* Modals */}
      <Modal isOpen={taskModal} onClose={() => setTaskModal(false)} title={editTask ? 'Refine Milestone' : 'New Milestone'} size="lg">
        <form onSubmit={handleTaskSubmit} className="space-y-6">
          <div>
            <label className="label">Milestone Title</label>
            <input className="input !bg-white/5 border-white/10 focus:border-indigo-500" placeholder="Focus on the primary outcome..." value={taskForm.title}
              onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} required minLength={2} />
          </div>
          <div>
            <label className="label">Detailed Intent</label>
            <RichTextEditor 
              content={taskForm.description} 
              onChange={(html) => setTaskForm({ ...taskForm, description: html })} 
              placeholder="Strategic details and requirements..."
            />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="label">Ownership</label>
              <select className="input !bg-white/5 border-white/10" value={taskForm.assignedTo} onChange={e => setTaskForm({ ...taskForm, assignedTo: e.target.value })}>
                <option value="">Reserve for future</option>
                {project.members?.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input !bg-white/5 border-white/10" value={taskForm.status} onChange={e => setTaskForm({ ...taskForm, status: e.target.value })}>
                <option value="todo">📝 Strategy</option>
                <option value="in-progress">⚡ Execution</option>
                <option value="done">✅ Finalized</option>
              </select>
            </div>
            <div>
              <label className="label">Priority Intel</label>
              <select className="input !bg-white/5 border-white/10" value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}>
                <option value="low">🔵 Low Impact</option>
                <option value="medium">🟡 Standard</option>
                <option value="high">🔴 Mission Critical</option>
              </select>
            </div>
            <div>
              <label className="label">Target Date</label>
              <input type="date" className="input !bg-white/5 border-white/10" value={taskForm.dueDate}
                onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-4 pt-4">
            <button type="button" onClick={() => setTaskModal(false)} className="btn-secondary flex-1 justify-center py-3 uppercase tracking-widest text-[10px] font-black">Abort</button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1 justify-center py-3 uppercase tracking-widest text-[10px] font-black shadow-indigo-500/20">
              {submitting ? 'Syncing...' : editTask ? 'Refine' : 'Deploy'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Members Modal */}
      <Modal isOpen={memberModal} onClose={() => setMemberModal(false)} title="Operational Team">
        <div className="space-y-6">
          <div>
            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-4">Core Personnel</p>
            <div className="space-y-3">
              {project.members?.map(m => (
                <div key={m._id} className="flex items-center justify-between p-4 rounded-2xl glass-premium border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-xl"
                      style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                      {m.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-black text-white">{m.name}</p>
                      <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{m.role}</p>
                    </div>
                  </div>
                  {m._id !== project.createdBy?._id && isAdmin && (
                    <button onClick={() => handleRemoveMember(m._id)} className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all text-[10px]">
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {nonMembers.length > 0 && (
            <div className="pt-6 border-t border-white/5">
              <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-4">Recruit Member</p>
              <div className="flex gap-2">
                <select className="input flex-1 !bg-white/5 border-white/10 text-xs" value={selectedUser} onChange={e => setSelectedUser(e.target.value)}>
                  <option value="">Select individual...</option>
                  {nonMembers.map(u => <option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}
                </select>
                <button onClick={handleAddMember} disabled={!selectedUser} className="btn-primary py-2 px-6 text-[10px] font-black uppercase tracking-widest">Add</button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <TaskSlideOver
        taskId={selectedTaskId}
        open={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        onUpdated={fetchAll}
      />

      <ChatPanel
        projectId={id}
        open={showChat}
        onClose={() => setShowChat(false)}
      />
    </div>
  );
}
