import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@svcm/shared'],
  async rewrites() {
    const apiUrl = process.env.INTERNAL_API_URL || 'http://127.0.0.1:4000';
    return [
      {
        source: '/api/v1/:path*',
        destination: `${apiUrl}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
