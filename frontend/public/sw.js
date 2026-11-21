// WorthSnap service worker: lets the installed app open and show your data
// without a connection.
//
// - The app shell (index.html and the hashed files under /assets/) is the
//   same for everyone. It's saved on install and refreshed on each online
//   page load. Offline, every page load gets the saved shell.
// - GET /api/* responses are your data. They go to the network first and a
//   copy of each good response is saved. With no network (or none within
//   NETWORK_TIMEOUT_MS when a copy exists), the saved copy is returned with
//   an X-WorthSnap-Offline header so the app can say it's showing saved data.
// - Sign-in, sign-out and anything that isn't a GET are left alone.

const SHELL_CACHE = "worthsnap-shell";
const API_CACHE = "worthsnap-api"; // also in src/lib/offline.ts
const SHELL_KEY = "/index.html";
const NETWORK_TIMEOUT_MS = 4000;
const MAX_ASSETS = 150;

const SAVED_AT_HEADER = "X-WorthSnap-Saved-At";
const OFFLINE_HEADER = "X-WorthSnap-Offline";

self.addEventListener("install", (event) => {
  event.waitUntil(refreshShell().catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keep = [SHELL_CACHE, API_CACHE];
      for (const name of await caches.keys()) {
        if (!keep.includes(name)) await caches.delete(name);
      }
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const path = url.pathname;
  if (/^\/(oauth2|login|logout)(\/|$)/.test(path)) return;

  if (path.startsWith("/api/")) {
    event.respondWith(apiNetworkFirst(event));
  } else if (path.startsWith("/assets/")) {
    event.respondWith(assetCacheFirst(request));
  } else if (request.mode === "navigate") {
    event.respondWith(shellNetworkFirst(event));
  }
});

// ---- App shell ----------------------------------------------------------

async function shellNetworkFirst(event) {
  const saved = await caches
    .open(SHELL_CACHE)
    .then((cache) => cache.match(SHELL_KEY, { ignoreVary: true }));

  const response = await networkOrTimeout(event, fetch(event.request), Boolean(saved), (res) =>
    isShell(res) ? saveShell(res) : undefined,
  );
  if (response) return response;

  return saved ?? offlineFallback();
}

function isShell(response) {
  return (
    response.ok &&
    response.type === "basic" &&
    (response.headers.get("Content-Type") ?? "").includes("text/html")
  );
}

async function refreshShell() {
  const response = await fetch("/", { cache: "no-store" });
  if (isShell(response)) await saveShell(response);
}

async function saveShell(response) {
  const html = await response.clone().text();
  await cacheAssets(html);
  await (await caches.open(SHELL_CACHE)).put(SHELL_KEY, response);
}

// Save the scripts and styles the shell references, so it renders offline
// even on the first visit, before this worker was in control.
async function cacheAssets(html) {
  const paths = new Set(html.match(/\/assets\/[^"'\s)]+/g) ?? []);
  const cache = await caches.open(SHELL_CACHE);
  await Promise.all(
    [...paths].map(async (path) => {
      if (await cache.match(path, { ignoreVary: true })) return;
      try {
        const response = await fetch(path);
        if (response.ok) await putAsset(cache, path, response);
      } catch {
        // Picked up next time.
      }
    }),
  );
}

// Files under /assets/ are content-hashed, so a saved copy never goes stale.
// Matched on URL alone: script requests carry an Origin header, and servers
// that send Vary: Origin would otherwise never match the saved copy.
async function assetCacheFirst(request) {
  const cache = await caches.open(SHELL_CACHE);
  const cached = await cache.match(request, { ignoreVary: true });
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) await putAsset(cache, request.url, response.clone());
  return response;
}

async function putAsset(cache, url, response) {
  await cache.put(url, response);
  // Old builds' files pile up across deploys. Drop the oldest.
  const keys = (await cache.keys()).filter((r) => new URL(r.url).pathname !== SHELL_KEY);
  for (const key of keys.slice(0, Math.max(0, keys.length - MAX_ASSETS))) {
    await cache.delete(key);
  }
}

// ---- API data -----------------------------------------------------------

async function apiNetworkFirst(event) {
  const { request } = event;
  const cache = await caches.open(API_CACHE);
  const saved = await cache.match(request, { ignoreVary: true });

  const response = await networkOrTimeout(event, fetch(request), Boolean(saved), (res) =>
    saveApiResponse(cache, request, res),
  );
  if (response) return response;

  if (saved) {
    const headers = new Headers(saved.headers);
    headers.set(OFFLINE_HEADER, "saved");
    return new Response(saved.body, { status: saved.status, headers });
  }
  return new Response(JSON.stringify({ error: "offline" }), {
    status: 503,
    headers: { "Content-Type": "application/json", [OFFLINE_HEADER]: "unavailable" },
  });
}

async function saveApiResponse(cache, request, response) {
  if (response.status === 401) {
    // Signed out or session expired: don't keep their data around.
    await caches.delete(API_CACHE);
    return;
  }
  if (!response.ok || response.type !== "basic") return;

  const headers = new Headers(response.headers);
  headers.set(SAVED_AT_HEADER, new Date().toISOString());
  const body = await response.clone().blob();
  await cache.put(request, new Response(body, { status: response.status, headers }));
}

// ---- Helpers ------------------------------------------------------------

/**
 * Resolves with the network response, or undefined if the network failed,
 * or if it took longer than NETWORK_TIMEOUT_MS while a saved copy exists.
 * Either way, a network response that arrives is handed to `save`.
 */
async function networkOrTimeout(event, network, hasSaved, save) {
  const saving = network.then((res) => save(res.clone())).catch(() => {});
  event.waitUntil(saving);
  try {
    return hasSaved
      ? await Promise.race([network, timeout(NETWORK_TIMEOUT_MS)])
      : await network;
  } catch {
    return undefined;
  }
}

function timeout(ms) {
  return new Promise((resolve) => setTimeout(() => resolve(undefined), ms));
}

function offlineFallback() {
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>WorthSnap</title>
<style>
  body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
         font-family: -apple-system, system-ui, sans-serif; background: #f8fafc; color: #0f172a; padding: 0 16px; text-align: center; }
  p { color: #64748b; font-size: 14px; }
  button { font: inherit; font-size: 14px; padding: 8px 16px; border-radius: 6px; border: 1px solid #cbd5e1; background: #fff; cursor: pointer; }
</style>
</head>
<body>
  <div>
    <h1 style="font-size: 20px; font-weight: 600">You're offline</h1>
    <p>Connect to the internet and open WorthSnap once. After that, it opens without a connection.</p>
    <button onclick="location.reload()">Try again</button>
  </div>
</body>
</html>`;
  return new Response(html, {
    status: 503,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
