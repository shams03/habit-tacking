/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Transpile Three.js and React Three Fiber for Next.js bundler
  transpilePackages: ["three", "@react-three/fiber", "@react-three/drei"],
  // argon2 is a native Node.js addon (compiled C++ binary).
  // Webpack cannot bundle native .node files — keeping it external lets
  // Node.js load it via require() at runtime instead, which works on Vercel.
  experimental: {
    serverComponentsExternalPackages: ["argon2"]
  }
};

export default nextConfig;
