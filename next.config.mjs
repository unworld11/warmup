/** @type {import('next').NextConfig} */
const nextConfig = {
  // trigger.config.ts makes Next detect TS; don't let type/lint issues fail the build.
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  // Preview URLs clone a prospect's brand — keep them out of search indexes.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ];
  },
};

export default nextConfig;
