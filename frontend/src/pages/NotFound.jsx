import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 text-center overflow-hidden"
      style={{ background: 'var(--surface-0)' }}>
      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[400px] h-[400px] rounded-full opacity-[0.03] animate-float"
          style={{ background: 'radial-gradient(circle, #ef4444, transparent)', top: '20%', left: '30%' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 max-w-md"
      >
        <span className="text-[120px] font-black gradient-text leading-none select-none opacity-20">404</span>
        <div className="mt-[-60px]">
          <h1 className="text-3xl font-bold text-white mb-3">Lost in the void?</h1>
          <p className="text-[var(--text-muted)] mb-8 leading-relaxed">
            The page you are looking for doesn't exist or has been moved to another dimension. 
            Let's get you back to safety.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/dashboard" className="btn-primary px-8 py-3 w-full sm:w-auto justify-center">
              Back to Dashboard
            </Link>
            <button onClick={() => window.history.back()} className="btn-secondary px-8 py-3 w-full sm:w-auto justify-center">
              Go Back
            </button>
          </div>
        </div>
      </motion.div>

      {/* Floating particles or code snippets could go here for extra premium feel */}
    </div>
  );
}
