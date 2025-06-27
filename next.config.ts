import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    FARCASTER_HEADER: process.env.FARCASTER_HEADER,
  },
};

export default nextConfig;
