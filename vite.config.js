import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Дневник обещаний',
        short_name: 'Дневник',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#ffffff'
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}']
      },
    })
  ]
});
