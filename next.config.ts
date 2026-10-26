import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Every visual asset in this project is local SVG or locally generated raster.
  // No remote image hosts are configured on purpose: it keeps the site fast,
  // avoids third-party requests, and means nothing can 404 because someone
  // else's CDN changed.
  images: {
    remotePatterns: [],
  },

  // Security headers. The site ships no inline secrets and makes no network
  // calls of its own, so these are cheap to set and worth having.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
