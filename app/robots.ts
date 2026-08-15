import type { MetadataRoute } from "next";
// Blanket Disallow YOK — X-Robots-Tag: noindex proxy.ts'ten geliyor.
// Ikisini birden koymak birbirini iptal eder.
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", disallow: ["/admin", "/an"] }] };
}
