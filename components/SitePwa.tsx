"use client";

import { useEffect } from "react";

export default function SitePwa() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/site-sw.js", { scope: "/" }).catch((error) => {
        console.error("Site app registration failed", error);
      });
    }
  }, []);

  return null;
}
