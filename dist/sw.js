// Doll accessories Pattern Studio — offline cache
const PREFIX = 'doll-acc-';
const CACHE = PREFIX + 'v6';
const FONT_CACHE = PREFIX + 'fonts';
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './icon-maskable-192.png', './icon-maskable-512.png', './apple-touch-icon.png',
  './fonts/fraunces-400.woff2', './fonts/fraunces-500.woff2', './fonts/fraunces-600.woff2', './fonts/fraunces-700.woff2', './fonts/inter-400.woff2', './fonts/inter-500.woff2', './fonts/inter-600.woff2', './fonts/inter-700.woff2', './fonts/jetbrains-mono-400.woff2', './fonts/jetbrains-mono-500.woff2', './fonts/jetbrains-mono-600.woff2'];
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
// only remove this app's own old caches: sister apps on the same site keep theirs
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith(PREFIX) && k !== CACHE && k !== FONT_CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // other sites (the Supabase sync) always go straight to the network
  if (url.origin !== location.origin && !FONT_HOSTS.includes(url.hostname)) return;
  // Google Fonts: serve from cache, refresh in the background, so the app looks the same offline
  if (FONT_HOSTS.includes(url.hostname)) {
    e.respondWith(caches.open(FONT_CACHE).then(c => c.match(req).then(hit => {
      const net = fetch(req).then(res => { if (res.ok || res.type === 'opaque') c.put(req, res.clone()); return res; }).catch(() => hit);
      return hit || net;
    })));
    return;
  }
  // network first for the app page so updates arrive; cache fallback when offline
  if (req.mode === 'navigate' || url.pathname.endsWith('index.html')) {
    e.respondWith(fetch(req).then(res => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; }).catch(() => caches.match(req).then(r => r || caches.match('./index.html'))));
    return;
  }
  e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => { if (res.ok && url.origin === location.origin) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; }).catch(() => r)));
});
