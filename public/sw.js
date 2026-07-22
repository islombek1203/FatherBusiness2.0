// Minimal hand-rolled service worker (no build-time library, since Turbopack
// is webpack-plugin-incompatible in Next 16). Strategy: cache-first for the
// static app shell, network-first-with-cache-fallback for page navigations,
// so previously visited read views stay available offline.
// Bumped to v2 to purge caches from before the router-request bypass below
// existed — old installs may have Next.js RSC/Flight responses wrongly
// cached under plain page URLs, which the `activate` handler's cleanup
// (delete any cache key that isn't CACHE_NAME) will now clear out.
// Bumped to v3 because the cache-first branch below also caught built JS
// chunks — after the product-unit field was removed and re-added, browsers
// that had those chunks cached kept running the old code (and hitting
// MISSING_MESSAGE for the translation key that came and went in between)
// even though the server was already serving the fix.
// Bumped to v4: the navigate handler used to cache-and-fall-back-to-cache
// for *every* URL, including "/" and every other page under the
// authenticated app shell. Those pages are per-user, fully dynamic SSR
// output (auth() + Prisma reads baked into the HTML at response time), not
// static content. Caching them meant: whenever the very first navigation
// fetch after reopening the browser failed — which it routinely does for a
// brief window right after a laptop wakes from sleep or a phone
// foregrounds the browser, before Wi-Fi/DNS has reconnected — the SW's
// `catch()` served yesterday's cached dashboard HTML straight out of
// storage instead. That HTML shows the session as logged in (because it
// was, when it was captured) with no further request ever made to check
// whether that's still true, and reacts to nothing because it's a frozen
// snapshot, not a live page — hence "still logged in" + "unusable until
// manual refresh". Only `/login` and `/offline` are truly public/static;
// every other navigation now always goes to the network, and on failure
// falls back to the generic offline page instead of a stale personalized
// one. (The `v3` bump's cache purge already clears out any old stale
// dashboard entries left behind by the pre-v4 behavior.)
const CACHE_NAME = "inventory-shell-v4";
const OFFLINE_URL = "/offline";
const PUBLIC_NAV_PATHS = ["/login", "/offline"];
const APP_SHELL = [
  "/login",
  "/offline",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
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

// Headers Next.js's client-side router puts on its own fetch() calls (RSC
// payload fetches for Link navigation, prefetch-on-hover, router.refresh()
// after a Server Action, etc — see app-router-headers.ts in Next's source).
// These requests reuse the *same URL* as the page itself but expect a
// `text/x-component` Flight stream back, not the `text/html` document a
// real navigation gets. Letting the cache-first branch below intercept them
// meant whichever variant (HTML vs Flight) was cached first under that URL
// won for every future request to it: once poisoned, soft navigation to
// that route either kept showing stale data forever (cache is never
// revalidated once populated) or failed to parse entirely (HTML served
// where a Flight stream was expected), which is what made the app feel
// slow/stuck and made links/buttons need a second click to do anything.
const NEXT_ROUTER_REQUEST_HEADERS = [
  "rsc",
  "next-router-state-tree",
  "next-router-prefetch",
  "next-router-segment-prefetch",
  "next-hmr-refresh",
  "next-url",
];

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never cache API/auth traffic — it must always reflect live server state.
  if (url.pathname.startsWith("/api")) return;

  // Never intercept Next.js's own router fetches — always let them hit the
  // network directly, uncached (see comment above).
  if (NEXT_ROUTER_REQUEST_HEADERS.some((header) => request.headers.has(header))) return;

  if (request.mode === "navigate") {
    // Only /login and /offline are public, static-ish, and safe to cache —
    // every other navigation is an authenticated, per-user, fully dynamic
    // page. Those must always come from the network live; on failure they
    // fall back to the generic offline page, never to a stale, personalized
    // snapshot of someone's session (see the v4 bump note above).
    const isPublic = PUBLIC_NAV_PATHS.includes(url.pathname);
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (isPublic) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => {
          if (isPublic) return (await caches.match(request)) || (await caches.match(OFFLINE_URL));
          return await caches.match(OFFLINE_URL);
        })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
    )
  );
});
