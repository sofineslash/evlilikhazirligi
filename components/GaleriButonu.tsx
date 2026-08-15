"use client";

import { useRef, useEffect, useState } from "react";
import FotoOnizle from "./FotoOnizle";

export type AnKart = { id: string; yukleyen: string | null };

/**
 * "Fotoğraflarımız" butonu — Katılım penceresiyle AYNI kaliptan.
 *
 * Once davetiyeyi 3B cevirip arka yuzu gosteriyordu. Kullanici bunun
 * yerine pencere istedi; cevirme kaldirildi, boylece `.kart-3b`,
 * `inert` yonetimi ve iki yuzlu yerlesim de gitti.
 *
 * Fotograflar TEK TEK beliriyor (galeri-akis animasyonu korundu).
 * Kucuk resme tiklayinca indirmez, onizleme acar; indirme onun icinde.
 */
export default function GaleriButonu({ anlar: ilkAnlar }: { anlar: AnKart[] }) {
  const pencere = useRef<HTMLDialogElement>(null);
  const [acik, setAcik] = useState(false);
  const [onizleme, setOnizleme] = useState<number | null>(null);

  /* Liste sunucudan prop olarak gelir AMA orada donar. Misafir fotograf
     yukleyip galeriyi acinca kendi fotografini goremiyordu — yuklenmedi
     sanip tekrar yukluyordu. Pencere her acildiginda listeyi tazeliyoruz;
     sunucudan gelen liste yalnizca ilk deger. */
  const [anlar, setAnlar] = useState<AnKart[]>(ilkAnlar);
  const [yukleniyor, setYukleniyor] = useState(false);

  const tazele = async () => {
    setYukleniyor(true);
    try {
      const y = await fetch("/api/an/liste", { cache: "no-store" });
      if (!y.ok) return;                     // sessizce eldeki listeyle devam
      const c = await y.json();
      if (Array.isArray(c.anlar)) setAnlar(c.anlar);
    } catch {
      /* aginda sorun varsa eldeki liste kalsin, pencere bos acilmasin */
    } finally {
      setYukleniyor(false);
    }
  };

  useEffect(() => {
    const d = pencere.current;
    if (!d) return;
    const izle = () => {
      document.body.style.overflow = d.open ? "hidden" : "";
      setAcik(d.open);
      if (d.open) void tazele();     // her acilista guncel listeyi cek
    };
    const g = new MutationObserver(izle);
    g.observe(d, { attributes: true, attributeFilter: ["open"] });
    return () => { g.disconnect(); document.body.style.overflow = ""; };
  }, []);

  return (
    <>
      <button
        type="button"
        className="btn btn-eylem"
        onClick={() => pencere.current?.showModal()}
      >
        Fotoğraflarımız
      </button>

      <dialog ref={pencere} className="tema-pencere" aria-labelledby="galeri-baslik">
        <div className="pencere-ic">
          <button
            type="button" className="pencere-kapat" aria-label="Kapat"
            onClick={() => pencere.current?.close()}
          >
            ×
          </button>
          <h2 id="galeri-baslik">Anılarımız</h2>

          {anlar.length === 0 ? (
            <p className="kucuk" style={{ textAlign: "center" }}>
              {yukleniyor ? "Yükleniyor…" : "Henüz fotoğraf paylaşılmadı."}
            </p>
          ) : (
            <>
              {/* data-aktif: animasyon pencere ACILDIKTAN sonra bassin,
                  yoksa kapaliyken oynayip biter ve hic izlenmez. */}
              <ul className="galeri-akis" data-aktif={acik ? "1" : undefined}>
                {anlar.map((a, i) => (
                  <li key={a.id} style={{ "--i": i } as React.CSSProperties}>
                    <button type="button" className="an-kucuk" onClick={() => setOnizleme(i)}>
                      <img src={`/api/an/${a.id}`} alt="" loading="lazy" />
                    </button>
                  </li>
                ))}
              </ul>

              {/* Toplu indirme MISAFIRDE YOK — kullanici karari.
                  Tek tek indirme onizleme penceresinde duruyor.
                  Sunucu tarafinda da /api/an/zip yalnizca admin'e aciktir,
                  yani buton kaldirilmis olmakla kalmiyor, uc da kapali. */}
              <FotoOnizle idler={anlar.map((a) => a.id)} indeks={onizleme} setIndeks={setOnizleme} />
            </>
          )}
        </div>
      </dialog>
    </>
  );
}
