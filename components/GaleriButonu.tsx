"use client";

import { useRef, useEffect, useState } from "react";
import FotoOnizle from "./FotoOnizle";

export type AnKart = {
  id: string;
  yukleyen: string | null;
  tur?: "foto" | "video";
  sure?: number | null;
};

const sureMetni = (sn: number) =>
  `${Math.floor(sn / 60)}:${String(Math.round(sn % 60)).padStart(2, "0")}`;

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
  const [sekme, setSekme] = useState<"foto" | "video">("foto");

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

  /* Sekme icerikleri. Tek tur varsa sekme cizilmez ve o tur gosterilir —
     yoksa "Videolar" sekmesi bos acilir. */
  const fotolar = anlar.filter((a) => a.tur !== "video");
  const videolar = anlar.filter((a) => a.tur === "video");
  const gosterilen =
    fotolar.length > 0 && videolar.length > 0
      ? (sekme === "video" ? videolar : fotolar)
      : (videolar.length > 0 && fotolar.length === 0 ? videolar : fotolar);

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
              {yukleniyor ? "Yükleniyor…" : "Henüz bir şey paylaşılmadı."}
            </p>
          ) : (
            <>
              {/* Sekmeler yalnizca IKI TUR DE VARSA cizilir — tek tur
                  varken bos bir sekme gostermek kullaniciya "eksik bir sey
                  mi var" dedirtiyor. */}
              {fotolar.length > 0 && videolar.length > 0 && (
                <div className="galeri-sekme" role="tablist">
                  <button
                    type="button" role="tab" aria-selected={sekme === "foto"}
                    className={`sekme-btn${sekme === "foto" ? " secili" : ""}`}
                    onClick={() => { setSekme("foto"); setOnizleme(null); }}
                  >
                    Fotoğraflar <span className="sekme-rozet">{fotolar.length}</span>
                  </button>
                  <button
                    type="button" role="tab" aria-selected={sekme === "video"}
                    className={`sekme-btn${sekme === "video" ? " secili" : ""}`}
                    onClick={() => { setSekme("video"); setOnizleme(null); }}
                  >
                    Videolar <span className="sekme-rozet">{videolar.length}</span>
                  </button>
                </div>
              )}

              {/* data-aktif: animasyon pencere ACILDIKTAN sonra bassin,
                  yoksa kapaliyken oynayip biter ve hic izlenmez. */}
              <ul className="galeri-akis" data-aktif={acik ? "1" : undefined}>
                {gosterilen.map((a, i) => (
                  <li key={a.id} style={{ "--i": i } as React.CSSProperties}>
                    <button type="button" className="an-kucuk" onClick={() => setOnizleme(i)}>
                      {/* Videoda kapak karesi gosteriliyor — video dosyasini
                          indirmeden ilk kare gorunuyor. */}
                      <img
                        src={a.tur === "video" ? `/api/an/${a.id}?kapak=1` : `/api/an/${a.id}`}
                        alt="" loading="lazy"
                      />
                      {a.tur === "video" && (
                        <span className="an-video-isaret" aria-hidden="true">
                          ▶{a.sure ? ` ${sureMetni(a.sure)}` : ""}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>

              {/* Toplu indirme MISAFIRDE YOK — kullanici karari.
                  Tek tek indirme onizleme penceresinde duruyor.
                  Sunucu tarafinda da /api/an/zip yalnizca admin'e aciktir,
                  yani buton kaldirilmis olmakla kalmiyor, uc da kapali. */}
              <FotoOnizle ogeler={gosterilen} indeks={onizleme} setIndeks={setOnizleme} />
            </>
          )}
        </div>
      </dialog>
    </>
  );
}
