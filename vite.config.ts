import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Only include Sentry plugin in production builds with auth token
    ...(process.env.SENTRY_AUTH_TOKEN 
      ? [sentryVitePlugin({
          org: process.env.SENTRY_ORG || 'your-org',
          project: process.env.SENTRY_PROJECT || 'real-estate-dossier',
          authToken: process.env.SENTRY_AUTH_TOKEN,
          sourcemaps: {
            filesToDeleteAfterUpload: '**/*.map',
          },
        })]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
