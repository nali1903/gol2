/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    API_KEY: process.env.API_KEY,
    ADMIN_KEY: process.env.ADMIN_KEY,
    MONGODB_CONNECT: process.env.MONGODB_CONNECT,
    NEXT_PUBLIC_API_KEY: process.env.NEXT_PUBLIC_API_KEY,
    NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY,
    CLOUDFLARE_TURNSTILE_SECRET_KEY: process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY,
    JWT_SECRET: process.env.JWT_SECRET,
    ADMIN_KEY: process.env.ADMIN_KEY,
  },
  images: {
    domains: ['images.unsplash.com'],
  },
    // Production'da tüm console.* çıktıları kaldır (error dahil)
  compiler: {
      removeConsole: process.env.NODE_ENV === 'production' ? true : false,
    },
  
  // API yapılandırması artık üst seviye 'api' olarak değil, config altında tanımlanmalı
  serverRuntimeConfig: {
    bodyParser: {
      sizeLimit: '5mb',
    },
  }
};

module.exports = nextConfig; 