import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig, type Plugin} from 'vite';

/**
 * Plugin que injeta automaticamente um timestamp Unix no CACHE_VERSION do
 * service-worker.js a cada build, forçando todos os PWAs instalados a
 * atualizarem o cache sem intervenção manual.
 */
function swVersionPlugin(): Plugin {
  return {
    name: 'sw-version-inject',
    // Roda após o Vite copiar os arquivos de /public para /dist
    closeBundle() {
      const swPath = path.resolve(__dirname, 'dist/service-worker.js');
      if (!fs.existsSync(swPath)) return;

      const buildId = Date.now(); // timestamp único por build
      let content = fs.readFileSync(swPath, 'utf-8');

      // Substitui qualquer versão existente (linkflow-vN ou linkflow-build-N)
      content = content.replace(
        /const CACHE_VERSION = ['"](.*?)['"];/,
        `const CACHE_VERSION = 'linkflow-build-${buildId}';`
      );

      fs.writeFileSync(swPath, content, 'utf-8');
      console.log(`[sw-version-inject] CACHE_VERSION → linkflow-build-${buildId}`);
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), swVersionPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
            'vendor-motion': ['motion'],
            'vendor-icons': ['lucide-react'],
          },
        },
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
