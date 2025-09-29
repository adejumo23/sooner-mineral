import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    console.log(env, "In vite.config.ts");
    return {
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.REACT_APP_ARCGIS_API_KEY': JSON.stringify(env.REACT_APP_ARCGIS_API_KEY)
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
        minify: 'terser',
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true,
          },
        },
        rollupOptions: {
          external: ['@arcgis/core/assets/*'],
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
            target: JSON.stringify(env.API_BASE_URL),
            changeOrigin: true,
            secure: false
          }
        }
      }
    };
});
