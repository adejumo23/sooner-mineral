import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        'process.env.REACT_APP_ARCGIS_API_KEY': JSON.stringify(env.REACT_APP_ARCGIS_API_KEY),
        'import.meta.env.VITE_API_BASE_URL': JSON.stringify(env.API_BASE_URL || env.VITE_API_BASE_URL)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      optimizeDeps: {
        exclude: ['mysql2', '@arcgis/core']
      },
      build: {
        chunkSizeWarningLimit: 1000,
        sourcemap: false,
        minify: 'esbuild',
        target: 'esnext',
        rollupOptions: {
          external: ['@arcgis/core'],
          output: {
            manualChunks: {
              vendor: ['react', 'react-dom', 'react-router-dom'],
            },
          },
        },
      },
      server: {
        fs: {
          allow: ['..']
        },
        proxy: {
          '/api': {
            target: env.API_BASE_URL || env.VITE_API_BASE_URL || 'http://localhost:3001',
            changeOrigin: true,
            secure: false
          }
        }
      }
    };
});
