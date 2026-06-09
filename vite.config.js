import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// base '/MyGoals/' for the GitHub Pages project site (and `vite preview`,
// which serves the built dist); '/' in dev.
export default defineConfig(({ command, isPreview }) => ({
  base: command === 'build' || isPreview ? '/MyGoals/' : '/',
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: Number(process.env.PORT) || 5173,
  },
  preview: {
    host: '127.0.0.1',
    port: Number(process.env.PORT) || 4173,
  },
}))
