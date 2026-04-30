import { formatDistanceToNow } from 'date-fns';

export default function ActivityFeed({ activities = [], loading = false }) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-[var(--surface-3)]" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-[var(--surface-3)] rounded w-3/4" />
              <div className="h-2 bg-[var(--surface-3)] rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-[var(--text-muted)] text-sm italic dot-grid rounded-xl">
        No recent activity.
      </div>
    );
  }

  const getActionLabel = (action) => {
    switch (action) {
      case 'created': return 'created this task';
      case 'status_change': return 'updated status';
      case 'assignment': return 'assigned task';
      case 'comment': return 'commented';
      default: return action;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'created': return 'text-indigo-400';
      case 'status_change': return 'text-amber-400';
      case 'comment': return 'text-sky-400';
      default: return 'text-[var(--text-secondary)]';
    }
  };

  return (
    <div className="space-y-4">
      {activities.map((item, idx) => (
        <div key={item._id || idx} className="flex gap-3 relative">
          {idx !== activities.length - 1 && (
            <div className="absolute left-[15px] top-8 bottom-[-16px] w-px bg-[var(--border)]" />
          )}
          <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold z-10"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: '2px solid var(--surface-1)' }}>
            {item.user?.name?.charAt(0) || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-[var(--text-secondary)]">
              <span className="font-bold text-[var(--text-primary)]">{item.user?.name || 'Someone'}</span>{' '}
              <span className={getActionColor(item.action)}>{getActionLabel(item.action)}</span>
            </p>
            {item.details && (
              <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-1">{item.details}</p>
            )}
            <p className="text-[10px] text-[var(--text-muted)] mt-1 uppercase font-mono">
              {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
