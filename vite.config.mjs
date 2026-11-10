import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const { PORT = '3000' } = loadEnv(mode, process.cwd(), 'PORT');
    return {
        plugins: [react()],
        root: 'frontend',
        server: { host: '127.0.0.1', proxy: { '/api': { target: `http://127.0.0.1:${PORT}`, changeOrigin: true } } },
        build: { outDir: '../dist', emptyOutDir: true }
    };
});
