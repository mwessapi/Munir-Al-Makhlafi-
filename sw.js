// Service Worker اختياري: يخزّن الخطوط والأيقونات والصور وملفات المكتبات لتسريع الزيارات التالية.
// لا يخزّن أبداً بيانات Supabase (طلبات /rest/) ولا صفحة HTML نفسها، فتبقى البيانات والصفحة محدّثة دائماً.
const V = 'prof-assets-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== V).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || r.mode === 'navigate') return;
  const u = new URL(r.url);
  if (u.hostname.endsWith('supabase.co') && u.pathname.startsWith('/rest/')) return;

  const isAsset =
    /\.(?:woff2?|ttf|css|png|jpe?g|webp|gif|svg|avif|js)$/i.test(u.pathname) ||
    /fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|ibb\.co/.test(u.hostname) ||
    u.pathname.includes('/storage/v1/object/public/');
  if (!isAsset || u.origin === location.origin && u.pathname.endsWith('index.html')) return;

  e.respondWith(
    caches.open(V).then(async cache => {
      const hit = await cache.match(r);
      const net = fetch(r).then(res => {
        if (res && (res.ok || res.type === 'opaque')) cache.put(r, res.clone());
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
