"use client";

import { useEffect, useRef } from "react";
import ZarfYuz from "./ZarfYuz";

/**
 * Kaydırmayla açılan gerçekçi 3B zarf ve içinden süzülen davetiye kartı.
 *
 * FİZİKSEL KATMANLAMA:
 *   1. Arka Duvar & İç Astar: Zarfın sırtı ve iç kaplaması (z-index: 1)
 *   2. Üst Kapak: Menteşeli olarak yukarı katlanır (rotateX: 0 -> -176deg)
 *   3. Davetiye Kartı: Zarfın iç cebinden yukarı doğru kayar (translateY: 0 -> -52%),
 *      ardından cepten tamamen çıkınca öne doğru büyür (scale: 0.44 -> 1.0)
 *   4. Ön Cepler: Kartın altını örten üçgen kanatlar (z-index: 4)
 *   5. Aşağı Kaydırın Uyarısı: Kullanıcıyı yönlendiren zarif altın rehber
 */
export default function Zarf({
  solHarf,
  sagHarf,
  satir,
  davet,
  fon,
  children,
}: {
  /** Dalın solundaki baş harf, örn. "K" */
  solHarf: string;
  /** Dalın sağındaki baş harf, örn. "Ö" */
  sagHarf: string;
  /** El yazısı satır, örn. "29 Ekim'de güzel bir akşama…" */
  satir?: string;
  /** Aralı büyük harf satırı, örn. "DAVETLİSİNİZ…" */
  davet?: string;
  fon?: string | null;
  children?: React.ReactNode;
}) {
  const sahneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sahneRef.current;
    if (!el) return;

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
      const toplam = el.offsetHeight - window.innerHeight;
      const gecen = Math.min(Math.max(-r.top, 0), toplam);
      const p = toplam > 0 ? gecen / toplam : 1;
      el.style.setProperty("--ilerleme", p.toFixed(4));
      
      // %88 ve sonrasında kart tam ekran okunabilir boyutta olur
      if (p > 0.88) el.dataset.bitti = "1";
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
    window.addEventListener("touchmove", olay, { passive: true });
    return () => {
      window.removeEventListener("scroll", olay);
      window.removeEventListener("resize", olay);
      window.removeEventListener("touchmove", olay);
    };
  }, []);

  const asagiKaydir = () => {
    const el = sahneRef.current;
    if (!el) return;
    const toplam = el.offsetHeight - window.innerHeight;
    window.scrollTo({ top: toplam, behavior: "smooth" });
  };

  return (
    <div className="zarf-sahne" ref={sahneRef}>
      <noscript>
        <style>{`
          .zarf-sahne { height: auto; }
          .zarf-yapisik { position: static; height: auto; padding: 3rem 1rem; }
          .zarf-3b-montaj, .zarf-kaydir-rehber { display: none !important; }
          .zarf-kart-sarma { opacity: 1 !important; transform: none !important; z-index: 10 !important; }
          .zarf-kart-sarma > .kapak-dis { opacity: 1 !important; transform: none !important; }
        `}</style>
      </noscript>

      <div className="zarf-yapisik">
        {fon && <img className="zarf-fon" src={fon} alt="" aria-hidden="true" />}

        {/* 3B Sahne Montajı */}
        <div className="zarf-sahne-merkez">
          {/* ZARF FİZİKSEL GÖVDESİ (Ön yüz -> 180° Dönüş -> Arka yüz) */}
          <div className="zarf-3b-montaj">
            {/* 1. YÜZEY: Zarfın ÖN YÜZÜ (Kullanıcının ilk gördüğü yüzey) */}
            <div className="zarf-yuz-on" aria-hidden="true">
              <div className="zarf-on-cerceve" />
              <div className="zarf-on-kose zarf-on-kose-sol-ust" />
              <div className="zarf-on-kose zarf-on-kose-sag-ust" />
              <div className="zarf-on-kose zarf-on-kose-sol-alt" />
              <div className="zarf-on-kose zarf-on-kose-sag-alt" />
              <div className="zarf-on-icerik">
                <ZarfYuz solHarf={solHarf} sagHarf={sagHarf} satir={satir} davet={davet} />
              </div>
            </div>

            {/* 2. YÜZEY: Zarfın ARKA YÜZÜ (180° çevrilince görünen yüzey) */}
            <div className="zarf-yuz-arka">
              {/* Katman 1: Zarf Arka Duvarı & İç Astar */}
              <div className="zarf-arka-duvar" aria-hidden="true">
                <div className="zarf-ic-astar" />
                <div className="zarf-ic-golge" />
              </div>

              {/* Katman 2: Açılan Üst Kapak (Menteşeden Yukarı Açılır) */}
              <div className="zarf-kapak-mentese" aria-hidden="true">
                <div className="zarf-kapak-dis">
                  <div className="zarf-kapak-cerceve" />
                </div>
                <div className="zarf-kapak-ic">
                  <div className="zarf-kapak-ic-desen" />
                </div>
                {/* Mühür: Kapağın tam ucunda, zarfın açıldığı yerde */}
                <div className="zarf-muhur">
                  <span className="zarf-muhur-harfler">{solHarf}&amp;{sagHarf}</span>
                </div>
              </div>

              {/* Katman 3: Davetiye Kartı (Zarf iç cebinden yukarı çıkan ve ekrana büyüyen kart) */}
              <div className="zarf-kart-yuvasi">
                <div className="zarf-kart-sarma">
                  {children}
                </div>
              </div>

              {/* Katman 4: Ön Cepler (Kartın önünü kapatan üçgen cepler) */}
              <div className="zarf-on-cepler" aria-hidden="true">
                <div className="zarf-cep-sol" />
                <div className="zarf-cep-sag" />
                <div className="zarf-cep-alt" />
                <div className="zarf-cep-kenar" />
                <div className="zarf-kapak-golgesi" />
              </div>
            </div>
          </div>
        </div>

        {/* AŞAĞI KAYDIRIN REHBERİ — dokununca da yumuşakça açar */}
        <div className="zarf-kaydir-rehber">
          <button
            type="button"
            className="zarf-kaydir-kapsul"
            onClick={asagiKaydir}
            aria-label="Davetiyeyi aç"
          >
            <span className="zarf-kaydir-yazi">Aşağı kaydırarak açın</span>
            <div className="zarf-kaydir-anim">
              <svg
                className="zarf-kaydir-ok"
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

