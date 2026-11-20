// Ariadne's Table service worker: shows the family's notifications (silent, lock screen) and opens the right page when tapped.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { body: e.data ? e.data.text() : "" }; }
  e.waitUntil(self.registration.showNotification(d.title || "Ariadne's Table", {
    body: d.body || "", icon: "/img/pwa-icon-192.png", badge: "/img/pwa-icon-192.png",
    tag: d.tag || d.title, silent: true, data: { url: d.url || "/" },
  }));
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = new URL(e.notification.data?.url || "/", self.location.origin).href;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((cs) => {
    for (const c of cs) if ("focus" in c) { if (c.navigate) c.navigate(url); return c.focus(); }
    return self.clients.openWindow(url);
  }));
});
