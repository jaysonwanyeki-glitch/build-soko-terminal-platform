import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const now = new Date();

  const staticPages = [
    "", "/stocks", "/bonds", "/crypto", "/funds", "/indices", "/markets",
    "/trading-hours", "/calendar", "/ipos", "/screener", "/compare", "/tools",
    "/news", "/about", "/learn", "/login", "/register",
  ];

  return staticPages.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: path === "" ? "always" : "daily",
    priority: path === "" ? 1 : 0.8,
  }));
}
