const CACHE_NAME = "fam-shell-v2";
const APP_SHELL = [
  "/manifest.json",
  "/icons/app/web-radio-app-192.png",
  "/icons/app/web-radio-app-512.png",
  "/icons/app/web-radio-app-maskable-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL).catch(() => undefined))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== location.origin) return;

  // O HTML e os bundles precisam refletir imediatamente as versões publicadas.
  // Nunca usar cache-first para navegação ou para os artefatos do Next.js.
  const isNavigation = request.mode === "navigate";
  const isNextAsset = url.pathname.startsWith("/_next/");

  if (isNavigation || isNextAsset) {
    event.respondWith(
      fetch(request, { cache: "no-store" }).catch(() =>
        isNavigation ? caches.match("/manifest.json") : Response.error()
      )
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok && APP_SHELL.includes(url.pathname)) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

// Se uma versão muito antiga ainda estiver ativa, ela será substituída pelo
// novo worker após a atualização normal do navegador.
