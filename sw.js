// Jugada · service worker: la app abre sin conexión y el modelo de IA se descarga una sola vez
const VERSION = "jugada-0.1-piloto-A";
const SHELL = ["./", "index.html", "styles.css", "app.js", "drills.js", "config.js", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png"];
const HEAVY = ["cdn.jsdelivr.net", "storage.googleapis.com", "fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION && k !== "jugada-ia").map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (HEAVY.includes(url.hostname)) {
    // IA, fuentes: primero caché, porque no cambian
    e.respondWith(caches.open("jugada-ia").then(async c => {
      const hit = await c.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok || res.type === "opaque") c.put(req, res.clone());
      return res;
    }));
    return;
  }
  if (url.origin === location.origin) {
    // app: primero red para recibir cambios, caché si no hay señal
    e.respondWith(fetch(req).then(res => { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); return res; })
      .catch(() => caches.match(req).then(r => r || caches.match("index.html"))));
  }
});
