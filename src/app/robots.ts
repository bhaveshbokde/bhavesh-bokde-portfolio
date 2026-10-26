import type { MetadataRoute } from "next";
import { siteConfig } from "@/data/site-config";

/**
 * robots.txt.
 *
 * The site is meant to be found by recruiters and by search, so everything is
 * allowed. Next's own build output under `/_next/` is excluded because it is
 * noise in a crawl rather than content.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/_next/"],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
