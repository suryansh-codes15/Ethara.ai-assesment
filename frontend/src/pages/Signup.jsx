import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'member' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    setLoading(true);
    try {
      await signup(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed. Please try again.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'var(--surface-0)' }}>
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[500px] h-[500px] rounded-full opacity-[0.07] animate-float"
          style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)', top: '-10%', right: '-5%' }} />
        <div className="absolute w-[400px] h-[400px] rounded-full opacity-[0.05] animate-float"
          style={{ background: 'radial-gradient(circle, #6366f1, transparent)', bottom: '-15%', left: '10%', animationDelay: '2s' }} />
        <div className="absolute inset-0 dot-grid opacity-40" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-[420px] relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white font-bold text-xl"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 0 32px rgba(99,102,241,0.4)' }}>
            T
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Create your account</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Join TaskFlow and start collaborating</p>
        </div>

        {/* Card */}
        <motion.div
          animate={shake ? { x: [-6, 6, -6, 6, 0] } : { x: 0 }}
          transition={{ duration: 0.4 }}
          className="glass-card p-6"
          style={{ boxShadow: '0 24px 80px rgba(0,0,0,0.4)' }}
        >
          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 rounded-xl text-sm text-red-400 mb-4"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
              <span>⚠</span> {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label" htmlFor="signup-name">Full name</label>
              <input id="signup-name" type="text" className="input" placeholder="John Doe"
                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required minLength={2} />
            </div>
            <div>
              <label className="label" htmlFor="signup-email">Email address</label>
              <input id="signup-email" type="email" className="input" placeholder="you@company.com"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className="label" htmlFor="signup-password">Password</label>
              <input id="signup-password" type="password" className="input" placeholder="Min. 6 characters"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} />
            </div>
            <div>
              <label className="label">Role</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'member', label: '◎ Member', desc: 'Update assigned tasks' },
                  { value: 'admin', label: '⚡ Admin', desc: 'Full project control' },
                ].map(r => (
                  <button key={r.value} type="button"
                    onClick={() => setForm({ ...form, role: r.value })}
                    className="p-3 rounded-xl text-left transition-all"
                    style={{
                      background: form.role === r.value ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${form.role === r.value ? 'rgba(99,102,241,0.4)' : 'var(--border)'}`,
                    }}>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{r.label}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">{r.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 mt-2">
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating account...
                </span>
              ) : 'Create account →'}
            </button>
          </form>
        </motion.div>

        <p className="text-center text-sm text-[var(--text-muted)] mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
            Sign in →
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
