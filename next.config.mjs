/** @type {import('next').NextConfig} */
const nextConfig = {
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
