import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Transpile leaflet to handle it properly
  transpilePackages: ['leaflet'],
  
  // Configure webpack to handle leaflet
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
  
  // Optimize chunks to prevent loading issues
  experimental: {
    optimizePackageImports: ['leaflet']
  },
  
  // Disable eslint during build to check if compilation works
  eslint: {
    ignoreDuringBuilds: true,
  }
};

export default nextConfig;
