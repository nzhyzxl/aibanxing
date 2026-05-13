const withNextIntl = require('next-intl/plugin')('./i18n.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // 关闭构建时静态生成，避免 API 路由在构建时执行报错
  experimental: {
    isrMemoryCacheSize: 0,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.aliyuncs.com',
      },
      {
        protocol: 'http',
        hostname: 'thirdwx.qlogo.cn',
      },
      {
        protocol: 'https',
        hostname: 'thirdwx.qlogo.cn',
      },
      {
        protocol: 'http',
        hostname: 'wx.qlogo.cn',
      },
      {
        protocol: 'https',
        hostname: 'wx.qlogo.cn',
      },
    ],
  },
}

module.exports = withNextIntl(nextConfig)
