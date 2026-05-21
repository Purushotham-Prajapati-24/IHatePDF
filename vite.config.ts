import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  build: {
    chunkSizeWarningLimit: 2200,
    rollupOptions: {
      onwarn(warning, warn) {
        const message = warning.message ?? '';

        if (
          message.includes('qpdf-wasm-esm-embedded') && message.includes('externalized for browser compatibility')
        ) {
          return;
        }

        if (message.includes('INEFFECTIVE_DYNAMIC_IMPORT')) {
          return;
        }

        warn(warning);
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['assets/icon.svg'],
      manifest: {
        name: 'IHatePDF',
        short_name: 'IHatePDF',
        description: 'Local-first PDF tools that process files in your browser.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#11151c',
        theme_color: '#dc1e35',
        icons: [
          {
            src: '/assets/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,mjs,css,html,ico,png,svg,webp,wasm,json}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'font',
            handler: 'CacheFirst',
            options: {
              cacheName: 'ihatepdf-fonts',
              expiration: {
                maxEntries: 12,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: ({ url }) =>
              url.pathname.endsWith('.wasm') ||
              url.pathname.endsWith('.mjs') ||
              url.pathname.endsWith('.worker.js') ||
              url.pathname.includes('/workers/') ||
              url.pathname.endsWith('.traineddata') ||
              url.pathname.endsWith('.traineddata.gz'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'ihatepdf-processing-assets',
              expiration: {
                maxEntries: 40,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'ihatepdf-pages',
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
});
