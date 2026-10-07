/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel won't let some projects use a NEXT_PUBLIC_ name, so NEXT_API_URL works too.
  // `env` inlines the value into the browser bundle at build time (it is only a URL, not a secret).
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_API_URL || "",
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
