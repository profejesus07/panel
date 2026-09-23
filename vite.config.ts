import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Vercel sirve el sitio en la raíz de su propio dominio, pero GitHub
  // Pages lo sirve bajo /panel/ (un proyecto sin dominio propio siempre va
  // en una subcarpeta). El workflow de Pages define VITE_BASE_PATH=/panel/
  // al compilar; en cualquier otro entorno (Vercel, local) no está definida
  // y se usa la raíz.
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})
