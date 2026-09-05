import { MetadataRoute } from "next";
import { SUBJECTS } from "@/lib/subjects";

const base = "https://studying-website.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: new Date() },
    { url: `${base}/about`, lastModified: new Date() },
    { url: `${base}/search`, lastModified: new Date() },
  ];

  // Subject pages and their sections
  for (const subject of SUBJECTS) {
    routes.push({
      url: `${base}/subjects/${subject.code}`,
      lastModified: new Date(),
    });

    // Section pages
    for (const type of ["yearly", "topical", "notes", "books"] as const) {
      routes.push({
        url: `${base}/subjects/${subject.code}/${type}`,
        lastModified: new Date(),
      });
    }
  }

  return routes;
}