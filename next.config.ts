/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbopack: {
      root: '.', // Esto le dice: "Tu mundo empieza en esta carpeta"
    },
  },
};

export default nextConfig;