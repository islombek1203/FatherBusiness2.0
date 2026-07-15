"use client";

import { useEffect } from "react";

export function RegisterServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Offline support is a progressive enhancement; a failed registration
        // (e.g. unsupported browser) should never block the app from working.
      });
    }
  }, []);

  return null;
}
