import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

// Индексируем только публичную часть. Личный кабинет и API — закрыты.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/", "/study", "/lesson/", "/module/", "/quiz/", "/detective", "/glossary", "/calculators", "/pending", "/reset"],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
