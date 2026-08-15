import fs from "node:fs";
import path from "node:path";

/**
 * Gorsel sozlesmesi.
 *
 * Site public/scenes/ altindan SABIT adlarla okur. Dosya varsa gosterir,
 * yoksa yer tutucu cizer — kirik kutu ASLA gorunmez. Uzanti serbest:
 * .webp tercih edilir ama .jpg/.jpeg/.png de kabul edilir, boylece
 * telefondan cikan dosyayi donusturmeden atabilirsin.
 *
 * Tum sahneler 4:5 DIKEY (telefon once). Tasarim incelemesi karari:
 * tek en-boy orani, her sahnede acik width/height.
 */
export const ORAN = { w: 1080, h: 1350 } as const; // 4:5

export type SahneAd =
  | "01-kapak" | "02-cift"
  | "06-gelin" | "07-damat";

/**
 * "sahne" -> 4:5 dikey, kirpilarak doldurulur (fon ve bolum gorselleri)
 * "png"   -> oran KORUNUR, seffaflik KORUNUR, kirpilmaz (kesme figur)
 */
export type SahneTur = "sahne" | "png";

export const SAHNELER: { ad: SahneAd; aciklama: string; alt: string; tur: SahneTur }[] = [
  { ad: "01-kapak",   aciklama: "Davetiyenin ARKA FONU",            alt: "", tur: "sahne" },
  { ad: "02-cift",    aciklama: "Çift portresi",                    alt: "Çift birlikte", tur: "sahne" },
  { ad: "06-gelin",   aciklama: "Kartin SOL ustu — Kübranur (arka plansiz PNG)", alt: "Kübranur", tur: "png" },
  { ad: "07-damat",   aciklama: "Kartin SAG ustu — Ömür (arka plansiz PNG)",     alt: "Ömür",     tur: "png" },
];

export const UZANTILAR = [".webp", ".jpg", ".jpeg", ".png", ".avif"];

/** Repo icindeki klasor — buraya konan dosya BUILD'e girer ve Pages'ten servis edilir. */
const REPO_KOK = path.join(process.cwd(), "public", "scenes");

/** Kalici disk — admin panelinden yuklenenler. Docker'da nisan-medya volume'u. */
export const MEDYA_KOK = process.env.MEDYA_KOK || path.join(process.cwd(), "medya", "scenes");

/**
 * Cozumleme sirasi:
 *   1) public/scenes/  — repoya commit'lenmis, kutudan BAGIMSIZ. Kazanir.
 *   2) medya/scenes/   — admin panelinden yuklenmis, kalici diskte.
 *   3) null            — yer tutucu cizilir.
 */
export function sahneYolu(ad: SahneAd): string | null {
  for (const u of UZANTILAR) {
    if (fs.existsSync(path.join(REPO_KOK, ad + u))) return `/scenes/${ad}${u}`;
  }
  for (const u of UZANTILAR) {
    if (fs.existsSync(path.join(MEDYA_KOK, ad + u))) {
      // Onbellek kirici: dosya degisince tarayici yeni surumu alsin
      const mt = fs.statSync(path.join(MEDYA_KOK, ad + u)).mtimeMs;
      return `/api/sahne/${ad}?v=${Math.floor(mt)}`;
    }
  }
  return null;
}

/** Yuklenen dosyanin diskteki tam yolunu doner (varsa). */
export function yuklenenDosya(ad: SahneAd): { yol: string; uzanti: string } | null {
  for (const u of UZANTILAR) {
    const y = path.join(MEDYA_KOK, ad + u);
    if (fs.existsSync(y)) return { yol: y, uzanti: u };
  }
  return null;
}

/** public/scenes/ icinde repo surumu var mi — panel bunu "kilitli" gosterir. */
export function repoSurumuVar(ad: SahneAd): boolean {
  return UZANTILAR.some((u) => fs.existsSync(path.join(REPO_KOK, ad + u)));
}

/** Kac sahne hazir — admin panelinde gostermek icin. */
export function sahneTuru(ad: SahneAd): SahneTur {
  return SAHNELER.find((s) => s.ad === ad)?.tur ?? "sahne";
}

export function sahneDurumu() {
  return SAHNELER.map((s) => ({
    ...s,
    yol: sahneYolu(s.ad),
    repoda: repoSurumuVar(s.ad),
    yuklenmis: yuklenenDosya(s.ad) !== null,
  }));
}
