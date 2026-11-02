import { CFG, TARIH_METNI, SAAT_METNI } from "./config";
import { metin } from "./metin";
import { VARSAYILAN_ASAMA, asamaDogrula, dugunMu } from "./asama";
import { tarihCoz } from "./tarih-tr";

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

/**
 * "Otomatik" modda yuklemenin ACILDIGI an: kayitli asama dugun ise dugun
 * tarihi, degilse nisan tarihi (CFG.TARIH — oncekiyle ayni). Dugun tarihi
 * girilmemisse hic acilmaz; admin "Acik" secerek acabilir.
 */
function acilisZamani(): { ms: number; metin: string } {
  const asama = asamaDogrula(metin("asama")) ?? VARSAYILAN_ASAMA;
  if (dugunMu(asama)) {
    const t = tarihCoz(metin("dugun_tarih"), metin("dugun_saat"));
    if (t) return { ms: Date.parse(t.iso), metin: `${t.metin}, saat ${t.saatMetni}` };
    return { ms: Number.POSITIVE_INFINITY, metin: "" };
  }
  return { ms: Date.parse(CFG.TARIH), metin: `${TARIH_METNI}, saat ${SAAT_METNI}` };
}

export function yuklemeAcikMi(simdi: Date = new Date()): boolean {
  const m = yuklemeModu();
  if (m === "acik") return true;
  if (m === "kapali") return false;
  // otomatik: etkinlik saatinde acilir. UTC epoch karsilastirmasi —
  // yerel tarih dizesi ayristirmadan, saat dilimi ofseti tarihin icinde.
  return simdi.getTime() >= acilisZamani().ms;
}

/** Kapaliyken misafire gosterilecek yazi (kayitli asamaya gore). */
export function yuklemeMesaji(): string {
  const { metin: zaman } = acilisZamani();
  return zaman
    ? `Fotoğraf yükleme ${zaman}'da açılacaktır.`
    : "Fotoğraf yükleme etkinlik gününde açılacaktır.";
}

/**
 * Eski sabit — nisan icin ayni metin. Yeni kod yuklemeMesaji() kullanmali;
 * bu yalniz geriye donuk uyumluluk icin duruyor.
 */
export const YUKLEME_MESAJI =
  `Fotoğraf yükleme ${TARIH_METNI}, saat ${SAAT_METNI}'da açılacaktır.`;
