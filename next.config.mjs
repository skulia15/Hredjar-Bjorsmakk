/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The share card reads its fonts and mug from disk at runtime; make sure they ship with those functions
  outputFileTracingIncludes: {
    '/api/tastings/*/share-image': ['./src/assets/fonts/**', './src/app/icon.svg'],
    '/t/*/scores/opengraph-image*': ['./src/assets/fonts/**', './src/app/icon.svg'],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.vinbudin.is',
        pathname: '/Portaldata/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'display-capture=(self "*")',
          },
        ],
      },
      {
        // Browsers must always fetch the latest service worker, or a fix to it never lands
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
        ],
      },
    ]
  },
};

export default nextConfig;
