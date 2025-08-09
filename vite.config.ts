import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Read the base path from the environment without requiring Node types.
const basePath = (
  globalThis as { process?: { env?: { VITE_BASE_PATH?: string } } }
).process?.env?.VITE_BASE_PATH ?? './'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Allow the base path to be configured at build time so that the app can
  // be served from different directories on GitHub Pages.
  base: basePath,
  // Skip minification to surface full React error messages in production
  // builds when debugging issues like the blank page seen on Pages.
  build: {
    minify: false,
  },
})
