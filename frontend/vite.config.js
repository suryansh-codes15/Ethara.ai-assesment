import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Split vendor chunks so browsers can cache them separately
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor':  ['react', 'react-dom', 'react-router-dom'],
          'motion-vendor': ['framer-motion'],
          'dnd-vendor':    ['@hello-pangea/dnd'],
          'ui-vendor':     ['lucide-react', 'react-hot-toast'],
          'date-vendor':   ['date-fns'],
        }
      }
    },
    // Raise warning limit — our bundles are intentionally chunked
    chunkSizeWarningLimit: 600,
  },
  optimizeDeps: {
    // Pre-bundle heavy deps so cold-start dev server is faster
    include: [
      'react', 'react-dom', 'react-router-dom',
      'framer-motion', 'axios', 'socket.io-client',
      'lucide-react', 'date-fns', '@hello-pangea/dnd',
    ]
  }
})
