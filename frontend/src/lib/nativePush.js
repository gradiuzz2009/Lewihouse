// Native mobile push (FCM) registration via Capacitor.
// No-ops on web; the PWA path (lib/push.js) handles browser Web Push.
import { api } from "./api";

let _registered = false;
let _lastToken = null;

async function getCapacitor() {
  try {
    const core = await import("@capacitor/core");
    return core.Capacitor;
  } catch {
    return null;
  }
}

export function isNative() {
  try {
    // Synchronous best-effort check
    return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  } catch {
    return false;
  }
}

export async function registerNativePush(navigate) {
  const Capacitor = await getCapacitor();
  if (!Capacitor || !Capacitor.isNativePlatform()) return; // web -> skip
  if (_registered) return;
  _registered = true;

  const { PushNotifications } = await import("@capacitor/push-notifications");

  PushNotifications.addListener("registration", async ({ value }) => {
    _lastToken = value;
    try {
      await api.post("/push/register-device", { token: value, platform: Capacitor.getPlatform() });
    } catch (e) {
      // will retry on next app launch
    }
  });

  PushNotifications.addListener("registrationError", () => {});

  PushNotifications.addListener("pushNotificationActionPerformed", ({ notification }) => {
    const url = notification?.notification?.data?.url || notification?.data?.url;
    if (url && typeof navigate === "function") {
      navigate(url);
    }
  });

  let perm = await PushNotifications.checkPermissions();
  if (perm.receive === "prompt" || perm.receive === "prompt-with-rationale") {
    perm = await PushNotifications.requestPermissions();
  }
  if (perm.receive !== "granted") {
    _registered = false;
    return;
  }
  await PushNotifications.register();
}

export async function unregisterNativePush() {
  const Capacitor = await getCapacitor();
  if (!Capacitor || !Capacitor.isNativePlatform()) return;
  if (_lastToken) {
    try {
      await api.post("/push/unregister-device", { token: _lastToken, platform: Capacitor.getPlatform() });
    } catch {}
  }
  _registered = false;
  _lastToken = null;
}
