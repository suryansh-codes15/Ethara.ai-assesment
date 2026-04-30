import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { notificationsAPI } from '../api';
import { formatDistanceToNow } from 'date-fns';

const NOTIF_ICONS = {
  task_assigned: '📌',
  comment: '💬',
  due_soon: '⏰',
  overdue: '🔥',
  default: '🔔',
};

export default function NotificationsPanel({ open, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifs = async () => {
    setLoading(true);
    try {
      const { data } = await notificationsAPI.getAll();
      setNotifications(data.notifications || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { if (open) fetchNotifs(); }, [open]);

  const markAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch { /* silent */ }
  };

  const dismiss = async (id) => {
    try {
      await notificationsAPI.dismiss(id);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch { /* silent */ }
  };

  const unread = notifications.filter(n => !n.read).length;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90]"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: 360, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 360, opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-[91] w-[360px] flex flex-col"
            style={{
              background: 'var(--surface-1)',
              borderLeft: '1px solid var(--border)',
              boxShadow: '-20px 0 60px rgba(0,0,0,0.4)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-2.5">
                <span className="text-lg">🔔</span>
                <h2 className="font-semibold text-[var(--text-primary)]">Notifications</h2>
                {unread > 0 && (
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-indigo-500 text-white">
                    {unread}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unread > 0 && (
                  <button onClick={markAllRead} className="btn-ghost text-xs">
                    Mark all read
                  </button>
                )}
                <button onClick={onClose} className="btn-ghost p-1.5">✕</button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-6 space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="skeleton w-8 h-8 rounded-full flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="skeleton h-3 rounded w-3/4" />
                        <div className="skeleton h-3 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-16 px-6 text-center">
                  <div className="text-5xl mb-4 animate-float">🔔</div>
                  <p className="font-medium text-[var(--text-secondary)]">All caught up!</p>
                  <p className="text-sm text-[var(--text-muted)] mt-1">No notifications right now.</p>
                </div>
              ) : (
                <div className="divide-y divide-[var(--border)]">
                  {notifications.map(notif => (
                    <motion.div
                      key={notif._id}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex gap-3 px-4 py-3.5 hover:bg-white/[0.02] transition-colors relative cursor-pointer group"
                      onClick={async () => {
                        if (!notif.read) {
                          await notificationsAPI.markRead(notif._id);
                          setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, read: true } : n));
                        }
                      }}
                    >
                      {!notif.read && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-r-full" />
                      )}
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm"
                        style={{ background: 'var(--surface-3)' }}>
                        {NOTIF_ICONS[notif.type] || NOTIF_ICONS.default}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${notif.read ? 'text-[var(--text-secondary)]' : 'text-[var(--text-primary)] font-medium'}`}>
                          {notif.message}
                        </p>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">
                          {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); dismiss(notif._id); }}
                        className="btn-ghost p-1 text-[var(--text-muted)] hover:text-red-400 flex-shrink-0 opacity-0 group-hover:opacity-100 text-xs"
                      >
                        ✕
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
