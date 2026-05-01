import { motion } from 'framer-motion';
import { isPast, format, formatDistanceToNow } from 'date-fns';
import { useAuth } from '../context/AuthContext';

const PRIORITY_BORDERS = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#3b82f6',
};

const STATUS_NEXT = { todo: 'in-progress', 'in-progress': 'done', done: 'todo' };
const STATUS_LABELS = { todo: '📝 To Do', 'in-progress': '⚡ In Progress', done: '✅ Done' };

export default function TaskCard({ task, onStatusChange, onDelete, onEdit, onClick, index = 0 }) {
  const { user, isAdmin } = useAuth();

  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'done';
  const isAssigned = task.assignedTo?._id === user?._id || task.assignedTo?.id === user?.id;
  const canEdit = isAdmin || isAssigned;
  const borderColor = PRIORITY_BORDERS[task.priority] || PRIORITY_BORDERS.medium;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
      onClick={() => onClick?.(task)}
      className="group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 glass-premium hover:glow-pulse"
      style={{
        borderLeft: `4px solid ${borderColor}`,
      }}
      whileHover={{ 
        y: -4, 
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderColor: borderColor,
        transition: { duration: 0.2 }
      }}
    >
      <div className="p-4">
        {/* Top row: title + actions */}
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <p className="text-[13px] font-bold text-[var(--text-primary)] leading-relaxed flex-1 tracking-tight group-hover:text-indigo-300 transition-colors">
            {task.title}
          </p>
          <div className="flex items-center gap-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
            {canEdit && (
              <button
                onClick={e => { e.stopPropagation(); onEdit?.(task); }}
                className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/5 text-[var(--text-muted)] hover:text-white hover:bg-indigo-500/20 transition-all text-[10px]"
                title="Edit task"
              >✏</button>
            )}
            {isAdmin && (
              <button
                onClick={e => { e.stopPropagation(); onDelete?.(task._id); }}
                className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/5 text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/20 transition-all text-[10px]"
                title="Delete task"
              >✕</button>
            )}
          </div>
        </div>

        {/* Tags / description snippet */}
        {task.description && (
          <div 
            className="text-[11px] text-[var(--text-muted)] line-clamp-2 mb-3 leading-relaxed font-medium" 
            dangerouslySetInnerHTML={{ __html: task.description.substring(0, 80) + (task.description.length > 80 ? '...' : '') }} 
          />
        )}

        {/* Footer row */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.05]">
          <div className="flex items-center gap-2">
            <button
              onClick={e => { e.stopPropagation(); if (canEdit) onStatusChange?.(task._id, STATUS_NEXT[task.status]); }}
              className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all ${
                task.status === 'done' ? 'bg-emerald-500/20 text-emerald-400' :
                task.status === 'in-progress' ? 'bg-amber-500/20 text-amber-400' :
                'bg-slate-500/20 text-slate-400'
              } ${canEdit ? 'hover:scale-105 cursor-pointer' : 'cursor-default'}`}
            >
              {task.status.replace('-', ' ')}
            </button>
            
            {task.dueDate && (
              <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md ${isOverdue ? 'bg-red-500/10 text-red-400 animate-pulse' : 'text-[var(--text-muted)]'}`}>
                 <span className="text-[10px]">🕒</span>
                 <span className="text-[9px] font-bold uppercase tracking-tighter">
                  {format(new Date(task.dueDate), 'MMM d')}
                </span>
              </div>
            )}
          </div>

          {task.assignedTo && (
            <div className="relative group/avatar">
              <div
                title={task.assignedTo.name}
                className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-[10px] font-black shadow-lg ring-2 ring-white/5 group-hover/avatar:ring-indigo-500/50 transition-all"
                style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}
              >
                {task.assignedTo.name?.charAt(0).toUpperCase()}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
