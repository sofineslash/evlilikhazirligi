"use client";

import { useEffect, useRef } from "react";
import ZarfYuz from "./ZarfYuz";

/**
 * Kaydirmayla acilan zarf — ve ICINDEN cikan davetiye.
 *
 * SCROLL HIJACKING YOK: sayfa normal kayar, parmak asla ele gecirilmez.
 * Yaptigimiz sey scroll'a BAGLI animasyon — sahne sticky ile sabitlenir ve
 * kaydirma ilerledikce 0->1 arasi bir degere gore donusur. Kullanici geri
 * kaydirinca animasyon geri sarar. Istedigi an hizli gecebilir.
 *
 * Asamalar:
 *   0.00 - 0.30  zarf Y ekseninde doner (arkasi gorunur)
 *   0.00 - 0.17  zarfin UZERINDEKI yazi silinir (donus 90 dereceyi
 *                gecmeden gitmis olmali, yoksa ters gorunur)
 *   0.27 - 0.62  kapak acilir (rotateX, menteseden)
 *   0.58 - 1.00  DAVETIYE one dogru buyur, zarf ayni anda geri cekilir
 *
 * Davetiye neden `children`: kullanicinin istedigi sey davetiyenin zarftan
 * CIKMASI. Ayri bir bolum olsaydi en iyi ihtimalle bir kesme olurdu.
 * Burada ikisi ayni sticky sahnede, ayni grid hucresinde, ayni merkezden
 * olcekleniyor — tek bir hareket.
 *
 * DIKKAT: davetiye `.zarf-3b`nin ICINE konulamaz. O oge rotateY(180deg)
 * ile donuyor ve icindeki her sey aynalanir; isimler, tarih, butonlar ters
 * gorunurdu. Bu yuzden KARDES olarak duruyor — donmeyen kapta.
 */
export default function Zarf({
  solHarf,
  sagHarf,
  satir,
  davet,
  fon,
  children,
}: {
  /** Dalin solundaki bas harf, orn. "K" */
  solHarf: string;
  /** Dalin sagindaki bas harf, orn. "Ö" */
  sagHarf: string;
  /** El yazisi satir, orn. "29 Ekim'de güzel bir akşama…" */
  satir?: string;
  /** Arali buyuk harf satiri, orn. "DAVETLİSİNİZ…" */
  davet?: string;
  fon?: string | null;
  children?: React.ReactNode;
}) {
  const sahneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sahneRef.current;
    if (!el) return;

    // JS calisti isareti. Animasyonlu durum bunun ARKASINDA duruyor:
    // JS yoksa davetiye scale(.18)/opacity:0'da kilitli kalirdi, yani
    // davetiye hic gorunmezdi. Bu isaret olmadan sayfa erisilemez olur.
    el.dataset.js = "1";

    const azHareket = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (azHareket) {
      el.style.setProperty("--ilerleme", "1");
      el.dataset.bitti = "1";
      return;
    }

    let beklemede = false;
    const guncelle = () => {
      beklemede = false;
      const r = el.getBoundingClientRect();
      // el yuksekligi = 100vh sticky + ekstra kaydirma payi
      const toplam = el.offsetHeight - window.innerHeight;
      const gecen = Math.min(Math.max(-r.top, 0), toplam);
      const p = toplam > 0 ? gecen / toplam : 1;
      el.style.setProperty("--ilerleme", p.toFixed(4));
      // %90: kart ekrana sigmadiginda icinde kaydirma yeterince erken
      // devreye girsin. %98'de kullanici animasyonun sonuna dayanmadan
      // kartin altini goremiyordu.
      if (p > 0.9) el.dataset.bitti = "1";
      else delete el.dataset.bitti;
    };

    const olay = () => {
      if (beklemede) return;
      beklemede = true;
      requestAnimationFrame(guncelle);
    };

    guncelle();
    window.addEventListener("scroll", olay, { passive: true });
    window.addEventListener("resize", olay, { passive: true });
    return () => {
      window.removeEventListener("scroll", olay);
      window.removeEventListener("resize", olay);
    };
  }, []);

  return (
    /* aria-hidden BURAYA KOYULAMAZ: davetiyenin kendisi artik bu agacin
       icinde. Dekoratif parcalar tek tek gizleniyor. */
    <div className="zarf-sahne" ref={sahneRef}>
      {/* JS KAPALIYSA davetiye acilamaz — zarf sonsuza kadar kapali kalir.
          Bu yuzden sahneyi duzlestirip karti dogrudan gosteriyoruz.
          Neden <noscript>: onceden bu is bir [data-js] ozniteligiyle
          yapiliyordu, ama onu React baglandiktan SONRA JS koyuyor;
          sunucudan gelen HTML'de olmadigi icin ilk karede kart tam boy
          cizilip zarfin ustunu ortuyordu. <noscript> yalnizca JS gercekten
          kapaliyken devreye girer, JS'li ziyaretcide hic parlamaz. */}
      <noscript>
        <style>{`
          .zarf-sahne { height: auto; }
          .zarf-yapisik { position: static; height: auto; padding: 3rem 1rem; }
          .zarf-3b, .zarf-ipucu { display: none; }
          .zarf-yapisik > .kapak-dis { opacity: 1; transform: none; }
        `}</style>
      </noscript>

      <div className="zarf-yapisik">
        {fon && <img className="zarf-fon" src={fon} alt="" aria-hidden="true" />}

        <div className="zarf-3b" aria-hidden="true">
          <div className="zarf-govde">
            <div className="zarf-arka" />
            <div className="zarf-on">
              <ZarfYuz solHarf={solHarf} sagHarf={sagHarf} satir={satir} davet={davet} />
            </div>
            <div className="zarf-kanat">
              <div className="zarf-kanat-dis" />
              <div className="zarf-kanat-ic" />
            </div>
          </div>
        </div>

        {/* Zarfla AYNI grid hucresinde, ayni merkezden olcekleniyor */}
        {children}

        <p className="zarf-ipucu" aria-hidden="true">
          <span className="zarf-ok" /> kaydırın
        </p>
      </div>
    </div>
  );
}
