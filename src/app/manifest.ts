import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "A-Level Hub — CAIE Past Papers, Notes & Books",
    short_name: "A-Level Hub",
    description:
      "Every CAIE A-Level resource in one place: yearly past papers, topical papers, notes and books.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#6366f1",
    icons: [
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
