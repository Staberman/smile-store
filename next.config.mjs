/** @type {import('next').NextConfig} */
const nextConfig = {
  // On Vercel, Next's built-in trailing-slash redirect runs before the
  // vercel.json redirects, so "/relojes/" would take two hops (strip the slash,
  // then the legacy rule). vercel.json strips trailing slashes itself instead,
  // in its last redirect, after the legacy Tiendanube rules.
  skipTrailingSlashRedirect: true,
  images: {
    // No Vercel image optimization: once the Hobby quota runs out, every
    // variant it has not cached fails with 402 and the photo shows empty.
    // lib/image-loader.mjs asks Tiendanube's CDN for the size instead.
    loader: "custom",
    loaderFile: "./lib/image-loader.mjs",
    remotePatterns: [
      { protocol: "https", hostname: "dcdn-us.mitiendanube.com" },
      { protocol: "https", hostname: "d1a9qnv764bsoo.cloudfront.net" },
      { protocol: "https", hostname: "http2.mlstatic.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
