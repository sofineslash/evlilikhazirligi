/**
 * Site genelinde kullanilan URL, guvenlik, sanitize ve telefon formatlama yardimcilari.
 */

export const DEFAULT_DAVETIYE_SLUG = "omur-kubra";
export const DEFAULT_DAVETIYE_ID = "kubranur-omur";

/**
 * Ortam degiskenine gore tam ve mutlak HTTPS URL uretir.
 * Kod icinde domainlerin hardcode edilmesini onler.
 */
export function siteUrl(yol = ""): string {
  const kok = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    "https://kubranur.omuroz.com.tr"
  ).replace(/\/+$/, "");

  if (!yol) return kok;
  const temizYol = yol.startsWith("/") ? yol : `/${yol}`;
  return `${kok}${temizYol}`;
}

/**
 * URL slug sanitization: yalnizca kucuk harf, rakam ve tireye izin verir.
 */
export function slugSanitize(slug: string): string {
  if (!slug) return DEFAULT_DAVETIYE_SLUG;
  const s = slug
    .toLocaleLowerCase("tr")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return s || DEFAULT_DAVETIYE_SLUG;
}

/**
 * XSS ve HTML enjeksiyonu onleme: HTML etiketlerini ve tehlikeli karakterleri temizler.
 */
export function metinSanitize(metin: string, maxLen = 60): string {
  if (!metin || typeof metin !== "string") return "";
  const temiz = metin
    .replace(/<[^>]*>/g, "")
    .replace(/[<>'"&()]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return temiz.slice(0, maxLen);
}

/**
 * Telefon numarasi normalizasyonu:
 * wa.me URL'sinde kullanilmak uzere yalnizca rakamlardan olusan uluslararasi format uretir.
 * +90, 0090, 05xx ve uluslararasi numaralari guvenle ele alir.
 */
export function telefonNormalize(tel?: string | null, varsayilanUlkeKodu = "90"): string {
  if (!tel || typeof tel !== "string") return "";

  // Tum rakam disi karakterleri (+, parantez, tire, bosluk) temizle
  let rakamlar = tel.replace(/\D/g, "");
  if (!rakamlar) return "";

  // 00 ile basliyorsa uluslararasi cikis kodunu kaldir (orn. 0090... -> 90...)
  if (rakamlar.startsWith("00")) {
    rakamlar = rakamlar.slice(2);
  }

  // Turkiye formati: 05xx... (11 hane) ise basindaki 0'i kaldir ve 90 ekle
  if (rakamlar.startsWith("0") && rakamlar.length === 11) {
    rakamlar = `${varsayilanUlkeKodu}${rakamlar.slice(1)}`;
  } else if (rakamlar.length === 10 && rakamlar.startsWith("5")) {
    // 5xx... (10 hane) ise varsayilan ulke kodunu ekle
    rakamlar = `${varsayilanUlkeKodu}${rakamlar}`;
  }

  return rakamlar;
}
