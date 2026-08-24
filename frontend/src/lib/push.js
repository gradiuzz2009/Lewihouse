import { api } from "./api";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export async function enablePush() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) throw new Error("unsupported");
  const reg = await navigator.serviceWorker.register("/sw.js");
  const perm = await Notification.requestPermission();
  if (perm !== "granted") throw new Error("denied");
  const { data } = await api.get("/push/vapid-key");
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(data.public_key),
  });
  await api.post("/push/subscribe", { subscription: sub.toJSON() });
  return true;
}

export async function tryAutoSubscribe() {
  try {
    if ("Notification" in window && Notification.permission === "granted") await enablePush();
  } catch {}
}
