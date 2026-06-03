const CACHE = "cm-v3";

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) =>
      c.addAll([
        "/Mounir-test/",
        "/Mounir-test/index.html",
        "/Mounir-test/style.css",
        "/Mounir-test/script.js",
      ])
    )
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
  e.respondWith(
    caches
      .match(e.request, { ignoreSearch: true })
      .then((r) => r || fetch(e.request))
  );
});
