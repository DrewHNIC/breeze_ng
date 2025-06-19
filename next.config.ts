/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "iucltqyclynvzjjexxdl.supabase.co",
        pathname: "/storage/v1/object/public/menu-item-images/**",
      },
      {
        protocol: "https",
        hostname: "iucltqyclynvzjjexxdl.supabase.co",
        pathname: "/storage/v1/object/public/vendor-images/**",
      },
      {
        protocol: "https",
        hostname: "iucltqyclynvzjjexxdl.supabase.co",
        pathname: "/storage/v1/object/public/category-images/**",
      },
      {
        protocol: "https",
        hostname: "iucltqyclynvzjjexxdl.supabase.co",
        pathname: "/storage/v1/object/public/landing-videos/**",
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
