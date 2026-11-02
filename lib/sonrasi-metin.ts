import type { EtkinlikTur } from "./asama";

/**
 * «Sonrası» sayfalarının hazır metinleri. SAF: veritabanı yok.
 *
 * Admin → Metinler'de teşekkür metni boş bırakılırsa bunlar kullanılır;
 * doldurulursa yönetici metni geçerli olur.
 */
export const SONRA_BASLIK: Record<EtkinlikTur, string> = {
  nisan: "Nişanlandık",
  dugun: "Evlendik",
};

export const VARSAYILAN_TESEKKUR: Record<EtkinlikTur, string> = {
  nisan: [
    "Nişanımıza gelerek, sevincimize ortak olarak ve güzel dileklerinizle bu özel günümüzü çok daha anlamlı kıldığınız için hepinize yürekten teşekkür ederiz.",
    "O akşam yüzlerinizdeki gülümsemeyi görmek, sevginizi hissetmek bizim için paha biçilemez bir hatıra oldu. Çektiğiniz her fotoğraf, söylediğiniz her güzel söz kalbimize dokundu ve bu günü ömür boyu hatırlayacağımız bir anıya dönüştürdü.",
    "Yeni yolculuğumuza çıkarken sevginiz ve duanız bizimle olsun. Bir sonraki mutlu günümüzde, düğünümüzde de aramızda olmanızı diliyoruz.",
  ].join("\n\n"),
  dugun: [
    "Düğünümüzde yanımızda olarak, mutluluğumuza ortak olarak ve güzel dileklerinizle hayatımızın en özel gününü unutulmaz kıldığınız için hepinize yürekten teşekkür ederiz.",
    "Bu geceyi bizimle paylaşan, bizi yalnız bırakmayan herkese minnettarız. Yüzlerinizdeki gülümseme, kutlamalarınız ve paylaştığınız her an kalbimizde ömür boyu yer edecek.",
    "Ortak hayatımıza sevgi ve duanızla başlamamıza vesile olduğunuz için sonsuz teşekkürler. Kapımız da gönlümüz de size her zaman açık.",
  ].join("\n\n"),
};

/** Boş satırla ayrılmış metni paragraflara böler. */
export function paragraflar(metin: string): string[] {
  return metin
    .split(/\n{2,}/)
    .map((p) => p.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean);
}
