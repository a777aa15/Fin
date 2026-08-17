import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Не бандлить серверные пакеты БД (PGlite тащит WASM, postgres — нативный протокол).
  serverExternalPackages: ["@electric-sql/pglite", "postgres", "socks-proxy-agent"],
};

export default nextConfig;
