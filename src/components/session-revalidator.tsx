"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Auth is entirely server-side here (proxy.ts + each layout's `auth()`
// check) — there is no client-side session store to go stale. The actual
// staleness comes from the *page* itself going stale while the browser
// holds onto it without making a new request:
//
// - bfcache: closing a tab (or backgrounding a mobile browser) and coming
//   back to it later can restore the exact frozen DOM/JS state from before,
//   with zero network activity. If the session expired (or was revoked)
//   while the tab was gone, the restored page still shows yesterday's
//   logged-in dashboard, because nothing ever asked the server again.
// - reconnect: if the SW served the /offline fallback because the network
//   was briefly down (e.g. right as the OS wakes from sleep), the tab is
//   left sitting on that fallback even after connectivity returns, since
//   nothing retries automatically.
//
// `router.refresh()` re-runs the current route's server components (and
// therefore `auth()`) without a full reload, so a still-valid session
// re-renders with fresh data and an expired one redirects to /login via
// proxy.ts — exactly like a manual refresh, minus the manual part.
export function SessionRevalidator() {
  const router = useRouter();

  useEffect(() => {
    const revalidate = () => router.refresh();

    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) revalidate();
    };

    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("online", revalidate);

    return () => {
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("online", revalidate);
    };
  }, [router]);

  return null;
}
