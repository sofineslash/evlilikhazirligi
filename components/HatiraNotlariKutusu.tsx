"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { type HatiraNotu, hatiraAdSoyadFormatla } from "@/lib/hatira-format";

export default function HatiraNotlariKutusu({
  notlar: ilkNotlar,
}: {
  notlar: HatiraNotu[];
}) {
  const [karisikNotlar, setKarisikNotlar] = useState<HatiraNotu[]>([]);
  const [aktifIndex, setAktifIndex] = useState(0);
  const [gecis, setGecis] = useState(false);
  const [duraklatildi, setDuraklatildi] = useState(false);
  const zamanlayiciRef = useRef<NodeJS.Timeout | null>(null);

  // Her sayfa yuklenisinde / girisinde notlari rastgele karistir (Random)
  useEffect(() => {
    if (ilkNotlar && ilkNotlar.length > 0) {
      const kopya = [...ilkNotlar];
      for (let i = kopya.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [kopya[i], kopya[j]] = [kopya[j], kopya[i]];
      }
      setKarisikNotlar(kopya);
      setAktifIndex(0);
    } else {
      setKarisikNotlar([]);
    }
  }, [ilkNotlar]);

  const degistir = useCallback(
    (yeniIndex: number) => {
      setGecis(true);
      setTimeout(() => {
        setAktifIndex(yeniIndex);
        setGecis(false);
      }, 250);
    },
    []
  );

  const sonraki = useCallback(() => {
    if (karisikNotlar.length <= 1) return;
    degistir((aktifIndex + 1) % karisikNotlar.length);
  }, [aktifIndex, karisikNotlar.length, degistir]);

  const onceki = useCallback(() => {
    if (karisikNotlar.length <= 1) return;
    degistir((aktifIndex - 1 + karisikNotlar.length) % karisikNotlar.length);
  }, [aktifIndex, karisikNotlar.length, degistir]);

  // Otomatik sirayla donme (her 6 saniyede bir)
  useEffect(() => {
    if (duraklatildi || karisikNotlar.length <= 1) {
      if (zamanlayiciRef.current) clearInterval(zamanlayiciRef.current);
      return;
    }

    zamanlayiciRef.current = setInterval(() => {
      sonraki();
    }, 6000);

    return () => {
      if (zamanlayiciRef.current) clearInterval(zamanlayiciRef.current);
    };
  }, [duraklatildi, karisikNotlar.length, sonraki]);

  const mevcut = karisikNotlar[aktifIndex];

  return (
    <div
      className="tema2-salon-bolum tema2-hatira-bolum"
      onMouseEnter={() => setDuraklatildi(true)}
      onMouseLeave={() => setDuraklatildi(false)}
      onTouchStart={() => setDuraklatildi(true)}
      onTouchEnd={() => setDuraklatildi(false)}
    >
      <div className="tema2-hatira-baslik-alan">
        <svg
          className="tema2-hatira-simge"
          viewBox="0 0 24 24"
          width="13"
          height="13"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12 2L14.8 9.2L22 12L14.8 14.8L12 22L9.2 14.8L2 12L9.2 9.2L12 2Z" />
        </svg>
        <h2 className="tema2-salon tema2-hatira-baslik">Sizden Gelen Hatıra Notları</h2>
        <svg
          className="tema2-hatira-simge"
          viewBox="0 0 24 24"
          width="13"
          height="13"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12 2L14.8 9.2L22 12L14.8 14.8L12 22L9.2 14.8L2 12L9.2 9.2L12 2Z" />
        </svg>
      </div>

      {karisikNotlar.length === 0 ? (
        <div className="tema2-hatira-bos">
          <p>Henüz yayınlanmış bir hatıra notu bulunmuyor.</p>
          <span className="tema2-hatira-bos-ipucu">
            Katılım durumunuzu bildirirken çiftimize güzel bir hatıra notu bırakabilirsiniz ✍️
          </span>
        </div>
      ) : (
        <div className="tema2-hatira-icerik-kapsul">
          {karisikNotlar.length > 1 && (
            <button
              type="button"
              className="tema2-hatira-ok sol"
              onClick={onceki}
              aria-label="Önceki not"
            >
              ‹
            </button>
          )}

          <div
            className={`tema2-hatira-kart ${gecis ? "gecis-cik" : "gecis-gir"}`}
          >
            <div className="tema2-hatira-metin-kapsayici">
              <span className="tema2-hatira-tirnak sol" aria-hidden="true">“</span>
              <p className="tema2-hatira-metin">{mevcut.dilek}</p>
              <span className="tema2-hatira-tirnak sag" aria-hidden="true">”</span>
            </div>
            <div className="tema2-hatira-yazar">
              {hatiraAdSoyadFormatla(mevcut.adSoyad)}
            </div>
          </div>

          {karisikNotlar.length > 1 && (
            <button
              type="button"
              className="tema2-hatira-ok sag"
              onClick={sonraki}
              aria-label="Sonraki not"
            >
              ›
            </button>
          )}

          {/* Noktalar (Sayfalama Göstergesi) */}
          {karisikNotlar.length > 1 && (
            <div className="tema2-hatira-noktalar" aria-hidden="true">
              {karisikNotlar.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className={`tema2-hatira-nokta ${i === aktifIndex ? "aktif" : ""}`}
                  onClick={() => degistir(i)}
                  aria-label={`${i + 1}. nota git`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
