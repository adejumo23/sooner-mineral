import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.REACT_APP_ARCGIS_API_KEY': JSON.stringify('AAPTxy8BH1VEsoebNVZXo8HurGaZ510fug7IIlKmzxyaebyhSdvhCxtFtTk4uoKPXcjb8AjAuqAYZfaC3V9o6lsJNtSYB7IoLe-VOOl4esdoS6-KH2rU8m-DIsZyyir2CXRLO7V4DF3Zo4OQN4WIhnBJzG01xl8SltUH95Aov3L_BrFWhZ3cmAAVQGwA4GGiF2QPp4yB7ZL5i6ZzUC9ri4rJfHs1wUQp6zY4tji6PMKvFbA.AT1_CZOagX1D')
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
        rollupOptions: {
          external: ['@arcgis/core/assets/*']
        }
      },
      server: {
        fs: {
          allow: ['..']
        }
      }
    };
});
