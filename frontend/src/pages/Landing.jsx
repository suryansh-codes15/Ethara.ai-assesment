import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'var(--surface-0)' }}>
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[800px] h-[800px] rounded-full opacity-[0.08] animate-float"
          style={{ background: 'radial-gradient(circle, #6366f1, transparent)', top: '-10%', left: '-5%' }} />
        <div className="absolute w-[600px] h-[600px] rounded-full opacity-[0.06] animate-float"
          style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)', bottom: '5%', right: '-10%', animationDelay: '2s' }} />
        <div className="absolute inset-0 dot-grid opacity-30" />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-lg"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 0 20px rgba(99,102,241,0.3)' }}>
            T
          </div>
          <span className="text-xl font-bold text-white tracking-tight">TaskFlow</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm font-medium text-[var(--text-muted)] hover:text-white transition-colors">
            Sign in
          </Link>
          <Link to="/signup" className="btn-primary text-sm px-5 py-2">
            Get Started →
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
        <div className="text-center max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-6"
              style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }}>
              Next-Gen Team Management
            </span>
            <h1 className="text-5xl md:text-7xl font-bold text-white leading-[1.1] mb-6 tracking-tight">
              Manage projects with <br />
              <span className="gradient-text">Obsidian Precision.</span>
            </h1>
            <p className="text-lg md:text-xl text-[var(--text-muted)] mb-10 leading-relaxed">
              TaskFlow is the enterprise-grade task manager built for high-performance teams. 
              Beautiful, fast, and engineered for focus.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/signup" className="btn-primary text-base px-8 py-4 w-full sm:w-auto">
                Start for Free
              </Link>
              <Link to="/login" className="btn-secondary text-base px-8 py-4 w-full sm:w-auto">
                View Demo
              </Link>
            </div>
          </motion.div>

          {/* Floating Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="mt-20 relative"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-20" />
            <div className="relative glass-card p-2 aspect-video overflow-hidden border-white/10">
              <div className="bg-[var(--surface-0)] w-full h-full rounded-lg flex items-center justify-center border border-white/5">
                {/* Mock dashboard UI */}
                <div className="w-full h-full p-8 space-y-6 opacity-40">
                  <div className="flex justify-between items-center">
                    <div className="skeleton w-48 h-8 rounded-lg" />
                    <div className="skeleton w-32 h-10 rounded-xl" />
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="card p-4 h-24 dot-grid" />
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-6">
                    <div className="card h-64 col-span-2 dot-grid" />
                    <div className="card h-64 dot-grid" />
                  </div>
                </div>
                {/* Overlay text */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-white font-bold text-xl mb-2">Intuitive Interface</p>
                    <p className="text-[var(--text-muted)] text-sm">Dark mode by default. Glassmorphism included.</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Features Grid */}
        <div className="mt-40 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: '⚡',
              title: 'Lightning Fast',
              desc: 'Optimized for speed with real-time updates and smooth animations.'
            },
            {
              icon: '🔒',
              title: 'Enterprise Security',
              desc: 'Built-in RBAC, rate limiting, and secure authentication.'
            },
            {
              icon: '📊',
              title: 'Deep Analytics',
              desc: 'Visualize team performance with velocity charts and activity heatmaps.'
            }
          ].map((feat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-8 group hover:border-indigo-500/50 transition-all duration-300"
            >
              <div className="text-3xl mb-4 group-hover:scale-110 transition-transform inline-block">{feat.icon}</div>
              <h3 className="text-lg font-bold text-white mb-2">{feat.title}</h3>
              <p className="text-[var(--text-muted)] text-sm leading-relaxed">{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5 opacity-60">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center text-white font-bold text-xs"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              T
            </div>
            <span className="text-sm font-bold text-white tracking-tight">TaskFlow</span>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            © 2026 TaskFlow Obsidian Pro. All rights reserved.
          </p>
          <div className="flex gap-6 text-xs text-[var(--text-muted)]">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Twitter</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
