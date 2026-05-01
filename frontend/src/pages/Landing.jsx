import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { publicAPI } from '../api';

const S = {
  page: { background: '#02020a', minHeight: '100vh', color: '#f8fafc', fontFamily: "'Manrope', system-ui, sans-serif", overflowX: 'hidden', position: 'relative' },
  nav: { position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(2,2,10,0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  logo: { display: 'flex', alignItems: 'center', gap: 10, fontFamily: "'Space Grotesk', 'Manrope', sans-serif", fontWeight: 700, fontSize: 20, letterSpacing: '-0.01em' },
  logoBox: { width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 },
  navLinks: { display: 'flex', gap: '2rem', listStyle: 'none' },
  navLink: { color: '#64748b', fontSize: 14, fontWeight: 500, cursor: 'pointer', textDecoration: 'none', transition: 'color .2s' },
  navRight: { display: 'flex', alignItems: 'center', gap: '1rem' },
  btnPrimary: { background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: '#fff', border: 'none', borderRadius: 12, padding: '0.6rem 1.4rem', fontWeight: 600, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 20px rgba(124,58,237,0.35)', transition: 'all .25s' },
  btnSecondary: { background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '0.6rem 1.4rem', fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all .25s' },
  hero: { paddingTop: 120, paddingBottom: 60, textAlign: 'center', position: 'relative', zIndex: 2 },
  badge: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 100, background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa', fontSize: 11, fontWeight: 600, marginBottom: 24 },
  h1: { fontFamily: "'Space Grotesk','Manrope',sans-serif", fontWeight: 700, fontSize: 'clamp(2rem,5vw,3.6rem)', lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: 24 },
  gradientText: { background: 'linear-gradient(135deg, #818cf8, #a78bfa, #22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' },
  sub: { color: '#94a3b8', fontSize: 'clamp(0.95rem,1.8vw,1.1rem)', maxWidth: 580, margin: '0 auto 2.5rem', lineHeight: 1.6 },
  ctaRow: { display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: 24 },
  ctaBig: { background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: '#fff', border: 'none', borderRadius: 14, padding: '0.75rem 2rem', fontWeight: 700, fontSize: 15, cursor: 'pointer', boxShadow: '0 6px 30px rgba(124,58,237,0.4)', transition: 'all .3s', display: 'inline-flex', alignItems: 'center', gap: 10 },
  ctaGhost: { background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, padding: '0.75rem 2rem', fontWeight: 700, fontSize: 15, cursor: 'pointer', transition: 'all .3s', display: 'inline-flex', alignItems: 'center', gap: 10 },
  mockup: { maxWidth: 840, margin: '3.5rem auto 0', borderRadius: 20, padding: '1.25rem', background: 'rgba(13,13,26,0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(124,58,237,0.3)', boxShadow: '0 0 80px rgba(124,58,237,0.2)', animation: 'float 4s ease-in-out infinite' },
  mockupBar: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.05)' },
  dot: (c) => ({ width: 10, height: 10, borderRadius: '50%', background: c }),
  mockupGrid: { display: 'grid', gridTemplateColumns: '180px 1fr', gap: '1.5rem', minHeight: 220 },
  sidebarItem: { height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.03)', marginBottom: 10 },
  kanbanGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' },
  col: (c) => ({ borderRadius: 12, padding: '0.75rem', background: `${c}08`, border: `1px solid ${c}20` }),
  colHeader: { fontSize: 11, fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 },
  miniCard: { height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.04)', marginBottom: 8, border: '1px solid rgba(255,255,255,0.04)' },
  section: { padding: '100px 2rem', maxWidth: 1160, margin: '0 auto' },
  sectionHead: { textAlign: 'center', marginBottom: 60 },
  h2: { fontFamily: "'Space Grotesk','Manrope',sans-serif", fontWeight: 700, fontSize: 'clamp(1.5rem,3.5vw,2.4rem)', letterSpacing: '-0.02em', marginBottom: 14 },
  h2sub: { color: '#64748b', fontSize: 16 },
  grid3: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' },
  fCard: { padding: '2rem', borderRadius: 20, background: 'rgba(13,13,26,0.7)', border: '1px solid rgba(255,255,255,0.06)', transition: 'all .3s', cursor: 'default' },
  iconBox: { width: 48, height: 48, borderRadius: 14, background: 'rgba(124,58,237,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 16 },
  fTitle: { fontWeight: 700, fontSize: 17, marginBottom: 8 },
  fDesc: { color: '#64748b', fontSize: 14, lineHeight: 1.6 },
  statsBar: { borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(13,13,26,0.5)', padding: '60px 2rem' },
  statsGrid: { maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem', textAlign: 'center' },
  statNum: { fontFamily: "'Space Grotesk','Manrope',sans-serif", fontWeight: 700, fontSize: 28, marginBottom: 6 },
  statLabel: { color: '#64748b', fontSize: 14 },
  pricingGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', maxWidth: 960, margin: '0 auto' },
  pCard: (glow) => ({ padding: '2rem', borderRadius: 24, background: 'rgba(13,13,26,0.8)', border: `1px solid ${glow ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.06)'}`, boxShadow: glow ? '0 0 50px rgba(124,58,237,0.2)' : 'none', position: 'relative' }),
  popularBadge: { position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 16px', borderRadius: 100, whiteSpace: 'nowrap' },
  price: { fontFamily: "'Space Grotesk','Manrope',sans-serif", fontWeight: 700, fontSize: 30, marginBottom: 4, letterSpacing: '-0.02em' },
  pFeature: { display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#cbd5e1', marginBottom: 10 },
  cta2: { padding: '100px 2rem', textAlign: 'center', position: 'relative' },
  cta2Bg: { position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.15) 0%, transparent 70%)', zIndex: 0 },
  emailRow: { display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 32, marginBottom: 16 },
  emailInput: { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '0.85rem 1.5rem', color: '#fff', fontSize: 15, outline: 'none', width: 300 },
  pills: { display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 16 },
  pill: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 100, padding: '4px 14px', fontSize: 13, color: '#94a3b8' },
  footer: { borderTop: '1px solid rgba(255,255,255,0.05)', padding: '60px 2rem 32px' },
  footerGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '3rem', maxWidth: 1100, margin: '0 auto 3rem' },
  footerTitle: { fontWeight: 700, fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', color: '#64748b', marginBottom: 16 },
  footerLink: { color: '#475569', fontSize: 14, marginBottom: 10, cursor: 'pointer', transition: 'color .2s', display: 'block' },
  footerBottom: { maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 24, flexWrap: 'wrap', gap: 16 },
  statusDot: { display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#10b981', marginRight: 8 },
};

const FEATURES = [
  { icon: '🧠', title: 'AI Task Generation', desc: 'Describe your project. Get 8 perfectly structured tasks with priorities and due dates in 2 seconds.' },
  { icon: '⚡', title: 'Real-Time Collaboration', desc: 'Every change syncs instantly via WebSocket. Your team always sees the same truth.' },
  { icon: '📋', title: 'Kanban Board', desc: 'Drag-and-drop cards across columns with smooth animations and automatic reordering.' },
  { icon: '📊', title: 'Advanced Analytics', desc: 'Velocity charts, team leaderboards, and burndown graphs. Executive insights in one click.' },
  { icon: '🏃', title: 'Sprint Management', desc: 'Plan sprints, track progress with animated rings, and ship on schedule every time.' },
  { icon: '🔒', title: 'Enterprise Security', desc: 'JWT auth, RBAC permissions, rate limiting, XSS protection, and full audit logs.' },
];

const DEFAULT_STATS = [
  { val: '0', label: 'Active Projects' },
  { val: '0', label: 'Tasks Orchestrated' },
  { val: '99.9%', label: 'Uptime Reliability' },
  { val: '0', label: 'Active Personnel' },
];

const PLANS = [
  { name: 'Starter', price: '₹0', period: 'forever free', popular: false, features: ['3 projects', '5 team members', 'Basic kanban', 'Community support'], cta: 'Get Started Free' },
  { name: 'Pro', price: '₹999', period: '/month', popular: true, features: ['Unlimited projects', '20 members', 'AI generation (100/mo)', 'Advanced analytics', 'Sprint management', 'Priority support'], cta: 'Start Free Trial' },
  { name: 'Enterprise', price: 'Custom', period: 'pricing', popular: false, features: ['Everything in Pro', 'SSO & SAML', 'Audit logs', 'Dedicated support', 'Custom integrations', 'SLA guarantee'], cta: 'Contact Sales' },
];

export default function Landing() {
  const navigate = useNavigate();
  const mockupRef = useRef(null);
  const [taskPos, setTaskPos] = useState(0);
  const [stats, setStats] = useState(DEFAULT_STATS);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await publicAPI.getStats();
        if (res.data.success) setStats(res.data.stats);
      } catch (err) { console.error('Failed to fetch public stats', err); }
    };
    fetchStats();
  }, []);

  // Animate task card across kanban columns
  useEffect(() => {
    const t = setInterval(() => setTaskPos(p => (p + 1) % 3), 2000);
    return () => clearInterval(t);
  }, []);

  // 3D tilt on hero mockup
  const handleMouseMove = (e) => {
    if (!mockupRef.current) return;
    const rect = mockupRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const rx = ((e.clientY - cy) / rect.height) * 5;
    const ry = ((e.clientX - cx) / rect.width) * -5;
    mockupRef.current.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg)`;
  };
  const handleMouseLeave = () => {
    if (mockupRef.current) mockupRef.current.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
  };

  return (
    <div style={S.page} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
      {/* Aurora */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', width: 800, height: 800, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)', top: '-20%', left: '-10%', animation: 'auroraA 14s ease-in-out infinite alternate' }} />
        <div style={{ position: 'absolute', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,70,229,0.1) 0%, transparent 70%)', top: '10%', right: '-5%', animation: 'auroraB 10s ease-in-out infinite alternate' }} />
        <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)', bottom: '10%', left: '30%', animation: 'auroraC 12s ease-in-out infinite alternate' }} />
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Manrope:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        @keyframes float { 0%,100%{transform:translateY(0) perspective(1000px)} 50%{transform:translateY(-14px) perspective(1000px)} }
        @keyframes auroraA { 0%{transform:translate(0,0) scale(1)} 100%{transform:translate(6%,8%) scale(1.15)} }
        @keyframes auroraB { 0%{transform:translate(0,0) scale(1)} 100%{transform:translate(-8%,4%) scale(1.1)} }
        @keyframes auroraC { 0%{transform:translate(0,0) scale(1)} 100%{transform:translate(4%,-6%) scale(1.08)} }
        @keyframes taskSlide { 0%{opacity:0;transform:translateX(20px)} 100%{opacity:1;transform:translateX(0)} }
        .fcard:hover { border-color: rgba(124,58,237,0.4) !important; transform: translateY(-4px); box-shadow: 0 12px 40px rgba(124,58,237,0.15); }
        .nav-link-hover:hover { color: #f8fafc !important; }
        .btn-big:hover { transform: translateY(-3px) scale(1.02); box-shadow: 0 12px 40px rgba(124,58,237,0.5) !important; }
        .btn-ghost-big:hover { background: rgba(255,255,255,0.1) !important; transform: translateY(-2px); }
        .footer-link:hover { color: #f8fafc !important; }
      `}</style>

      {/* Navbar */}
      <nav style={S.nav}>
        <div style={S.logo}>
          <div style={S.logoBox}>⚡</div>
          TaskFlow.ai
        </div>
        <ul style={S.navLinks}>
          {['Features', 'Demo'].map(l => (
            <li key={l}><a href={`#${l.toLowerCase()}`} className="nav-link-hover" style={S.navLink}>{l}</a></li>
          ))}
        </ul>
        <div style={S.navRight}>
          <button style={S.btnSecondary} onClick={() => navigate('/login')}>Log in</button>
          <button className="btn-big" style={S.btnPrimary} onClick={() => navigate('/signup')}>Get Started →</button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ ...S.hero, position: 'relative', zIndex: 2, padding: '160px 2rem 80px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={S.badge}>✨ Now with Groq-powered AI Task Generation</div>
          <h1 style={S.h1}>
            Ship projects<br />
            at the speed of<br />
            <span style={S.gradientText}>thought.</span>
          </h1>
          <p style={S.sub}>TaskFlow.ai combines AI intelligence, real-time collaboration, and beautiful design into the only project tool your team will actually love.</p>
          <div style={S.ctaRow}>
            <button className="btn-big" style={S.ctaBig} onClick={() => navigate('/signup')}>Start for Free →</button>
            <button className="btn-ghost-big" style={S.ctaGhost}>▶ Watch Demo</button>
          </div>
          <p style={{ color: '#475569', fontSize: 13 }}>
            ★★★★★ Trusted by {stats.find(s => s.label === 'Active Projects')?.val || '0'} projects worldwide · No credit card required
          </p>

          {/* Mockup */}
          <div ref={mockupRef} style={{ ...S.mockup, transition: 'transform .15s ease-out' }}>
            <div style={S.mockupBar}>
              <div style={S.dot('#ef4444')} /><div style={S.dot('#f59e0b')} /><div style={S.dot('#10b981')} />
              <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.04)', borderRadius: 10, marginLeft: 16 }} />
            </div>
            <div style={S.mockupGrid}>
              <div>
                {['Dashboard','Projects','Sprints','Analytics','Settings'].map(i => (
                  <div key={i} style={{ ...S.sidebarItem, display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 12 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(124,58,237,0.5)' }} />
                    <div style={{ height: 8, width: 80, background: 'rgba(255,255,255,0.06)', borderRadius: 6 }} />
                  </div>
                ))}
              </div>
              <div style={S.kanbanGrid}>
                {[['📝 To Do','#94a3b8',[0,1]], ['⚡ In Progress','#fbbf24',[2]], ['✅ Done','#10b981',[3,4]]].map(([label, color, indices], ci) => (
                  <div key={ci} style={S.col(color)}>
                    <div style={S.colHeader}><span style={{ color }}>{label}</span></div>
                    {[0,1].map(r => {
                      const isMoving = ci === taskPos && r === 0;
                      return (
                        <div key={r} style={{ ...S.miniCard, animation: isMoving ? 'taskSlide .5s ease' : 'none', borderColor: isMoving ? `${color}40` : 'rgba(255,255,255,0.04)', background: isMoving ? `${color}10` : 'rgba(255,255,255,0.04)' }}>
                          {isMoving && <div style={{ height: '100%', display: 'flex', alignItems: 'center', paddingLeft: 12, fontSize: 11, color, fontWeight: 600 }}>AI: Design landing page</div>}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div style={S.statsBar}>
        <div style={S.statsGrid}>
          {stats.map(({ val, label }) => (
            <div key={label}>
              <div style={{ ...S.statNum, ...S.gradientText }}>{val}</div>
              <div style={S.statLabel}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <section id="features" style={S.section}>
        <div style={S.sectionHead}>
          <h2 style={S.h2}>Everything your team needs<br /><span style={S.gradientText}>to ship faster.</span></h2>
        </div>
        <div style={S.grid3}>
          {FEATURES.map(f => (
            <div key={f.title} className="fcard" style={S.fCard}>
              <div style={S.iconBox}>{f.icon}</div>
              <div style={S.fTitle}>{f.title}</div>
              <div style={S.fDesc}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>



      {/* Final CTA */}
      <section style={S.cta2}>
        <div style={S.cta2Bg} />
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ ...S.badge, margin: '0 auto 2rem' }}>START TODAY — FREE FOREVER</div>
          <h2 style={{ ...S.h2, fontSize: 'clamp(2.5rem,8vw,4rem)' }}>Your team is waiting.</h2>
          <p style={{ color: '#64748b', fontSize: 17, marginTop: 12 }}>
            Empowering {stats.find(s => s.label === 'Active Projects')?.val || '0'} projects and teams worldwide.
          </p>
          <div style={S.emailRow}>
            <input placeholder="you@company.com" style={S.emailInput} />
            <button className="btn-big" style={S.ctaBig} onClick={() => navigate('/signup')}>Get Early Access →</button>
          </div>
          <p style={{ color: '#475569', fontSize: 13 }}>No credit card required. Free forever plan available.</p>
          <div style={S.pills}>
            {['✓ AI-powered', '✓ Real-time', '✓ RBAC', '✓ Railway deployed', '✓ Open roadmap'].map(p => (
              <span key={p} style={S.pill}>{p}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={S.footer}>
        <div style={S.footerGrid}>
          <div>
            <div style={{ ...S.logo, marginBottom: 12 }}><div style={{ ...S.logoBox, width: 30, height: 30, fontSize: 15 }}>⚡</div>TaskFlow.ai</div>
            <p style={{ color: '#475569', fontSize: 13, lineHeight: 1.6 }}>The AI-native project management platform for modern teams.</p>
          </div>
          {[
            { title: 'Product', links: ['Features', 'Pricing', 'Changelog', 'Roadmap'] },
            { title: 'Company', links: ['About', 'Blog', 'Careers', 'Press'] },
            { title: 'Legal', links: ['Privacy', 'Terms', 'Security', 'Cookies'] },
          ].map(col => (
            <div key={col.title}>
              <div style={S.footerTitle}>{col.title}</div>
              {col.links.map(l => <a key={l} className="footer-link" style={S.footerLink}>{l}</a>)}
            </div>
          ))}
        </div>
        <div style={S.footerBottom}>
          <span style={{ color: '#334155', fontSize: 13 }}>© 2026 TaskFlow.ai — Built with ❤️ and deployed on Railway</span>
          <span style={{ color: '#334155', fontSize: 13 }}><span style={S.statusDot} />All systems operational</span>
        </div>
      </footer>
    </div>
  );
}
