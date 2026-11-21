import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: [
    "127.0.0.1",
    "localhost",
    "0.0.0.0",
    "*.run.app",
    "**.run.app",
    "*.googleusercontent.com",
    "**.googleusercontent.com",
  ],
};

export default nextConfig;
