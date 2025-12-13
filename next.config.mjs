/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  experimental: {},

  webpack(config) {
    config.resolve.extensions.push(".ts", ".tsx");
    return config;
  },
};

export default nextConfig;
