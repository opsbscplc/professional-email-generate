// Conditionally load bundle analyzer only if available
let withBundleAnalyzer
try {
  withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
  })
} catch (error) {
  // Bundle analyzer not available, use identity function
  withBundleAnalyzer = (config) => config
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['@google/generative-ai', 'clsx', 'tailwind-merge'],
  },
  // Code splitting and bundle optimization
  webpack: (config, { dev, isServer }) => {
    // Exclude client-only libraries from server bundle
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'pptxgenjs': 'commonjs pptxgenjs',
        'jspdf': 'commonjs jspdf'
      });
    }

    // Configure fallbacks for Node.js built-in modules in browser bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        path: false,
        os: false,
        stream: false,
        http: false,
        https: false,
        zlib: false,
        util: false,
        buffer: false,
        querystring: false,
        url: false,
      };

      // Ignore Node.js built-in modules that pptxgenjs and jspdf try to import
      const webpack = require('webpack');
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^(node:fs|node:https|node:http|node:path|node:crypto|node:stream|node:zlib|node:util|node:buffer|node:os|node:net|node:tls)$/,
        })
      );
    }

    if (!dev && !isServer) {
      // Split chunks for better caching
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            enforce: true,
          },
        },
      };
    }
    return config;
  },
  images: {
    domains: [],
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
    VERCEL_ENV: process.env.VERCEL_ENV,
  },
  // Production optimizations
  ...(process.env.NODE_ENV === 'production' && {
    compiler: {
      removeConsole: {
        exclude: ['error', 'warn'],
      },
    },
  }),
  // Security headers (additional layer, middleware handles most)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          }
        ],
      },
    ]
  },
  // Redirect HTTP to HTTPS in production
  async redirects() {
    if (process.env.NODE_ENV === 'production') {
      return [
        {
          source: '/(.*)',
          has: [
            {
              type: 'header',
              key: 'x-forwarded-proto',
              value: 'http',
            },
          ],
          destination: 'https://professional-email-generate.vercel.app/$1',
          permanent: true,
        },
      ]
    }
    return []
  },
  // Disable x-powered-by header
  poweredByHeader: false,
  // Enable compression
  compress: true,
  // Optimize builds
  swcMinify: true,
}

module.exports = withBundleAnalyzer(nextConfig)