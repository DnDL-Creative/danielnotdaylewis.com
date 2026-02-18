import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 1. Only transpile Lucide (Helps tree-shake icons for speed)
  transpilePackages: ["lucide-react"],

  // Note: swcMinify is TRUE by default now, so we don't list it.

  images: {
    // 2. Prioritize AVIF (up to 50% smaller than WebP)
    formats: ["image/avif", "image/webp"],
    // 3. Add smaller mobile breakpoints (360, 480) for sharper mobile images
    deviceSizes: [360, 480, 640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "gpjgvdpicjqrerqqzhyx.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "utfs.io",
        port: "",
        pathname: "/**",
      },
    ],
  },

  // SEO: Redirect legacy URLs that return 404 in Google Search Console
  async redirects() {
    return [
      // /blogs/slug.html → /blog/slug (strip .html and fix path)
      {
        source: "/blogs/:slug(.*)\\.html",
        destination: "/blog/:slug",
        permanent: true,
      },
      // /blogs/slug → /blog/slug (fix plural path)
      {
        source: "/blogs/:slug*",
        destination: "/blog/:slug*",
        permanent: true,
      },
      // Legacy pages that no longer exist
      {
        source: "/copywriting",
        destination: "/collab",
        permanent: true,
      },
      {
        source: "/terms-of-use",
        destination: "/legal/terms-of-use",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
