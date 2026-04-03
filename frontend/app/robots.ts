import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/site";

const siteUrl = getSiteUrl();

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  const robots: MetadataRoute.Robots = {
    rules: {
      userAgent: "*",
      allow: "/",
    },
  };

  if (siteUrl) {
    robots.host = siteUrl;
    robots.sitemap = `${siteUrl}/sitemap.xml`;
  }

  return robots;
}
