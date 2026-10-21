/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "dcdn-us.mitiendanube.com" },
      { protocol: "https", hostname: "d1a9qnv764bsoo.cloudfront.net" },
      { protocol: "https", hostname: "http2.mlstatic.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
