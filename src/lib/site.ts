// Базовый адрес сайта для метаданных, robots и sitemap.
// Берётся из APP_URL (задаётся в .env на сервере), иначе — прод-домен.
export function siteUrl(): string {
  return (process.env.APP_URL || "https://fincourse.duckdns.org").replace(/\/$/, "");
}
