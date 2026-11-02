"use client";

import { useEffect } from "react";

export default function AdminPwa() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/admin-sw.js", { scope: "/admin" }).catch((error) => {
        console.error("Admin app registration failed", error);
      });
    }
  }, []);

  return null;
}
