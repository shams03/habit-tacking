/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Transpile Three.js and React Three Fiber for Next.js bundler
  transpilePackages: ["three", "@react-three/fiber", "@react-three/drei"],
  // No native packages remain — serverComponentsExternalPackages not needed.
};

export default nextConfig;
