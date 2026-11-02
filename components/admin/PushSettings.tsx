"use client";
import { useEffect, useState } from "react";

export async function adminRegistration() {
  // Use the admin registration explicitly: the public PWA also has a root worker.
  const registration = await navigator.serviceWorker.register("/admin-sw.js", {
    scope: "/admin",
    updateViaCache: "none",
  });
  if (!registration.active) {
    await new Promise<void>((resolve, reject) => {
      const worker = registration.installing || registration.waiting;
      if (!worker) {
        reject(new Error("Please reopen the app and try again."));
        return;
      }
      const timer = setTimeout(() => {
        cleanup();
        reject(new Error("Please reopen the app and try again."));
      }, 12000);
      function cleanup() {
        clearTimeout(timer);
        worker?.removeEventListener("statechange", changed);
      }
      function changed() {
        if (worker?.state === "activated") {
          cleanup();
          resolve();
        }
        if (worker?.state === "redundant") {
          cleanup();
          reject(new Error("Please reopen the app and try again."));
        }
      }
      worker.addEventListener("statechange", changed);
      changed();
    });
  }
  return registration;
}
async function pushRequest(path: string, method: string, body?: unknown) {
  const response = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || "Notifications could not be updated.");
  return data;
}
export async function disableDevicePush() {
  if (!("serviceWorker" in navigator)) return;
  const registration = await navigator.serviceWorker.getRegistration("/admin");
  const sub = await registration?.pushManager?.getSubscription();
  if (sub) {
    await pushRequest("/api/admin/push", "DELETE", { endpoint: sub.endpoint });
    await sub.unsubscribe();
  }
}
export default function PushSettings() {
  const [supported, setSupported] = useState(false);
  const [installed, setInstalled] = useState(true);
  const [denied, setDenied] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null,
  );
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    const iphone =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      !!(navigator as Navigator & { standalone?: boolean }).standalone;
    setInstalled(!iphone || standalone);
    const ok =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    setSupported(ok);
    setDenied(ok && Notification.permission === "denied");
    if (ok)
      adminRegistration()
        .then((r) => r.pushManager.getSubscription())
        .then((s) => {
          if (active) {
            setSubscription(s);
            setReady(true);
          }
        })
        .catch(() => {
          if (active) {
            setMessage(
              "Notifications could not be checked. Reopen the app to try again.",
            );
            setReady(true);
          }
        });
    else setReady(true);
    return () => {
      active = false;
    };
  }, []);
  async function act(action: "enable" | "disable" | "test") {
    setBusy(true);
    setMessage("");
    try {
      if (action === "enable") {
        // Permission must be requested directly from this tap, before network requests (iOS).
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          setDenied(permission === "denied");
          setMessage("Notifications were not enabled.");
          return;
        }
        const { publicKey } = await pushRequest("/api/admin/push", "GET");
        if (!publicKey)
          throw new Error("Push notifications have not been configured yet.");
        const raw = atob(publicKey.replace(/-/g, "+").replace(/_/g, "/"));
        const key = Uint8Array.from(raw, (c) => c.charCodeAt(0));
        const registration = await adminRegistration();
        const sub =
          (await registration.pushManager.getSubscription()) ||
          (await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: key,
          }));
        await pushRequest("/api/admin/push", "POST", {
          endpoint: sub.endpoint,
          keys: sub.toJSON().keys,
        });
        setSubscription(sub);
        setMessage("New inquiry alerts are enabled on this device.");
      } else if (action === "disable") {
        await disableDevicePush();
        setSubscription(null);
        setMessage("Notifications are disabled on this device.");
      } else {
        await pushRequest("/api/admin/push/test", "POST", {
          endpoint: subscription?.endpoint,
        });
        setMessage("Test sent. Check this device’s notifications.");
      }
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Notifications could not be updated.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      className="rounded-xl border border-primary-200 bg-cream p-4"
      aria-label="Push notifications"
    >
      <h2 className="font-display text-xl">New inquiry alerts</h2>
      <p className="mt-1 text-sm">
        Email goes to Jen as usual. Enable push separately on each admin device.
      </p>
      {!ready ? (
        <p className="mt-2 text-sm">Checking this device…</p>
      ) : !installed ? (
        <p className="mt-2 text-sm">
          On iPhone or iPad with iOS 16.4 or later: open admin in Safari, choose
          Share → Add to Home Screen, then open that app to enable
          notifications.
        </p>
      ) : !supported ? (
        <p className="mt-2 text-sm">
          Push is unavailable in this browser. You can still use the inbox and
          email notifications.
        </p>
      ) : denied ? (
        <p className="mt-2 text-sm">
          Notifications are blocked. Allow notifications for this app in your
          device settings, then reopen it.
        </p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-3">
          {subscription ? (
            <>
              <button
                className="btn-secondary min-h-11"
                disabled={busy}
                onClick={() => act("disable")}
              >
                Disable on this device
              </button>
              <button
                className="btn-primary min-h-11"
                disabled={busy}
                onClick={() => act("test")}
              >
                Send test notification
              </button>
            </>
          ) : (
            <button
              className="btn-primary min-h-11"
              disabled={busy}
              onClick={() => act("enable")}
            >
              Enable notifications
            </button>
          )}
        </div>
      )}
      <p role="status" className="mt-2 text-sm">
        {message}
      </p>
    </section>
  );
}
