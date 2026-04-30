import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CommandPalette from './CommandPalette';
import NotificationsPanel from './NotificationsPanel';

const NAV_ITEMS = [
  { to: '/dashboard', icon: '⬡', label: 'Dashboard', shortcut: 'D' },
  { to: '/projects', icon: '◈', label: 'Projects', shortcut: 'P' },
  { to: '/sprints', icon: '⎍', label: 'Sprints', shortcut: 'R' },
  { to: '/profile', icon: '⚙', label: 'Settings', shortcut: 'S' },
];

const NavItem = ({ to, icon, label, shortcut, collapsed }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `nav-item group ${isActive ? 'active' : ''}`
    }
    title={collapsed ? label : undefined}
  >
    <span className="text-base flex-shrink-0 w-5 text-center">{icon}</span>
    <AnimatePresence>
      {!collapsed && (
        <motion.span
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: 'auto' }}
          exit={{ opacity: 0, width: 0 }}
          transition={{ duration: 0.2 }}
          className="flex-1 overflow-hidden whitespace-nowrap"
        >
          {label}
        </motion.span>
      )}
    </AnimatePresence>
    {!collapsed && (
      <span className="text-[10px] text-slate-700 font-mono ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
        ⌘{shortcut}
      </span>
    )}
  </NavLink>
);

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      const key = e.key.toLowerCase();
      const modifier = e.metaKey || e.ctrlKey;

      if (modifier && key === 'k') {
        e.preventDefault();
        setCmdOpen(prev => !prev);
      }
      
      if (modifier && (key === 'd' || key === 'p' || key === 's' || key === 'r')) {
        e.preventDefault();
        setCmdOpen(false);
        setNotifOpen(false);
        if (key === 'd') navigate('/dashboard');
        if (key === 'p') navigate('/projects');
        if (key === 's') navigate('/profile');
        if (key === 'r') navigate('/sprints');
      }

      if (e.key === 'Escape') {
        setCmdOpen(false);
        setNotifOpen(false);
        setMobileOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate]);

  // Close mobile on nav
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  const SidebarContent = ({ forMobile = false }) => (
    <div className="flex flex-col h-full">
      {/* Logo + Collapse */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-[var(--border)]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-bold text-sm"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            T
          </div>
          <AnimatePresence>
            {(!collapsed || forMobile) && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <p className="font-display font-bold text-white text-sm whitespace-nowrap">TaskFlow</p>
                <p className="text-[10px] text-[var(--text-muted)] whitespace-nowrap">Workspace</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {!forMobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="btn-ghost p-1.5 text-xs ml-auto flex-shrink-0"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? '→' : '←'}
          </button>
        )}
      </div>

      {/* Search / Cmd shortcut */}
      <div className="px-3 pt-3 pb-1">
        <button
          onClick={() => setCmdOpen(true)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-all"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}
        >
          <span>🔍</span>
          {(!collapsed || forMobile) && (
            <>
              <span className="flex-1 text-left text-xs">Search...</span>
              <span className="text-[10px] font-mono bg-white/5 px-1.5 py-0.5 rounded">⌘K</span>
            </>
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {(!collapsed || forMobile) && (
          <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest px-2 py-2">
            Menu
          </p>
        )}
        {NAV_ITEMS.map(item => (
          <NavItem key={item.to} {...item} collapsed={collapsed && !forMobile} />
        ))}
        {isAdmin && (
          <button
            onClick={() => setCmdOpen(true)}
            className="nav-item w-full text-left mt-2 border border-dashed border-[var(--border)] hover:border-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/5"
            title="Quick Create (⌘K)"
          >
            <span className="text-base w-5 text-center flex-shrink-0 text-[var(--brand-primary)]">+</span>
            {(!collapsed || forMobile) && <span className="flex-1 font-display font-semibold text-[var(--brand-primary)]">Quick Create</span>}
          </button>
        )}
      </nav>

      {/* Bottom section */}
      <div className="px-3 pb-4 space-y-2 border-t border-[var(--border)] pt-3">
        {/* Notifications bell */}
        <button
          onClick={() => setNotifOpen(true)}
          className="nav-item w-full text-left relative"
          title="Notifications"
        >
          <span className="text-base w-5 text-center flex-shrink-0">🔔</span>
          {(!collapsed || forMobile) && <span className="flex-1">Notifications</span>}
          {user?.unreadCount > 0 && (
            <span className="absolute left-6 top-2 w-4 h-4 bg-red-500 rounded-full text-[8px] flex items-center justify-center text-white border-2 border-[var(--surface-1)]">
              {user.unreadCount}
            </span>
          )}
        </button>

        {/* User card */}
        <div className="mt-1" style={{ borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              {initials}
            </div>
            <AnimatePresence>
              {(!collapsed || forMobile) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 min-w-0"
                >
                  <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                    style={isAdmin
                      ? { background: 'rgba(245,158,11,0.15)', color: '#fbbf24' }
                      : { background: 'rgba(99,102,241,0.15)', color: '#818cf8' }
                    }
                  >
                    {isAdmin ? '⚡ Admin' : '◎ Member'}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
            {(!collapsed || forMobile) && (
              <button
                onClick={handleLogout}
                className="btn-ghost p-1.5 text-[var(--text-muted)] hover:text-red-400 flex-shrink-0"
                title="Logout"
              >
                ↩
              </button>
            )}
          </div>
          {(collapsed && !forMobile) && (
            <button
              onClick={handleLogout}
              className="btn-ghost w-full justify-center mt-1 text-[var(--text-muted)] hover:text-red-400 text-xs"
              title="Logout"
            >↩</button>
          )}
        </div>
      </div>
    </div>
  );

  const sidebarWidth = collapsed ? 72 : 240;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--surface-0)' }}>
      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: sidebarWidth }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className="hidden md:flex flex-col flex-shrink-0 overflow-hidden"
        style={{
          background: 'var(--surface-1)',
          borderRight: '1px solid var(--border)',
        }}
      >
        <SidebarContent />
      </motion.aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="md:hidden fixed left-0 top-0 bottom-0 z-50 w-[240px] flex flex-col"
              style={{ background: 'var(--surface-1)', borderRight: '1px solid var(--border)' }}
            >
              <SidebarContent forMobile />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header
          className="md:hidden flex items-center justify-between px-4 py-3"
          style={{ background: 'var(--surface-1)', borderBottom: '1px solid var(--border)' }}
        >
          <button onClick={() => setMobileOpen(true)} className="btn-ghost p-2">
            ☰
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs font-bold"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>T</div>
            <span className="font-bold text-white text-sm">TaskFlow</span>
          </div>
          <button onClick={() => setCmdOpen(true)} className="btn-ghost p-2">🔍</button>
        </header>

        {/* Page content */}
        <main
          className="flex-1 overflow-y-auto"
          style={{ background: 'var(--surface-0)' }}
        >
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="p-4 md:p-8 max-w-[1400px] mx-auto"
          >
            <Outlet />
          </motion.div>
        </main>

        {/* Mobile bottom nav */}
        <nav
          className="md:hidden flex items-center justify-around px-4 py-2 border-t border-[var(--border)]"
          style={{ background: 'var(--surface-1)' }}
        >
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl text-xs font-medium transition-all ${
                  isActive ? 'text-indigo-400 bg-indigo-500/10' : 'text-[var(--text-muted)]'
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
          <button
            onClick={() => setNotifOpen(true)}
            className="flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl text-xs font-medium text-[var(--text-muted)]"
          >
            <span className="text-lg">🔔</span>
            <span>Alerts</span>
          </button>
        </nav>
      </div>

      {/* Global overlays */}
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
      <NotificationsPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
    </div>
  );
}
