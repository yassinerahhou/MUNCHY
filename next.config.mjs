/** @type {import('next').NextConfig} */
const nextConfig = { reactStrictMode: true, devIndicators: false, allowedDevOrigins: ['172.16.0.2'], images: { qualities: [72, 75, 78, 82] }, distDir: process.env.MUNCHY_TEST_BUILD_DIR || '.next' };
export default nextConfig;
