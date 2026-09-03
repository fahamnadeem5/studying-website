import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The catalog (data/alevelhub.db) is read at runtime via process.cwd(),
  // not imported, so Next's automatic file tracing would omit it from
  // serverless bundles (Vercel). Include it in every route's trace.
  outputFileTracingIncludes: {
    "/*": ["./data/alevelhub.db"],
  },
};

export default nextConfig;