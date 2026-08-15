import { db, ayarOku, ayarYaz } from "./db";
import type { MetinAnahtar } from "./metin-alanlari";

export { METIN_ALANLARI, type MetinAnahtar } from "./metin-alanlari";

/**
 * Duzenlenebilir metinler. Admin panelinden degistirilir, deploy gerekmez.
 * Bos birakilan alan sayfada HIC gosterilmez (yer tutucu da cizilmez).
 */
export function metin(anahtar: MetinAnahtar): string {
  return ayarOku(`metin.${anahtar}`, "").trim();
}

export function tumMetinler(): Record<string, string> {
  try {
    const rows = db()
      .prepare("SELECT anahtar, deger FROM ayarlar WHERE anahtar LIKE 'metin.%'")
      .all() as { anahtar: string; deger: string }[];
    return Object.fromEntries(rows.map((r) => [r.anahtar.slice(6), r.deger ?? ""]));
  } catch (e) {
    // Migration'dan once (derleme ani) tablo yok — bos donmek dogru.
    if (e instanceof Error && /no such table/i.test(e.message)) return {};
    throw e;
  }
}

export function metinYaz(anahtar: string, deger: string): void {
  ayarYaz(`metin.${anahtar}`, deger);
}

/**
 * Bir tarafin ebeveyn satirlarini uretir.
 *
 * Bicim ARTIK ACIK SECIM (otomatik algilama kaldirildi — bosanmis ama ayni
 * soyadi tasiyan ebeveynlerde ve farkli soyadi olup birlikte yazilmak
 * istenen durumlarda otomatik kural yanlis sonuc veriyordu):
 *
 *   "birlikte" -> ["Havva & Cemil", "ÇETİNKAYA"]      soyad altta, ortalanmis
 *   "ayri"     -> ["Havva ÇETİNKAYA", "Cemil BUDAK"]  her biri kendi satirinda
 */
export type EbeveynBlok = { satirlar: string[]; ortakSoyad: boolean };

export function ebeveynSatirlari(
  anneAd: string, anneSoyad: string,
  babaAd: string, babaSoyad: string,
  bicim: "birlikte" | "ayri" = "birlikte",
): EbeveynBlok {
  const a = anneAd.trim(), b = babaAd.trim();
  const as = anneSoyad.trim(), bs = babaSoyad.trim();
  if (!a && !b) return { satirlar: [], ortakSoyad: false };

  if (bicim === "birlikte" && a && b) {
    const soyad = bs || as;                       // ikisi ayni varsayilir
    return soyad
      ? { satirlar: [`${a} & ${b}`, soyad], ortakSoyad: true }
      : { satirlar: [`${a} & ${b}`], ortakSoyad: false };
  }

  return {
    satirlar: [
      a && `${a}${as ? " " + as : ""}`,
      b && `${b}${bs ? " " + bs : ""}`,
    ].filter(Boolean) as string[],
    ortakSoyad: false,
  };
}
