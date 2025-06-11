/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // For Google User profile images
      },
      // You might need to add your Supabase storage hostname here if serving images from there
      // Example:
      // {
      //   protocol: 'https',
      //   hostname: '<YOUR_PROJECT_REF>.supabase.co',
      // },
    ],
  },
  // Exclude supabase/functions from build
  webpack: (config, { isServer }) => {
    config.externals = [...config.externals, "@node-rs/argon2", "@node-rs/bcrypt"];
    if (!isServer) {
      config.resolve.alias['supabase/functions'] = false;
    }
    return config;
  },
};

export default nextConfig;
