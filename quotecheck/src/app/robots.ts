import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard",
          "/settings",
          "/reset-password",
          "/forgot-password",
        ],
      },
    ],
    sitemap: "https://www.quotecheck.chat/sitemap.xml",
  };
}
