import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  cacheDir: 'scripts/tmp/game-matrix-vite-cache',
  server: { host: '127.0.0.1', port: 5184 },
  resolve: { alias: { '@': path.resolve('src') } },
});
