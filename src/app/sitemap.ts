import type { MetadataRoute } from "next";
import { siteConfig } from "@/data/site-config";
import { getProjects } from "@/lib/content";

/**
 * The sitemap is generated from the project data, so a new project is listed
 * automatically and a hidden one is left out — `getProjects()` already filters
 * `hidden: true`, and submitting a URL that is not linked from anywhere would
 * be pointless.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const projectRoutes: MetadataRoute.Sitemap = getProjects().map((project) => ({
    url: `${siteConfig.url}/projects/${project.slug}`,
    lastModified,
    changeFrequency: "monthly",
    priority: project.featured ? 0.8 : 0.6,
  }));

  return [
    {
      url: siteConfig.url,
      lastModified,
      changeFrequency: "monthly",
      priority: 1,
    },
    ...projectRoutes,
  ];
}
