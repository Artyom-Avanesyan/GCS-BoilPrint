import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  minify: false,
  server:{
    port:5173,
    proxy: "http://localhost:8080"
  }
})
