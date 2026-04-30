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
      className="group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-200"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${borderColor}`,
      }}
      whileHover={{ y: -2, boxShadow: `0 8px 32px rgba(0,0,0,0.3), -2px 0 0 ${borderColor}` }}
    >
      <div className="p-3.5">
        {/* Top row: title + actions */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <p className="text-sm font-semibold text-[var(--text-primary)] leading-snug flex-1 line-clamp-2">
            {task.title}
          </p>
          {/* Action buttons — visible on hover */}
          <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            {canEdit && (
              <button
                onClick={e => { e.stopPropagation(); onEdit?.(task); }}
                className="w-6 h-6 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-white/10 transition-all text-xs"
                title="Edit task"
              >✏</button>
            )}
            {isAdmin && (
              <button
                onClick={e => { e.stopPropagation(); onDelete?.(task._id); }}
                className="w-6 h-6 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-all text-xs"
                title="Delete task"
              >✕</button>
            )}
          </div>
        </div>

        {/* Tags / description snippet */}
        {task.description && (
          <p className="text-xs text-[var(--text-muted)] line-clamp-1 mb-2">{task.description}</p>
        )}

        {/* Footer row */}
        <div className="flex items-center justify-between mt-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
          {/* Status badge — clickable */}
          <button
            onClick={e => { e.stopPropagation(); if (canEdit) onStatusChange?.(task._id, STATUS_NEXT[task.status]); }}
            className={`badge-${task.status} text-[10px] transition-all ${canEdit ? 'hover:opacity-80 cursor-pointer' : 'cursor-default'}`}
            title={canEdit ? `Move to: ${STATUS_LABELS[STATUS_NEXT[task.status]]}` : undefined}
          >
            {STATUS_LABELS[task.status]}
          </button>

          <div className="flex items-center gap-2">
            {/* Due date */}
            {task.dueDate && (
              <span className={`text-[10px] font-medium ${isOverdue ? 'text-red-400 animate-overdue' : 'text-[var(--text-muted)]'}`}>
                {isOverdue ? '⚠ ' : ''}{format(new Date(task.dueDate), 'MMM d')}
              </span>
            )}

            {/* Assignee avatar */}
            {task.assignedTo && (
              <div
                title={task.assignedTo.name}
                className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
              >
                {task.assignedTo.name?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Priority indicator glow at top */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px] opacity-40"
        style={{ background: `linear-gradient(90deg, ${borderColor}80, transparent)` }}
      />
    </motion.div>
  );
}
