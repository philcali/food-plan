import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
const base = process.env.GITHUB_ACTIONS ? '/food-plan/' : '/';

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
})
