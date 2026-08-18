import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // The app's next/image usages are all static local files (the logo
    // mark) — Cloudflare Workers can't run Next's default Node/sharp-based
    // optimizer, and there's no remote/dynamic image source here that
    // would benefit from Cloudflare's own Images product.
    unoptimized: true,
  },
};

export default nextConfig;

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
