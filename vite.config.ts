import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // relative asset paths so the build works on GitHub Pages (served under /zetamac-tracker/)
  base: './',
  plugins: [react(), tailwindcss()],
  // IndexedDB is per address, port included. A fixed port keeps history in one place.
  server: { port: 5199, strictPort: true },
  test: {
    environment: 'node',
  },
})
