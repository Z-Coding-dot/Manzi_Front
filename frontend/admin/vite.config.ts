import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
export default defineConfig({ plugins: [react(), tailwindcss()], resolve: { dedupe: ['react', 'react-dom', 'react-redux', '@reduxjs/toolkit', 'react-router-dom', 'i18next', 'react-i18next'], alias: { '@': path.resolve(import.meta.dirname, '../provider/src') } }, server: { port: 5175, strictPort: true, proxy: { '/api': 'http://localhost:3000' } } });
