import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@codex-remote/ui', '@codex-remote/remote-protocol'],
};

export default nextConfig;
