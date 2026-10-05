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
/**
 * Tek bir gorunen satir, AD ve SOYAD ayri.
 *
 * Ayri tutuluyor cunku ikisi farkli renkte: ad koyu, soyad altin. Birlesik
 * metinden ayirmaya calismak ("Nurten Kazanasmaz"i bosluktan bolmek) iki
 * adli ya da iki kelimelik soyadi olan kisilerde yanlis yere bolerdi.
 */
export type EbeveynSatir = { ad: string; soyad: string };
export type EbeveynBlok = {
  /** Duz metin hali — baslik, paylasim metni gibi renksiz yerler icin. */
  satirlar: string[];
  /** Renklendirilerek cizilecek hali. satirlar ile AYNI sirada. */
  parcali: EbeveynSatir[];
  ortakSoyad: boolean;
};

export function ebeveynSatirlari(
  anneAd: string, anneSoyad: string,
  babaAd: string, babaSoyad: string,
  bicim: "birlikte" | "ayri" = "birlikte",
): EbeveynBlok {
  const a = anneAd.trim(), b = babaAd.trim();
  const as = anneSoyad.trim(), bs = babaSoyad.trim();
  if (!a && !b) return { satirlar: [], parcali: [], ortakSoyad: false };

  if (bicim === "birlikte" && a && b) {
    const soyad = bs || as;                       // ikisi ayni varsayilir
    const adlar = `${a} & ${b}`;
    return soyad
      ? {
          satirlar: [adlar, soyad],
          // Ortak soyad KENDI satirinda: ilk satirda soyad yok, ikincisinde ad yok.
          parcali: [{ ad: adlar, soyad: "" }, { ad: "", soyad }],
          ortakSoyad: true,
        }
      : { satirlar: [adlar], parcali: [{ ad: adlar, soyad: "" }], ortakSoyad: false };
  }

  // Ayri bicim: her ebeveyn kendi satirinda, adi ve soyadi ayri parcalar
  const parcali = [
    a ? { ad: a, soyad: as } : null,
    b ? { ad: b, soyad: bs } : null,
  ].filter(Boolean) as EbeveynSatir[];

  return {
    satirlar: parcali.map((p) => (p.soyad ? `${p.ad} ${p.soyad}` : p.ad)),
    parcali,
    ortakSoyad: false,
  };
}
