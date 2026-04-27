/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Keep prefetched + visited dynamic routes warm in the client
    // router cache for 5 minutes — bottom-tab switches read straight
    // from this cache instead of hitting the server.
    staleTimes: {
      dynamic: 300,
      static: 600,
    },
  },
};

export default nextConfig;
