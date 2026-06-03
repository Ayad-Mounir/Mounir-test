const CACHE = "calc-v2";
const SCOPE = self.registration.scope;

const URLS = [
  SCOPE,
  SCOPE + "index.html",
  SCOPE + "style.css",
  SCOPE + "script.js",
  SCOPE + "manifest.json",
  SCOPE + "icon-192.svg",
  SCOPE + "icon-512.svg",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => {
      return Promise.allSettled(URLS.map((u) => c.add(u).catch(() => {})));
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((ks) =>
      Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then((r) => {
      const fetchPromise = fetch(e.request).then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, clone));
        }
        return res;
      });
      return r || fetchPromise;
    })
  );
});
