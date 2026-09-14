import { metinSanitize, telefonNormalize } from "./site";

export type WhatsappMesajParams = {
  sablon?: string | null;
  gelin: string;
  damat: string;
  tarih: string;
  saat?: string;
  salon: string;
  url: string;
  misafir?: string | null;
};

/**
 * URL'deki guest parametresini guvenle isim formatina cevirir.
 * orn. "ahmet-yilmaz" -> "Ahmet Yılmaz"
 */
export function misafirAdiFormatla(guest?: string | null): string {
  if (!guest || typeof guest !== "string") return "";
  const temiz = metinSanitize(guest, 60)
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!temiz) return "";

  return temiz
    .split(" ")
    .filter(Boolean)
    .map((kelime) => {
      if (kelime.length === 0) return "";
      const ilk = kelime[0].toLocaleUpperCase("tr");
      const kalan = kelime.slice(1).toLocaleLowerCase("tr");
      return `${ilk}${kalan}`;
    })
    .join(" ");
}

export const VARSAYILAN_WHATSAPP_SABLONU = `{cift}

Özel günümüzde sizleri de aramızda görmekten mutluluk duyarız.

Davet detayları ve katılım için:
{link}`;

/**
 * WhatsApp paylasim mesajini dinamik alanlar ve yer tutucular ile uretir.
 */
export function whatsappMesajiUret(params: WhatsappMesajParams): string {
  const {
    sablon,
    gelin,
    damat,
    tarih,
    saat = "19:00",
    salon,
    url,
    misafir,
  } = params;

  let metin = (sablon && sablon.trim().length > 0) ? sablon : VARSAYILAN_WHATSAPP_SABLONU;
  // Eski sablonlardan kalma basindaki 💌 emojisini temizle
  metin = metin.replace(/💌\s*\{cift\}/gi, "{cift}");
  // Android ve iOS uyumlulugu: gorunmez Variation Selector-16 (\uFE0F) bazi cihazlarda soru isaretine () donusur.
  // Bu nedenle tek kod noktali evrensel kalp (❤ \u2764) kullanilir, varyasyon secici ve soru isareti/FFFD temizlenir.
  metin = metin.replace(/\uFE0F/g, "").replace(/\uFFFD/g, "❤");

  const cift = `${gelin} ❤ ${damat}`;

  // Sablonda dogrudan cift isimleri eski baglacla (&, soru isareti veya varyasyon secicili kalp) yazilmissa guncelle
  const ciftRegex = new RegExp(`${gelin}\\s*[?&❤️❤\\uFFFD]+\\s*${damat}`, "gi");
  metin = metin.replace(ciftRegex, cift);

  // {misafir} temizligi: Eger kisiye ozel misafir YOKSA, {misafir} gecen satiri tamamen temizle
  if (!misafir) {
    metin = metin
      .split("\n")
      .filter((satir) => !satir.includes("{misafir}"))
      .join("\n")
      .replace(/\n{3,}/g, "\n\n"); // arta kalan bosluklari toparla
  }

  // Guvenli yer tutucu degisimi (regex guvenligi ile)
  metin = metin
    .replace(/\{cift\}/gi, cift)
    .replace(/\{gelin\}/gi, gelin)
    .replace(/\{damat\}/gi, damat)
    .replace(/\{tarih\}/gi, tarih)
    .replace(/\{saat\}/gi, saat)
    .replace(/\{salon\}/gi, salon)
    .replace(/\{misafir\}/gi, misafir ?? "");

  // {link} kontrolu: eger sablonda {link} varsa degistir, yoksa mesajin sonuna ekle
  if (metin.includes("{link}")) {
    metin = metin.replace(/\{link\}/gi, url);
  } else {
    metin = `${metin.trim()}\n\nDavet detayları ve katılım için:\n${url}`;
  }

  return metin.trim();
}

/**
 * WhatsApp baglantisi olusturur:
 * Numara varsa dogrudan o kisiye gonderim (https://wa.me/905xxxxxxxxx?text=...),
 * numara yoksa genel acilis (https://api.whatsapp.com/send?text=...).
 */
export function whatsappGonderUrl(veri: {
  telefon?: string | null;
  mesaj: string;
}): string {
  const encodeMesaj = encodeURIComponent(veri.mesaj);
  const telRakamlar = veri.telefon ? telefonNormalize(veri.telefon) : "";

  if (telRakamlar) {
    return `https://wa.me/${telRakamlar}?text=${encodeMesaj}`;
  }

  return `https://api.whatsapp.com/send?text=${encodeMesaj}`;
}
