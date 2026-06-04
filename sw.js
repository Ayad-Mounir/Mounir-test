const CACHE = "cm-v9";
const VERSION_CHECK = "/calcmaster-pro/version.json";

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) =>
      c.addAll([
        "/calcmaster-pro/",
        "/calcmaster-pro/index.html",
        "/calcmaster-pro/style.css",
        "/calcmaster-pro/script.js",
      ])
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((ks) =>
        Promise.all(
          ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Listen for "skip waiting" message from the page
self.addEventListener("message", (e) => {
  if (e.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (e) => {
  // Don't cache version.json — always go to network so update detection works
  if (e.request.url.includes("version.json")) {
    e.respondWith(fetch(e.request, { cache: "no-store" }));
    return;
  }

  e.respondWith(
    caches
      .match(e.request, { ignoreSearch: true })
      .then((r) => r || fetch(e.request))
  );
});
