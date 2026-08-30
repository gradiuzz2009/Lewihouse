/* eslint-disable no-restricted-globals */
/* global clients */
const CACHE_NAME = "lewi-house-v5";

// Install: skip waiting immediately
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

// Activate: clean all old caches and claim clients immediately
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first strategy for dynamic SPA and robust offline fallback
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== "GET") return;

  // API & WS calls: bypass cache completely
  if (url.pathname.startsWith("/api") || url.pathname.startsWith("/ws")) {
    return;
  }

  // SPA navigation requests (e.g. /portal, /rooms, /tenants, /login)
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match("/index.html"))
        .then((response) => response || caches.match("/index.html"))
    );
    return;
  }

  // Static assets: Network-first with cache fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && response.type === "basic") {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        return new Response("Offline", { status: 503, statusText: "Service Unavailable" });
      })
  );
});

// Push notification handler
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {}

  const options = {
    body: data.body || "",
    icon: "/logo192.svg",
    badge: "/logo192.svg",
    data: { url: data.url || "/" },
    vibrate: [100, 50, 100],
    actions: [],
    tag: data.type || "default",
    renotify: true,
  };

  if (data.type === "chat") {
    options.actions = [{ action: "reply", title: "Balas" }];
  } else if (data.type === "bill_reminder") {
    options.actions = [{ action: "view", title: "Lihat Tagihan" }];
  }

  event.waitUntil(
    self.registration.showNotification(data.title || "Lewi House", options)
  );
});

// Notification click handler with deep linking
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        if (w.url.includes(self.location.origin) && "focus" in w) {
          w.navigate(url);
          return w.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
