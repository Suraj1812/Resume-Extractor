import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/site";

const siteUrl = getSiteUrl();

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  if (!siteUrl) {
    return [];
  }

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
