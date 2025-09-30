import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        'process.env.REACT_APP_ARCGIS_API_KEY': JSON.stringify(env.REACT_APP_ARCGIS_API_KEY),
        'import.meta.env.VITE_API_BASE_URL': JSON.stringify(env.API_BASE_URL)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      optimizeDeps: {
        exclude: ['@arcgis/core', 'mysql2']
      },
      build: {
        chunkSizeWarningLimit: 1000,
        sourcemap: false,
        minify: 'esbuild', // Faster than terser
        target: 'es2020', // Modern target for faster builds
        rollupOptions: {
          external: ['@arcgis/core/assets/*'],
          output: {
            manualChunks: {
              vendor: ['react', 'react-dom', 'react-router-dom'],
              arcgis: ['@arcgis/core'],
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
            target: JSON.stringify(env.API_BASE_URL),
            changeOrigin: true,
            secure: false
          }
        }
      }
    };
});
