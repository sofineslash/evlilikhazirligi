import type { NextConfig } from "next";

/*
 * Not: PLAN.md'ye gore `/` sonunda elle yazilmis statik HTML olarak Cloudflare
 * Pages'e tasinacak (madde E3). Su an yerelde gormek icin Next sayfasi olarak
 * duruyor. Sayfa tum icerigini lib/config.ts'ten okudugu ve govde saf
 * HTML/CSS oldugu icin cikarma islemi mekanik olacak.
 */
const nextConfig: NextConfig = {
  devIndicators: false,
  /* Bu paketler ikili (binary) tasiyor ve yollarini kendi modul
     konumlarindan hesapliyor. Bundle edilirlerse o konum degisiyor ve
     ikili bulunamiyor: ffmpeg/ffprobe icin bu "her video acilamadi"
     hatasi olarak geri donuyordu. */
  serverExternalPackages: [
    "better-sqlite3", "sharp", "ffmpeg-static", "@ffprobe-installer/ffprobe",
    /* libheif-js 6 MB WASM tasiyor; bundle edilince cozucu bulunamiyor
       ve HEIC sessizce cop goruntuye donusuyordu. */
    "heic-convert", "heic-decode", "libheif-js",
  ],
};

export default nextConfig;
