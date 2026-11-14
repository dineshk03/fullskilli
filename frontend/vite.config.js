import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/socket.io': { target: 'http://localhost:5001', ws: true },
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true
      }
    },
  },
  build: {
    // Increase chunk size warning limit to 1000kb
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (/node_modules\/(react|react-dom|scheduler|react-router|react-router-dom)\//.test(id)) return 'react-vendor';
          if (/node_modules\/(@reduxjs|react-redux|redux|immer|reselect)\//.test(id)) return 'redux-vendor';
          const iconFamily = id.match(/node_modules\/react-icons\/([^/]+)/);
          if (iconFamily) return 'icons-' + iconFamily[1];
          if (id.includes('/@fortawesome/')) return 'fontawesome-vendor';
          if (id.includes('/xlsx/')) return 'spreadsheet-vendor';
          if (id.includes('/jspdf/')) return 'pdf-vendor';
          if (id.includes('/html2canvas/')) return 'canvas-vendor';
          if (id.includes('/@supabase/')) return 'supabase-vendor';
          if (id.includes('/recharts/')) return 'recharts-vendor';
          if (id.includes('/chart.js/')) return 'chart-vendor';
          return undefined;
        }
      }
    }
  }
})
