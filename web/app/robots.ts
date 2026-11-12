import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      // The English expert-session page sits under /en/demo/ next to the
      // private per-customer demos, so it's allowed back in explicitly.
      allow: ["/", "/en/demo/expert"],
      // Never disallow /_next/: it serves the CSS, JS and optimized images
      // (/_next/image) that Google needs to render and rank the pages.
      disallow: [
        "/api/",
        "/admin",
        "/en/admin",
        "/dashboard",
        "/dashboard/",
        "/en/dashboard",
        "/demo/*",
        "/en/demo/*",
        "/team",
        "/en/team",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
