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
  async headers() {
    const cspHeader = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' blob: data:",
      "font-src 'self'",
      "connect-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
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
