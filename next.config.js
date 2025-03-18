/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    // Disable ISR for development
    isrMemoryCacheSize: 0,
    // Set one approach clearly
    appDir: false, // Using Pages Router
  }
}

module.exports = nextConfig