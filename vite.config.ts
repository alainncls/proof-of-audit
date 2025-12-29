import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePluginRadar } from 'vite-plugin-radar';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      ...(env.VITE_GA_ID
        ? [
            VitePluginRadar({
              analytics: {
                id: env.VITE_GA_ID,
              },
            }),
          ]
        : []),
    ],
  };
});
