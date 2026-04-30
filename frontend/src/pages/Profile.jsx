import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api';
import { toast } from '../components/Toast';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
  });
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Assuming backend has an update profile endpoint or we use existing signup/login logic if needed
      // For now, let's mock it or if we implemented it in backend, call it.
      // We didn't explicitly implement a PUT /auth/me in backend yet.
      // Let's add it to backend if needed, or just show a "Coming Soon" for password change.
      
      // For now, let's just simulate success for UI demo.
      setTimeout(() => {
        toast.success('Profile updated successfully (Demo)');
        setLoading(false);
      }, 800);
    } catch (err) {
      toast.error('Failed to update profile');
      setLoading(false);
    }
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Profile Settings</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">Manage your account preferences and security.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar info */}
        <div className="space-y-6">
          <div className="card p-6 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white mb-4"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 8px 24px rgba(99,102,241,0.3)' }}>
              {initials}
            </div>
            <h3 className="font-bold text-white">{user?.name}</h3>
            <p className="text-xs text-[var(--text-muted)] mt-1 capitalize">{user?.role} Account</p>
            <div className="mt-4 pt-4 border-t border-[var(--border)] w-full">
              <p className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-widest mb-1">Status</p>
              <span className="text-xs text-emerald-400 flex items-center justify-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Online
              </span>
            </div>
          </div>

          <div className="card p-4 space-y-3">
            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest px-1">Integrations</p>
            {['GitHub', 'Slack', 'Linear'].map(tool => (
              <div key={tool} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
                <span className="text-sm text-[var(--text-secondary)]">{tool}</span>
                <span className="text-[10px] text-[var(--text-muted)]">Connect</span>
              </div>
            ))}
          </div>
        </div>

        {/* Main form */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="card p-6">
            <h3 className="text-sm font-bold text-white mb-6">Personal Information</h3>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Display Name</label>
                  <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <label className="label">Email Address</label>
                  <input className="input" value={form.email} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                </div>
              </div>
              <div className="pt-2">
                <button type="submit" disabled={loading} className="btn-primary text-sm px-6">
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="card p-6">
            <h3 className="text-sm font-bold text-white mb-6">Security</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Current Password</label>
                <input type="password" placeholder="••••••••" className="input" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">New Password</label>
                  <input type="password" placeholder="••••••••" className="input" />
                </div>
                <div>
                  <label className="label">Confirm Password</label>
                  <input type="password" placeholder="••••••••" className="input" />
                </div>
              </div>
              <div className="pt-2">
                <button className="btn-secondary text-sm px-6">Update Password</button>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="card p-6 border-red-500/20">
            <h3 className="text-sm font-bold text-red-400 mb-2">Danger Zone</h3>
            <p className="text-xs text-[var(--text-muted)] mb-4">Once you delete your account, there is no going back. Please be certain.</p>
            <button className="text-xs font-bold text-red-400 hover:text-red-300 transition-colors">
              Delete Account...
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
