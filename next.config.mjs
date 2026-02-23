/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ['@lobehub/ui', 'antd-style'],
    output: 'export',
    eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
