import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Only used for the Docker image build (set by the Dockerfile). Standalone
  // output is incompatible with `next start`, which local dev/test/`npm
  // start` rely on, so it must not be on unconditionally.
  output: process.env.BUILD_STANDALONE === "true" ? "standalone" : undefined,
  // Drop the "X-Powered-By: Next.js" response header (minor info disclosure).
  poweredByHeader: false,
  // Belt-and-suspenders: Caddyfile sets equivalent headers in front of the
  // Docker Compose deployment, but the app should be safe to run directly
  // (e.g. `next start` behind a bare load balancer) without depending on
  // that reverse proxy.
  //
  // CSP note: a per-request nonce (set from proxy.ts, App Router's
  // documented approach) was tried first, but response headers set from
  // `proxy.ts` never reached the client in this Next 16 build — verified
  // with a minimal repro (a proxy that does nothing but
  // `response.headers.set(...)`) under both `next dev` and `next start`;
  // only `next.config.js`'s `headers()` output actually reaches the
  // browser here. So this is a static CSP instead: no nonce means
  // 'unsafe-inline' is required on script-src (the App Router injects
  // inline `<script>` tags carrying the RSC payload on every page load,
  // with no nonce to attach without proxy support), which weakens the
  // policy against injected inline scripts. Re-attempt the nonce version
  // and drop 'unsafe-inline' if a future Next release fixes proxy header
  // propagation — the app has no `dangerouslySetInnerHTML` and never
  // renders user input as raw HTML, so the residual risk is low but not
  // zero.
  // No `upgrade-insecure-requests`: this header is served by the Node app
  // itself, which never terminates TLS (Caddy does, in front of it, and
  // already sends HSTS once a cert is issued). When the app is reached
  // directly over plain HTTP — `next dev`/`next start` with no Caddy, or a
  // LAN IP / mDNS `.local` hostname, both of which fall outside Chrome's
  // loopback-only "potentially trustworthy" allowance — this directive
  // silently upgrades every request, including the login form's own POST,
  // to `https://` on a server that doesn't speak TLS. The upgraded POST then
  // also fails the `form-action 'self'` check (scheme no longer matches),
  // so the browser drops the request outright with no visible error beyond
  // a failed/aborted connection.
  //
  // This same directive also lands on `/sw.js`'s own response (this
  // `headers()` matcher covers every route), which governs the service
  // worker's *own* execution context. That silently upgrades the fetch the
  // browser makes in the background to check `sw.js` for updates to
  // `https://`, which hangs against this plain-HTTP server. Confirmed live:
  // `navigator.serviceWorker.register()` still resolves (registration is
  // created), but `registration.installing/waiting/active` never populate
  // — the worker never installs, so it can never activate or control a
  // page. Net effect: PWA/offline support (`register-service-worker.tsx`,
  // `public/sw.js`) silently never turns on at all when self-hosted over
  // plain HTTP, on every single visit, not just intermittently.
  async headers() {
    const isDev = process.env.NODE_ENV === "development";
    const cspHeader = [
      "default-src 'self'",
      // 'unsafe-eval' is needed only in dev: React uses eval() there to
      // reconstruct server-side error stacks in the browser. Neither React
      // nor Next.js use eval() in production, so prod stays without it.
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' blob: data:",
      "font-src 'self'",
      "connect-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: cspHeader },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
