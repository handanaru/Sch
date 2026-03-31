/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.hyperscan.com",
      },
    ],
  },
};

export default nextConfig;
