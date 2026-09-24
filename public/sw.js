// Minimale service worker: cachet alleen de app-shell zodat de kalender ook
// zonder netwerk opent (bv. in het tuinhuisje). Geen build-integratie nodig
// (geen vite-plugin-pwa) — hashed assets uit dist/assets/ worden gewoon
// runtime in de cache gezet zodra ze een keer zijn opgehaald.
//
// Versienummer ophogen als de app-shell-lijst hieronder verandert; dat
// forceert een schone cache bij de volgende activatie.
const CACHE_NAME = "tuintaak-shell-v1";
const APP_SHELL = ["./", "./index.html", "./manifest.json", "./icons/icon-192.png", "./icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  // Andere origins (o.a. Supabase) nooit cachen: die data moet live zijn;
  // offline valt de app zelf terug op zijn localStorage-kopieën.
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navigaties (het HTML-document zelf): netwerk eerst, zodat je altijd de
  // nieuwste versie krijgt zolang er verbinding is; offline val je terug op
  // de gecachete app-shell.
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("./index.html")));
    return;
  }

  // Overige same-origin requests (gebundelde JS/CSS/iconen): cache-first,
  // en wat nieuw is wordt bij het ophalen meteen in de cache gezet — zo
  // bouwt de offline-cache zich vanzelf op zonder de hashed bestandsnamen
  // uit de build vooraf te hoeven kennen.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
    })
  );
});
