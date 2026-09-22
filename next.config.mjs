/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/app',
        destination: '/radar',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;

