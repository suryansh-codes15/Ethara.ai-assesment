import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { dashboardAPI, analyticsAPI, tasksAPI, activityAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import CountUp from '../components/CountUp';
import ActivityHeatmap from '../components/ActivityHeatmap';
import SkeletonLoader from '../components/SkeletonLoader';
import TaskCard from '../components/TaskCard';
import TaskSlideOver from '../components/TaskSlideOver';
import ActivityFeed from '../components/ActivityFeed';
import { format } from 'date-fns';

const greeting = () => {
  const h = new Date().getHours();
  if (h < 5) return { text: 'Good night', emoji: '🌙' };
  if (h < 12) return { text: 'Good morning', emoji: '☀️' };
  if (h < 17) return { text: 'Good afternoon', emoji: '🌤' };
  if (h < 21) return { text: 'Good evening', emoji: '🌆' };
  return { text: 'Good night', emoji: '🌙' };
};

const STAT_CONFIGS = [
  { key: 'totalTasks', label: 'Total Tasks', icon: '◻', gradient: 'from-blue-500/20 to-indigo-500/20', border: 'rgba(99,102,241,0.3)', iconColor: '#818cf8' },
  { key: 'completedTasks', label: 'Completed', icon: '✓', gradient: 'from-emerald-500/20 to-teal-500/20', border: 'rgba(16,185,129,0.3)', iconColor: '#34d399', sub: (s) => `${s?.completionRate || 0}% rate` },
  { key: 'inProgressTasks', label: 'In Progress', icon: '⚡', gradient: 'from-amber-500/20 to-orange-500/20', border: 'rgba(245,158,11,0.3)', iconColor: '#fbbf24' },
  { key: 'overdueTasks', label: 'Overdue', icon: '⚠', gradient: 'from-red-500/20 to-rose-500/20', border: 'rgba(239,68,68,0.3)', iconColor: '#f87171' },
];

const CustomAreaTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-4 py-2.5 glass-premium rounded-xl text-xs border border-white/10 shadow-2xl" style={{ background: 'rgba(13,13,26,0.95)' }}>
      <p className="text-[var(--text-muted)] font-black uppercase tracking-widest text-[9px] mb-1.5">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 mt-1">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: entry.color }} />
          <p className="font-bold text-white">
            <span className="opacity-60">{entry.name}:</span> {entry.value}
          </p>
        </div>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [velocity, setVelocity] = useState([]);
  const [heatmap, setHeatmap] = useState({});
  const [leaderboard, setLeaderboard] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [clock, setClock] = useState(new Date());
  const { emoji } = greeting();

  useEffect(() => {
    const interval = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [dashRes, heatRes, velRes, lbRes, activityRes] = await Promise.all([
        dashboardAPI.getStats(),
        analyticsAPI.getHeatmap().catch(() => ({ data: { heatmap: {} } })),
        analyticsAPI.getVelocity().catch(() => ({ data: { velocity: [] } })),
        analyticsAPI.getLeaderboard().catch(() => ({ data: { leaderboard: [] } })),
        activityAPI.getAll({ limit: 10 }).catch(() => ({ data: { activities: [] } })),
      ]);
      setStats(dashRes.data.stats);
      setRecentTasks(dashRes.data.recentTasks);
      setChartData(dashRes.data.tasksByProject);
      setHeatmap(heatRes.data.heatmap || {});
      setVelocity((velRes.data.velocity || []).slice(-14).map(d => ({
        day: format(new Date(d.date), 'MMM d'),
        completed: d.completed,
      })));
      setLeaderboard(lbRes.data.leaderboard || []);
      setActivities(activityRes.data.activities || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { 
    fetchData(); 
    const refresh = () => fetchData();
    window.addEventListener('refreshDashboard', refresh);
    return () => window.removeEventListener('refreshDashboard', refresh);
  }, []);

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await tasksAPI.update(taskId, { status: newStatus });
      fetchData();
    } catch (error) {
      console.error("Dashboard Stats Error:", error);
    }
  };

  const { text: greetText } = greeting();

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-32 rounded-2xl skeleton" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <SkeletonLoader key={i} type="stat" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── Hero Banner ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl p-6 md:p-8"
        style={{
          background: 'linear-gradient(135deg, #6366f1 0%, #7c3aed 40%, #1d4ed8 100%)',
          backgroundSize: '200% 200%',
        }}
      >
        {/* Noise overlay */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.4\'/%3E%3C/svg%3E")' }}
        />
        {/* Glow orbs */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #a78bfa, transparent)', transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #60a5fa, transparent)', transform: 'translateY(50%)' }} />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <p className="text-white/70 text-sm font-medium mb-1">
              {emoji} {format(clock, 'EEEE, MMMM d, yyyy')}
            </p>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-white">
              {greetText}, {user?.name?.split(' ')[0]}!
            </h1>
            <p className="text-white/60 text-sm mt-1">
              {!stats ? 'Syncing your workspace data...' : 
               stats.totalTasks === 0
                ? 'Ready to start something great today?'
                : `${stats.completionRate || 0}% of your tasks are complete. Keep it up! 🚀`}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="text-4xl font-display font-bold text-white tracking-tight">
              {format(clock, 'HH:mm')}
              <span className="text-xl text-white/50">:{format(clock, 'ss')}</span>
            </div>
            {isAdmin && (
              <Link to="/projects" className="btn-primary text-sm py-2 bg-white/20 hover:bg-white/30 border-white/30" style={{ background: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.3)' }}>
                + New Project
              </Link>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        {STAT_CONFIGS.map((cfg, i) => (
          <motion.div
            key={cfg.key}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="card p-5 relative overflow-hidden"
            style={{ borderColor: cfg.border }}
          >
            <div className={`absolute inset-0 opacity-30 bg-gradient-to-br ${cfg.gradient}`} />
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                  style={{ background: 'rgba(255,255,255,0.06)', color: cfg.iconColor }}>
                  {cfg.icon}
                </div>
              </div>
              <div className="text-3xl font-display font-bold text-white">
                <CountUp end={stats?.[cfg.key] ?? 0} duration={900} />
              </div>
              <p className="text-sm text-[var(--text-muted)] mt-0.5">{cfg.label}</p>
              {cfg.sub && <p className="text-xs mt-1" style={{ color: cfg.iconColor }}>{cfg.sub(stats)}</p>}
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Velocity chart */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-5">
          <h2 className="text-sm font-display font-semibold text-[var(--text-secondary)] mb-1">Velocity — Last 14 Days</h2>
          <p className="text-xs text-[var(--text-muted)] mb-4">Tasks completed per day</p>
          {velocity.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={velocity}>
                <defs>
                  <linearGradient id="velGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} width={20} />
                <Tooltip content={<CustomAreaTooltip />} />
                <Area type="monotone" dataKey="completed" stroke="#6366f1" strokeWidth={2} fill="url(#velGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-40 flex flex-col items-center justify-center text-[var(--text-muted)] dot-grid rounded-xl">
              <p className="text-2xl mb-2">📈</p>
              <p className="text-sm">No completion data yet</p>
            </div>
          )}
        </motion.div>

        {/* Tasks by project bar chart */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="card p-5">
          <h2 className="text-sm font-display font-semibold text-[var(--text-secondary)] mb-1">Tasks by Project</h2>
          <p className="text-xs text-[var(--text-muted)] mb-4">Total vs completed</p>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={chartData} barCategoryGap="30%" barGap={2}>
                <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 9 }} tickLine={false} axisLine={false}
                  tickFormatter={v => v.length > 10 ? v.slice(0, 10) + '…' : v} />
                <YAxis tick={{ fill: '#475569', fontSize: 9 }} tickLine={false} axisLine={false} width={20} allowDecimals={false} />
                <Tooltip content={<CustomAreaTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="count" name="Total" radius={[2, 2, 0, 0]} fill="rgba(99,102,241,0.3)" barSize={10} />
                <Bar dataKey="done" name="Done" radius={[2, 2, 0, 0]} fill="#6366f1" barSize={10} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-40 flex flex-col items-center justify-center text-[var(--text-muted)] dot-grid rounded-xl">
              <p className="text-2xl mb-2">📊</p>
              <p className="text-sm">No project data yet</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Heatmap + Leaderboard ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity heatmap */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card p-5 lg:col-span-2">
          <h2 className="text-sm font-display font-semibold text-[var(--text-secondary)] mb-1">Activity Heatmap</h2>
          <p className="text-xs text-[var(--text-muted)] mb-4">Task completions over the past year</p>
          <ActivityHeatmap data={heatmap} />
        </motion.div>

        {/* Recent Activity */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="card p-5">
          <h2 className="text-sm font-display font-semibold text-[var(--text-secondary)] mb-1">Recent Activity</h2>
          <p className="text-xs text-[var(--text-muted)] mb-4">Latest updates across projects</p>
          <ActivityFeed activities={activities} />
        </motion.div>
      </div>

      {/* ── Recent Tasks ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-display font-semibold text-[var(--text-secondary)]">Recent Tasks</h2>
          <Link to="/projects" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">View all →</Link>
        </div>
        {recentTasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentTasks.map((task, i) => (
              <TaskCard
                key={task._id}
                task={task}
                index={i}
                onStatusChange={handleStatusChange}
                onClick={(t) => setSelectedTaskId(t._id)}
              />
            ))}
          </div>
        ) : (
          <div className="card p-12 text-center dot-grid">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-[var(--text-muted)] text-sm">
              {isAdmin ? 'Create a project and add tasks to get started.' : 'No tasks assigned to you yet.'}
            </p>
          </div>
        )}
      </motion.div>

      {/* Task Slide Over */}
      <TaskSlideOver
        taskId={selectedTaskId}
        open={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        onUpdated={fetchData}
      />
    </div>
  );
}
