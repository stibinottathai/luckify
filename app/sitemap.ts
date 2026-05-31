import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://luckify.vercel.app";
  const routes = [
    "",
    "/wheel",
    "/tree",
    "/dice",
    "/coin",
    "/scratch",
    "/picker",
    "/pendulum",
    "/lucky-envelope",
    "/fortune-teller",
    "/magic-8-ball",
    "/message-in-bottle",
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1.0 : 0.8,
  }));
}
