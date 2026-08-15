"use client";

import { useEffect } from "react";

/**
 * Isimleri tek satirda, kartin genisligine SIGDIRIR.
 *
 * Neden JS: saf CSS ile "tek satirda kal ve mumkun oldugunca buyuk ol"
 * garanti edilemiyor — yazitipi genisligi bilinmeden dogru punto
 * hesaplanamaz, ve script yazitipleri sistemden sisteme cok degisiyor.
 * clamp/cqi ile tahmin etmek ya tasmaya ya da gereksiz kucuklige yol aciyor.
 *
 * Ilerlemeli iyilestirme: JS calismazsa CSS'teki guvenli clamp degeri gecerli
 * kalir — isim yine tek satirdadir, sadece bir tik kucuk. Davetiye bozulmaz.
 */
const MIN = 18;   // px
const MAX = 60;   // px

export default function IsimUydur() {
  useEffect(() => {
    const h1 = document.querySelector<HTMLElement>(".isimler-script");
    const kap = h1?.parentElement;
    if (!h1 || !kap) return;

    // DIKKAT: scrollWidth METNIN degil KUTUNUN genisligini verir — metin
    // kutudan darsa kutu genisligini dondurur ve olcum ise yaramaz.
    // Gercek metin genisligi icin Range kullaniyoruz.
    const metinGenisligi = () => {
      const r = document.createRange();
      r.selectNodeContents(h1);
      return r.getBoundingClientRect().width;
    };

    const uydur = () => {
      if (h1.clientWidth < 40) return;        // henuz olculemiyor

      /* HEDEF de GORSEL piksel olmali.
         Kart zarfin icinde scale(.18) ile duruyor. clientWidth DUZEN
         pikseli verir (olcekten etkilenmez), Range.getBoundingClientRect()
         ise GORSEL piksel (olcekli). Ikisi karsilastirilinca 76 <= 368
         hep dogru cikiyor, ikili arama MAX'a tirmaniyor ve isimler
         karttan tasiyordu. Sayfa yenilenince tarayici kaydirma konumunu
         geri yukledigi icin kart tam boyda oluyordu ve sorun "kayboluyordu".
         Ikisi de gorsel olunca olcek carpani sadelesir, hangi olcekte
         olcersek olcelim ayni punto cikar. */
      const hedef = h1.getBoundingClientRect().width;
      if (hedef < 1) return;                  // gorunmez — olcum anlamsiz
      // Ikili arama: tasmayan en buyuk punto (%2 emniyet payi)
      let alt = MIN, ust = MAX, iyi = MIN;
      for (let i = 0; i < 14; i++) {
        const orta = (alt + ust) / 2;
        h1.style.fontSize = orta + "px";
        if (metinGenisligi() <= hedef * 0.98) { iyi = orta; alt = orta; }
        else ust = orta;
      }
      const boy = Math.floor(iyi);
      h1.style.fontSize = boy + "px";

      const cerceve = h1.closest(".cerceve") as HTMLElement | null;
      /* Kose PNG'leri isimlerle birlikte olceklensin diye disari veriyoruz. */
      cerceve?.style.setProperty("--isim-boy", boy + "px");

      /* Her figuru KENDI isminin merkezine oturtmak icin isimlerin yatay
         merkezlerini yuzde olarak disari veriyoruz.
         Sabit bir deger yazmak calismiyor: "Kübranur" 8, "Ömür" 4 harf,
         yani merkezleri %27 ve %84 gibi cok farkli yerlerde. Kaba gore
         ortalayinca figurler ortada kumeleniyor ve isimlerle ortusmuyordu
         (olculdu: figurler %43 ve %61). */
      const alan = h1.parentElement;
      if (alan) {
        const ar = alan.getBoundingClientRect();
        const metinler = [...h1.childNodes].filter(
          (n) => n.nodeType === Node.TEXT_NODE && (n.textContent || "").trim().length > 0,
        );
        const merkez = (n: ChildNode) => {
          const r = document.createRange();
          r.selectNodeContents(n);
          const b = r.getBoundingClientRect();
          return ((b.left + b.width / 2 - ar.left) / ar.width) * 100;
        };
        if (metinler[0]) alan.style.setProperty("--gelin-x", merkez(metinler[0]).toFixed(2) + "%");
        if (metinler[metinler.length - 1])
          alan.style.setProperty("--damat-x", merkez(metinler[metinler.length - 1]).toFixed(2) + "%");
      }
    };

    uydur();
    const ro = new ResizeObserver(uydur);
    ro.observe(kap);
    // Yazitipi gec yuklenirse yeniden olc
    document.fonts?.ready.then(uydur).catch(() => {});
    return () => ro.disconnect();
  }, []);

  return null;
}
