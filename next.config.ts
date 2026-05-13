import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  trailingSlash: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self), geolocation=(self)' },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self' https://lavmee.ru https://lavmee.onrender.com https://*.onrender.com https://*.vercel.app https://date-future-9ed84.firebaseapp.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.vercel-insights.com https://cdn.agora.io https://lavmee.ru https://lavmee.onrender.com; style-src 'self' 'unsafe-inline' https://lavmee.ru https://lavmee.onrender.com; img-src 'self' data: https: blob: https://images.unsplash.com https://*.agora.io https://*.sd-rtn.com https://lavmee.ru https://lavmee.onrender.com https://*.firebaseio.com https://firebasestorage.googleapis.com; font-src 'self' data:; connect-src 'self' https://kvpdfqbbwynlxicjxqmg.supabase.co https://*.supabase.co https://api.supabase.com https://*.vercel.app https://cdn.vercel-insights.com https://geocode-maps.yandex.ru https://*.yandex.ru https://images.unsplash.com https://*.agora.io https://*.sd-rtn.com https://lavmee.ru https://lavmee.onrender.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://*.firebaseio.com https://firebasestorage.googleapis.com https://firestore.googleapis.com https://www.googleapis.com wss://*.supabase.co wss://*.agora.io wss://*.edge.agora.io wss://*.edge.sd-rtn.com wss://*.ap.sd-rtn.com wss://*.firebaseio.com; media-src 'self' blob: https://*.agora.io https://*.sd-rtn.com https://assets.mixkit.co; frame-src 'self' https://lavmee.ru https://lavmee.onrender.com https://yandex.ru https://*.yandex.ru https://yandex.com;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
