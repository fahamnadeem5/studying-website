import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin", "/_next/static"],
      },
    ],
    sitemap: "https://studying-website.vercel.app/sitemap.xml",
    host: "studying-website.vercel.app",
  };
}