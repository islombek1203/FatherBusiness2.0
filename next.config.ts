import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Only used for the Docker image build (set by the Dockerfile). Standalone
  // output is incompatible with `next start`, which local dev/test/`npm
  // start` rely on, so it must not be on unconditionally.
  output: process.env.BUILD_STANDALONE === "true" ? "standalone" : undefined,
};

export default withNextIntl(nextConfig);
