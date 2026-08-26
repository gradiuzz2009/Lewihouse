/* eslint-disable no-restricted-globals */
const CACHE_NAME = "lewi-house-v2";
const STATIC_ASSETS = ["/", "/index.html"];

// Install: cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first for API, cache-first for assets
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== "GET") return;

  // API calls: network-first
  if (url.pathname.startsWith("/api") || url.pathname.startsWith("/ws")) {
    return;
  }

  // Static assets: cache-first with network fallback
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type === "basic") {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);

      return cached || fetchPromise;
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

  // Add context-specific actions
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
      // Try to focus an existing window
      for (const w of wins) {
        if (w.url.includes(self.location.origin) && "focus" in w) {
          w.navigate(url);
          return w.focus();
        }
      }
      // Open a new window
      return clients.openWindow(url);
    })
  );
});

// Background sync for offline messages
self.addEventListener("sync", (event) => {
  if (event.tag === "send-message") {
    event.waitUntil(
      // Retrieve queued messages from IndexedDB and send them
      Promise.resolve()
    );
  }
});
