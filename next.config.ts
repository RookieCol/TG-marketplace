import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
  allowedDevOrigins: ['192.168.2.16', 'de88-186-155-82-187.ngrok-free.app'],
}

export default nextConfig
