import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone-сборка для Docker/прод (минимальный runtime без node_modules).
  output: "standalone",
  // Не бандлить серверные пакеты БД (PGlite тащит WASM, postgres — нативный протокол).
  serverExternalPackages: ["@electric-sql/pglite", "postgres", "socks-proxy-agent", "nodemailer"],
};

export default nextConfig;
