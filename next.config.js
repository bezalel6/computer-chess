/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  webpack: (config, { isServer }) => {
    // Handle Stockfish.js web worker files
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'asset/resource',
    });

    return config;
  },
};

module.exports = nextConfig;