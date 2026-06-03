const CACHE = "calc-v1";
const URLS = ["/Mounir-test/", "/Mounir-test/index.html", "/Mounir-test/style.css", "/Mounir-test/script.js", "/Mounir-test/manifest.json", "/Mounir-test/icon-192.svg", "/Mounir-test/icon-512.svg"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(URLS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((r) => r || fetch(e.request).catch(() => caches.match("/index.html")))
  );
});
