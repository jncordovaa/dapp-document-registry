/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      canvas: false,
    };

    // Ignore canvas package warnings
    config.resolve.alias.canvas = false;

    // Externalize pdfjs-dist for server-side rendering
    if (isServer) {
      config.externals.push('pdfjs-dist');
    }

    return config;
  },
}

module.exports = nextConfig