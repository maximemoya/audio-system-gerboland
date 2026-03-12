import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/audio-system-gerboland/',
  plugins: [react()],
  build: {
    outDir: 'docs',
  },
})
