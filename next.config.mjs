/** @type {import('next').NextConfig} */
const nextConfig = {
  // On Vercel, Next's built-in trailing-slash redirect runs before the
  // vercel.json redirects, so "/relojes/" would take two hops (strip the slash,
  // then the legacy rule). vercel.json strips trailing slashes itself instead,
  // in its last redirect, after the legacy Tiendanube rules.
  skipTrailingSlashRedirect: true,
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
