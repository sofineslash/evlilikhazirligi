import { CFG, TARIH_METNI, SAAT_METNI } from "./config";
import { metin } from "./metin";

/**
 * Fotograf yuklemenin acik olup olmadigi.
 *
 * SUNUCU TARAFI: metin() -> db -> better-sqlite3 -> fs zinciri var,
 * istemci bileseninden import EDILEMEZ. Sonuc prop olarak gecirilir.
 *
 * Karar tek yerde veriliyor; hem davetiyedeki buton hem /an sayfasi
 * bunu cagiriyor. Iki yerde ayri kural yazilsaydi biri digerinden
 * kayar ve buton "acik" derken sayfa "kapali" diyebilirdi.
 */
export type YuklemeModu = "otomatik" | "acik" | "kapali";

export function yuklemeModu(): YuklemeModu {
  const m = metin("yukleme_modu");
  return m === "acik" || m === "kapali" ? m : "otomatik";
}

export function yuklemeAcikMi(simdi: Date = new Date()): boolean {
  const m = yuklemeModu();
  if (m === "acik") return true;
  if (m === "kapali") return false;
  // otomatik: nisan saatinde acilir. UTC epoch karsilastirmasi —
  // yerel tarih dizesi ayristirmadan, saat dilimi ofseti CFG.TARIH'te.
  return simdi.getTime() >= Date.parse(CFG.TARIH);
}

/** Kapaliyken misafire gosterilecek yazi. */
export const YUKLEME_MESAJI =
  `Fotoğraf yükleme ${TARIH_METNI}, saat ${SAAT_METNI}'da açılacaktır.`;
