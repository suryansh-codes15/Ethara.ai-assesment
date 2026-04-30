import { motion } from 'framer-motion';

export default function Loader({ fullScreen = false, size = 'md' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-10 h-10', lg: 'w-16 h-16' };

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center gap-6 overflow-hidden"
        style={{ background: 'var(--surface-0)' }}>
        {/* Animated background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-[500px] h-[500px] rounded-full opacity-[0.05] animate-float"
            style={{ background: 'radial-gradient(circle, #6366f1, transparent)', top: '10%', left: '20%' }} />
          <div className="absolute w-[400px] h-[400px] rounded-full opacity-[0.03] animate-float"
            style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)', bottom: '15%', right: '10%', animationDelay: '2s' }} />
        </div>

        <div className="relative">
          {/* Outer rotating ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className={`${sizes.lg} rounded-full border-2 border-transparent border-t-indigo-500/40 border-r-indigo-500/40`}
          />
          {/* Inner pulsing logo */}
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-lg"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 0 20px rgba(99,102,241,0.4)' }}>
              T
            </div>
          </motion.div>
        </div>

        <div className="text-center space-y-1.5 z-10">
          <p className="text-[var(--text-primary)] font-bold tracking-tight">Initializing TaskFlow</p>
          <div className="flex items-center justify-center gap-1">
            <motion.span
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0 }}
              className="w-1.5 h-1.5 rounded-full bg-indigo-500"
            />
            <motion.span
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
              className="w-1.5 h-1.5 rounded-full bg-indigo-500"
            />
            <motion.span
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
              className="w-1.5 h-1.5 rounded-full bg-indigo-500"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-8">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className={`${sizes[size]} rounded-full border-2 border-[var(--border)] border-t-indigo-500`}
      />
    </div>
  );
}
