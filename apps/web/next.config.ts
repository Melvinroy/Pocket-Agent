import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@pocket-agent/ui', '@pocket-agent/remote-protocol'],
};

export default nextConfig;
