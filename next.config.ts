import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreBuildErrors: true,
  },
  trailingSlash: true,
  generateBuildId: () => 'build-' + Date.now(),
  reactStrictMode: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self), geolocation=(self)' },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.vercel-insights.com https://cdn.agora.io; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob: https://images.unsplash.com https://*.agora.io https://*.sd-rtn.com; font-src 'self' data:; connect-src 'self' https://kvpdfqbbwynlxicjxqmg.supabase.co https://*.supabase.co https://*.vercel.app https://cdn.vercel-insights.com https://geocode-maps.yandex.ru https://*.yandex.ru https://images.unsplash.com https://*.agora.io https://*.sd-rtn.com wss://*.supabase.co wss://*.agora.io wss://*.edge.agora.io wss://*.edge.sd-rtn.com wss://*.ap.sd-rtn.com; media-src 'self' blob: https://*.agora.io https://*.sd-rtn.com https://assets.mixkit.co; frame-src 'self' https://yandex.ru https://*.yandex.ru https://yandex.com;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
