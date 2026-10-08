import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['test.solarcrm.local', 'localhost'],
    proxy: {
      '/uploads': {
        target: 'https://diassignments.digiinksolutions.com',
        changeOrigin: true,
        secure: false,
      },
      '/api': {
        target: 'https://diassignments.digiinksolutions.com',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})