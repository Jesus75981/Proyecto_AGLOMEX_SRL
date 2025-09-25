import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Configura el proxy para redirigir las peticiones de la API
  server: {
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
});



