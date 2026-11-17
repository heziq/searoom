import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// Relative base so the built site works from any path, including https://<user>.github.io/searoom/.
export default defineConfig({ base: './', plugins: [react()] });
