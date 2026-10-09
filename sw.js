// GitHub Pages shares one origin among several apps. Keep DocPronto caches isolated.
const CACHE_NAME = 'docpronto-shell-v2';
const APP_SHELL = [
  './',
  './index.html',
  './theme-v2.css',
  './style.css',
  './app.js',
  './proposal-core.js',
  './supabase-config.js',
  './ads-config.js',
  './ads.js',
  './beta-feedback.js',
  './i18n.js',
  './pwa.js',
  './live-update.js',
  './manifest.webmanifest',
  './icon.svg'
];
const APP_SCOPE = new URL(self.registration.scope);
const SHELL_PATHS = new Set(APP_SHELL.map(file => new URL(file, self.registration.scope).pathname));

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(APP_SHELL);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    // Never erase caches belonging to chibi.gg, ZeroTwo, AgendaLeve or other apps.
    await Promise.all(keys
      .filter(key => key.startsWith('docpronto-shell-') && key !== CACHE_NAME)
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(APP_SCOPE.pathname)) return;

  const isNavigation = event.request.mode === 'navigate';
  // Shared proposals may carry a private token in a legacy query parameter.
  // No query URLs or arbitrary dynamic resources are ever stored in Cache Storage.
  const canCache = !url.search && SHELL_PATHS.has(url.pathname);
  if (!canCache && !isNavigation) return;

  event.respondWith((async () => {
    try {
      const response = await fetch(event.request);
      if (canCache && response.ok && response.type === 'basic') {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(event.request, response.clone());
      }
      return response;
    } catch {
      if (canCache) {
        const cached = await caches.match(event.request);
        if (cached) return cached;
      }
      if (isNavigation) {
        // Serve only the public application shell, not another user's proposal.
        const shell = await caches.match(new URL('./index.html', self.registration.scope).href);
        if (shell) return shell;
      }
      return Response.error();
    }
  })());
});
