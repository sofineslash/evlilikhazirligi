export type HatiraNotu = {
  id: string;
  adSoyad: string;
  dilek: string;
};

/**
 * Hatira notunu yazan kisinin ad ve soyadini formatlar:
 * - Basinda tire (-) olmaz
 * - Soyisim her zaman tamamen BUYUK HARFLERLE
 * - 2 kelimeli ise: "Ahmet YILMAZ"
 * - 3 veya daha fazla kelimeli ise: Ilk isim(ler) kisaltma "A.", sonraki isim "Mehmet", soyisim "FEYZİ" -> "A. Mehmet FEYZİ"
 */
export function hatiraAdSoyadFormatla(tamAd: string): string {
  if (!tamAd || !tamAd.trim()) return "";

  const kelimeler = tamAd.trim().split(/\s+/);

  if (kelimeler.length === 1) {
    const k = kelimeler[0];
    return k.charAt(0).toLocaleUpperCase("tr") + k.slice(1).toLocaleLowerCase("tr");
  }

  // Son kelime soyisimdir
  const soyad = kelimeler[kelimeler.length - 1].toLocaleUpperCase("tr");
  const onIsimler = kelimeler.slice(0, -1);

  if (onIsimler.length === 1) {
    const ilk = onIsimler[0];
    const ad = ilk.charAt(0).toLocaleUpperCase("tr") + ilk.slice(1).toLocaleLowerCase("tr");
    return `${ad} ${soyad}`;
  }

  // 3 veya daha fazla kelime
  const formatliOnIsimler = onIsimler.map((isim, index) => {
    const kucuk = isim.toLocaleLowerCase("tr");
    if (kucuk === "ve" || isim === "&") return isim;

    // Soyisimden hemen onceki ana isim: Bas harfi buyuk, gerisi kucuk
    if (index === onIsimler.length - 1) {
      return isim.charAt(0).toLocaleUpperCase("tr") + isim.slice(1).toLocaleLowerCase("tr");
    }

    // Ilk isim(ler): Bas harfi buyuk + nokta
    return `${isim.charAt(0).toLocaleUpperCase("tr")}.`;
  });

  return `${formatliOnIsimler.join(" ")} ${soyad}`;
}
