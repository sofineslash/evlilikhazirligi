/**
 * Tek gercek kaynak. Etkinlik bilgisi VE her sayisal sinir burada.
 * PLAN.md "Kesinlesmis kararlar" tablosuyla birebir uyumlu tutulmali.
 *
 * YER TUTUCULAR: asagida <<< >>> ile isaretli her sey doldurulmali.
 * Kod hicbir yerde degismez, yalnizca bu dosya degisir.
 */

export const CFG = {
  // ---- Etkinlik -----------------------------------------------------------
  DAMAT: "Ömür Öz",
  GELIN: "Kübranur Yavaş",

  /** ISO 8601, saat dilimi ofseti ZORUNLU. Gun-modu bundan hesaplanir. */
  TARIH: "2026-10-29T19:00:00+03:00",
  ZAMAN_DILIMI: "Europe/Istanbul",
  GUN_MODU_BASLANGIC: "2026-10-29T00:00:00+03:00",
  GUN_MODU_BITIS: "2026-10-30T06:00:00+03:00",

  SALON_AD: "Asır Davet Balo & Kına Pendik Düğün Salonu",
  SALON_ADRES:
    "Çınardere Mh. Ankara Cd, Akseki Sokağı No:1, Pendik/İstanbul",

  /**
   * <<< SAHA ZIYARETINDE DOLDUR >>>
   * 0,0 birakilirsa iki harita butonu da Gine Korfezi'ni gosterir.
   * scripts/assert-config.ts bunu CI'da yakalar (E23).
   */
  SALON_KOORD: { lat: 0, lng: 0 },

  // ---- Yer tutucu metinler <<< DOLDUR >>> ---------------------------------
  DAMAT_AILESI: "<<< Damadın annesi & babası >>>",
  GELIN_AILESI: "<<< Gelinin annesi & babası >>>",
  /** Formu doldurmak istemeyenler icin gorunur insan kacis kapisi (Design T7-3) */
  ILETISIM_TEL: "<<< 05xx xxx xx xx >>>",
  /** Persembe 19:00 — yenecek mi? Davetli bunu soruyor. */
  YEMEK_NOTU: "<<< orn. Yemekli / Kokteyl ikramli >>>",
  OTOPARK_NOTU: "<<< orn. Salonun kapali otoparki mevcuttur >>>",
  /** Sayfanin kapanis beat'i — formdan sonra (Design Pass 3) */
  KAPANIS_METNI:
    "Sizi aramızda görmek bizim için çok kıymetli.",

  // ---- Katilim ------------------------------------------------------------
  /** Kendisi dahil toplam kisi */
  KISI_MAX: 10,
  /** normalize edilmis anahtarda, BOSLUKLAR DAHIL */
  AD_MIN_KARAKTER: 3,
  AD_MAX_KARAKTER: 60,
  DILEK_MAX_KARAKTER: 500,
  /** cihaz jetonu basina */
  KATILIM_HIZ: { adet: 10, pencere_dk: 60 },

  // ---- Admin --------------------------------------------------------------
  OTURUM_GUN: 30,
  GIRIS_HIZ: { adet: 5, pencere_dk: 15 },          // IP basina
  GIRIS_HIZ_GENEL: { adet: 30, pencere_dk: 15 },   // tum IP'ler toplami

  // ---- Medya (Faz 3 — bu surumde kullanilmiyor) ---------------------------
  PARCA_BAYT: 8 * 1024 * 1024,
  FOTO_UZUN_KENAR: 2048,
  FOTO_WEBP_KALITE: 0.8,
  VIDEO_MAX_SANIYE: 60,
  VIDEO_MAX_BAYT: 100 * 1024 * 1024,
  MEDYA_KOTA_BAYT: 20 * 1024 * 1024 * 1024,
  MIN_BOS_DISK_BAYT: 10 * 1024 * 1024 * 1024,

  // ---- Gorsel butcesi ----------------------------------------------------
  SAHNE_MAX_BAYT: 200 * 1024,        // islendikten SONRA hedef
  SAHNE_HAM_MAX_BAYT: 12 * 1024 * 1024,  // yuklenebilecek ham dosya tavani
} as const;

/** Harita linkleri — UA koklamadan, iki buton da her cihazda calisir. */
export function haritaLinkleri() {
  const { lat, lng } = CFG.SALON_KOORD;
  const q = encodeURIComponent(`${CFG.SALON_AD}, ${CFG.SALON_ADRES}`);
  const koordVar = lat !== 0 || lng !== 0;
  return {
    google: koordVar
      ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
      : `https://www.google.com/maps/search/?api=1&query=${q}`,
    apple: koordVar
      ? `https://maps.apple.com/?ll=${lat},${lng}&q=${q}`
      : `https://maps.apple.com/?q=${q}`,
  };
}

/** Gun-modu — UTC epoch'tan hesaplanir, yerel tarih dizesi ayristirmadan. */
export type GunModu = "oncesi" | "gun" | "sonrasi";
export function gunModu(simdi: Date = new Date()): GunModu {
  const t = simdi.getTime();
  if (t < Date.parse(CFG.GUN_MODU_BASLANGIC)) return "oncesi";
  if (t < Date.parse(CFG.GUN_MODU_BITIS)) return "gun";
  return "sonrasi";
}

/** Ekranda gosterilecek tarih — sabit, locale bagimsiz. */
export const TARIH_METNI = "29 Ekim 2026, Perşembe";
export const SAAT_METNI = "19:00";
