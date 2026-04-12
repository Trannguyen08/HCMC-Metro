/** @type {import('next').NextConfig} */
const backendProxyTarget = process.env.BACKEND_PROXY_TARGET || "http://127.0.0.1:8000";

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/backend-api/:path*",
        destination: `${backendProxyTarget}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;

