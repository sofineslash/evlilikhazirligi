/**
 * Sitenin AŞAMASI — misafire hangi sayfanın gösterileceği.
 *
 * Dört aşama, hangisi seçilirse o görünür:
 *   nisan_oncesi  : mevcut davetiye (VARSAYILAN — hiçbir şey ayarlanmamışsa bu)
 *   nisan_sonrasi : "Nişanlandık" + teşekkür + fotoğraf slaytı
 *   dugun_oncesi  : nişan öncesiyle aynı davetiye; düğün tarihi/salonu + kına
 *   dugun_sonrasi : "Evlendik" + teşekkür + fotoğraf slaytı
 *
 * SADECE sabitler ve saf fonksiyonlar — veritabanına dokunmaz. İstemci
 * bileşenleri de kullandığı için lib/metin.ts gibi better-sqlite3 zincirini
 * paketine sürüklememeli (build "Can't resolve 'fs'" ile kırılıyordu).
 */
export const ASAMALAR = ["nisan_oncesi", "nisan_sonrasi", "dugun_oncesi", "dugun_sonrasi"] as const;
export type Asama = (typeof ASAMALAR)[number];

export const VARSAYILAN_ASAMA: Asama = "nisan_oncesi";

export const ASAMA_ETIKET: Record<Asama, string> = {
  nisan_oncesi: "Nişan öncesi",
  nisan_sonrasi: "Nişan sonrası",
  dugun_oncesi: "Düğün öncesi",
  dugun_sonrasi: "Düğün sonrası",
};

export function asamaDogrula(v: unknown): Asama | null {
  return typeof v === "string" && (ASAMALAR as readonly string[]).includes(v) ? (v as Asama) : null;
}

export const sonrasiMi = (a: Asama): boolean => a === "nisan_sonrasi" || a === "dugun_sonrasi";
export const dugunMu = (a: Asama): boolean => a === "dugun_oncesi" || a === "dugun_sonrasi";
export type EtkinlikTur = "nisan" | "dugun";
export const turu = (a: Asama): EtkinlikTur => (dugunMu(a) ? "dugun" : "nisan");
