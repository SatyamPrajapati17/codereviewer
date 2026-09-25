/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // Use localhost for local dev, backend:8000 for Docker
    // Skip rewrites if NEXT_PUBLIC_API_URL is not set (using mock data)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl || apiUrl === 'http://localhost:8000') {
      return [];
    }
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;