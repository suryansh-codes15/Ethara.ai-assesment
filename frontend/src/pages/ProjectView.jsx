import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import confetti from 'canvas-confetti';
import { projectsAPI, tasksAPI, authAPI } from '../api';
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
  const socket = useSocket();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  // Slide over
  const [selectedTaskId, setSelectedTaskId] = useState(null);

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
    } catch { /* silent */ }
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
      const payload = { ...taskForm, project: id, assignedTo: taskForm.assignedTo || null, dueDate: taskForm.dueDate || null };
      if (editTask) {
        await tasksAPI.update(editTask._id, payload);
      } else {
        await tasksAPI.create(payload);
      }
      setTaskModal(false);
      fetchAll();
    } catch { /* silent */ }
    finally { setSubmitting(false); }
  };

  const handleInlineAdd = async (status) => {
    if (!inlineTitle.trim()) { setInlineCol(null); return; }
    try {
      await tasksAPI.create({ title: inlineTitle.trim(), project: id, status, priority: 'medium' });
      setInlineTitle('');
      setInlineCol(null);
      fetchAll();
    } catch { /* silent */ }
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
  const nonMembers = allUsers.filter(u => !project?.members?.some(m => m._id === u._id));
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
    <div className="space-y-5">
      {/* Breadcrumb + Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <Link to="/projects" className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
          ← Projects
        </Link>
        <div className="flex items-start justify-between mt-2 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full" style={{ background: accentColor, boxShadow: `0 0 8px ${accentColor}` }} />
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">{project.name}</h1>
              <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                style={{ background: `${accentColor}20`, color: accentColor, border: `1px solid ${accentColor}40` }}>
                {project.status}
              </span>
              <button 
                onClick={handleSummarize}
                disabled={summarizing}
                className="ml-2 p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-800/50 transition-colors disabled:opacity-50"
                title="AI Project Summary"
              >
                {summarizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
              </button>
            </div>
            {project.description && <p className="text-sm text-[var(--text-muted)] mt-1 ml-6">{project.description}</p>}
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <AIAssistant 
              projectId={id} 
              projectName={project.name} 
              projectDescription={project.description} 
              onTasksGenerated={fetchAll} 
            />
            {isAdmin && (
              <>
                <button onClick={() => setMemberModal(true)} className="btn-secondary text-sm py-2">👥 Members</button>
                <button onClick={() => openCreateTask()} className="btn-primary text-sm py-2">+ Task</button>
              </>
            )}
          </div>
        </div>

        {/* AI Project Summary */}
        <AnimatePresence>
          {projectSummary && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }} 
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4">
                 <button onClick={() => setProjectSummary('')} className="text-indigo-400 hover:text-indigo-600">✕</button>
              </div>
              <div className="flex gap-3">
                 <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-800 flex items-center justify-center flex-shrink-0">
                    <Brain className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                 </div>
                 <div>
                    <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
                       AI Executive Summary
                       <Sparkles className="w-3 h-3 animate-pulse" />
                    </h4>
                    <p className="text-sm text-indigo-800 dark:text-indigo-400 mt-1 leading-relaxed">{projectSummary}</p>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Stats bar */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="card p-4 flex items-center gap-6">
        <div className="flex -space-x-2">
          {project.members?.map(m => (
            <div key={m._id} title={m.name}
              className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-white text-xs font-bold"
              style={{ borderColor: 'var(--surface-2)', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              {m.name?.charAt(0)}
            </div>
          ))}
        </div>
        <div className="divider h-6 w-px" style={{ height: '24px', width: '1px' }} />
        <div className="text-sm text-[var(--text-muted)]">
          <span className="text-[var(--text-primary)] font-semibold">{totalTasks}</span> tasks ·{' '}
          <span className="text-emerald-400 font-semibold">{doneTasks}</span> done
        </div>
        <div className="flex-1 h-1.5 rounded-full overflow-hidden max-w-[200px]" style={{ background: 'var(--surface-4)' }}>
          <motion.div className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${accentColor}, ${accentColor}88)` }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, delay: 0.3 }}
          />
        </div>
        <span className="text-sm font-bold" style={{ color: accentColor }}>{pct}%</span>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex rounded-xl overflow-hidden border border-[var(--border)]" style={{ background: 'var(--surface-2)' }}>
          {['all', ...STATUSES].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className="px-3 py-2 text-xs font-medium transition-all"
              style={{
                background: filterStatus === s ? 'var(--brand-primary)' : 'transparent',
                color: filterStatus === s ? 'white' : 'var(--text-muted)',
              }}>
              {s === 'all' ? 'All' : STATUS_META[s]?.label}
            </button>
          ))}
        </div>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
          className="input w-auto py-2 text-xs">
          <option value="all">All Priorities</option>
          <option value="high">🔴 High</option>
          <option value="medium">🟡 Medium</option>
          <option value="low">🔵 Low</option>
        </select>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {STATUSES.map(status => {
            const colTasks = tasksByStatus(status);
            const meta = STATUS_META[status];

            return (
              <div key={status}>
                {/* Column header */}
                <div className="flex items-center justify-between px-1 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: meta.color }} />
                    <h3 className="text-sm font-semibold text-[var(--text-secondary)]">{meta.label}</h3>
                    <motion.span
                      key={colTasks.length}
                      initial={{ scale: 1.4 }}
                      animate={{ scale: 1 }}
                      className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: meta.bg, color: meta.color }}
                    >
                      {colTasks.length}
                    </motion.span>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => openCreateTask(status)}
                      className="btn-ghost p-1 text-sm"
                      title={`Add to ${meta.label}`}
                    >+</button>
                  )}
                </div>

                {/* Droppable column */}
                <Droppable droppableId={status}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="rounded-2xl p-2 min-h-[200px] transition-all duration-200"
                      style={{
                        background: snapshot.isDraggingOver ? meta.bg : 'rgba(255,255,255,0.01)',
                        border: `1px solid ${snapshot.isDraggingOver ? meta.color + '40' : 'var(--border)'}`,
                      }}
                    >
                      <AnimatePresence>
                        {colTasks.length === 0 && !snapshot.isDraggingOver ? (
                          <div className="flex flex-col items-center justify-center py-10 text-center dot-grid rounded-xl h-36">
                            <p className="text-2xl mb-2 opacity-40">{status === 'todo' ? '📝' : status === 'in-progress' ? '⚡' : '✓'}</p>
                            <p className="text-xs text-[var(--text-muted)]">
                              {isAdmin ? `Drop here or click + to add` : 'No tasks'}
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {colTasks.map((task, i) => (
                              <Draggable key={task._id} draggableId={task._id} index={i} isDragDisabled={!isAdmin}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    style={{
                                      ...provided.draggableProps.style,
                                      transform: snapshot.isDragging
                                        ? `${provided.draggableProps.style?.transform} rotate(2deg)`
                                        : provided.draggableProps.style?.transform,
                                      opacity: snapshot.isDragging ? 0.85 : 1,
                                    }}
                                  >
                                    <TaskCard
                                      task={task}
                                      index={i}
                                      onStatusChange={handleStatusChange}
                                      onDelete={handleDeleteTask}
                                      onEdit={openEditTask}
                                      onClick={(t) => setSelectedTaskId(t._id)}
                                    />
                                  </div>
                                )}
                              </Draggable>
                            ))}
                          </div>
                        )}
                      </AnimatePresence>
                      {provided.placeholder}

                      {/* Inline add */}
                      {isAdmin && (
                        <div className="mt-2">
                          {inlineCol === status ? (
                            <div className="flex flex-col gap-1.5">
                              <input
                                autoFocus
                                value={inlineTitle}
                                onChange={e => setInlineTitle(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') handleInlineAdd(status);
                                  if (e.key === 'Escape') { setInlineCol(null); setInlineTitle(''); }
                                }}
                                placeholder="Task title..."
                                className="input text-xs py-2"
                              />
                              <div className="flex gap-1.5">
                                <button onClick={() => handleInlineAdd(status)} className="btn-primary text-xs py-1.5 flex-1">Add</button>
                                <button onClick={() => { setInlineCol(null); setInlineTitle(''); }} className="btn-secondary text-xs py-1.5">✕</button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setInlineCol(status); setInlineTitle(''); }}
                              className="w-full text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] py-2 rounded-xl hover:bg-white/[0.03] transition-all flex items-center justify-center gap-1"
                            >
                              <span>+</span> Add task
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* Task Create/Edit Modal */}
      <Modal isOpen={taskModal} onClose={() => setTaskModal(false)} title={editTask ? 'Edit Task' : 'New Task'} size="lg">
        <form onSubmit={handleTaskSubmit} className="space-y-4">
          <div>
            <label className="label">Task title *</label>
            <input className="input" placeholder="e.g. Design landing page hero section" value={taskForm.title}
              onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} required minLength={2} />
          </div>
          <div>
            <label className="label">Description</label>
            <RichTextEditor 
              content={taskForm.description} 
              onChange={(html) => setTaskForm({ ...taskForm, description: html })} 
              placeholder="What needs to be done? Use / for commands..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Assign to</label>
              <select className="input" value={taskForm.assignedTo} onChange={e => setTaskForm({ ...taskForm, assignedTo: e.target.value })}>
                <option value="">Unassigned</option>
                {project.members?.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={taskForm.status} onChange={e => setTaskForm({ ...taskForm, status: e.target.value })}>
                <option value="todo">📝 To Do</option>
                <option value="in-progress">⚡ In Progress</option>
                <option value="done">✅ Done</option>
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select className="input" value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}>
                <option value="low">🔵 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🔴 High</option>
              </select>
            </div>
            <div>
              <label className="label">Due date</label>
              <input type="date" className="input" value={taskForm.dueDate}
                onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setTaskModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1 justify-center">
              {submitting ? 'Saving...' : editTask ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Members Modal */}
      <Modal isOpen={memberModal} onClose={() => setMemberModal(false)} title="Manage Members">
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-3">Current Members</p>
            <div className="space-y-2">
              {project.members?.map(m => (
                <div key={m._id} className="flex items-center justify-between p-3 rounded-xl"
                  style={{ background: 'var(--surface-3)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                      {m.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{m.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">{m.email} · {m.role}</p>
                    </div>
                  </div>
                  {m._id !== project.createdBy?._id && isAdmin && (
                    <button onClick={() => handleRemoveMember(m._id)} className="btn-ghost text-xs text-red-400 hover:text-red-300">
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {nonMembers.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-2">Add Member</p>
              <div className="flex gap-2">
                <select className="input flex-1" value={selectedUser} onChange={e => setSelectedUser(e.target.value)}>
                  <option value="">Select a user...</option>
                  {nonMembers.map(u => <option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}
                </select>
                <button onClick={handleAddMember} disabled={!selectedUser} className="btn-primary">Add</button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Task Slide Over */}
      <TaskSlideOver
        taskId={selectedTaskId}
        open={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        onUpdated={fetchAll}
      />
    </div>
  );
}
