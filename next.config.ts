import type { NextConfig } from "next";

/*
 * Not: PLAN.md'ye gore `/` sonunda elle yazilmis statik HTML olarak Cloudflare
 * Pages'e tasinacak (madde E3). Su an yerelde gormek icin Next sayfasi olarak
 * duruyor. Sayfa tum icerigini lib/config.ts'ten okudugu ve govde saf
 * HTML/CSS oldugu icin cikarma islemi mekanik olacak.
 */
const nextConfig: NextConfig = {
  devIndicators: false,
  serverExternalPackages: ["better-sqlite3", "sharp"],
};

export default nextConfig;
