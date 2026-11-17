import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Lee VITE_API_URL del .env de la RAÍZ del repo (un solo .env para todo el proyecto).
  // En Docker la variable llega como build arg y tiene prioridad sobre el archivo.
  envDir: '..',
  server: { port: 5173 },
  preview: { port: 5173, strictPort: true },
});
