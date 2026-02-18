/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  // Disable image optimization for external URLs if needed
  images: {
    remotePatterns: [],
  },
};

module.exports = nextConfig;
