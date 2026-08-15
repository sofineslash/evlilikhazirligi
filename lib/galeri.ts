import { metin } from "./metin";

/**
 * Galeri gorunurlugu.
 *
 * VARSAYILAN KAPALI ve bu bilincli: misafirlerin cektigi fotograflar
 * kisisel. Kapaliyken galeri YALNIZCA yonetim panelinde var — davetiyede
 * hicbir iz yok, /api/an/<id> de admin disinda 404 doner.
 *
 * 001'deki `galeri_acik` bayragi yerine `metin.galeri_acik` kullaniliyor;
 * boylece admin panelindeki mevcut metin altyapisiyla duzenlenebiliyor.
 */
export type GaleriModu = "kapali" | "acik";

export function galeriModu(): GaleriModu {
  return metin("galeri_acik") === "acik" ? "acik" : "kapali";
}

export function galeriAcikMi(): boolean {
  return galeriModu() === "acik";
}
