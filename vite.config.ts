import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // Nowy import dla v4

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // Aktywacja Tailwinda
  ],
  test: {
    globals: true,
    environment: 'jsdom',
  },
})