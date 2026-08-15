"use client";

import { useEffect, useRef } from "react";

/**
 * Fotograf onizleme penceresi (lightbox).
 *
 * Native <dialog>: odak tuzagi, ESC ile kapanma, arka planin erisilemez
 * olmasi ve backdrop tarayicidan geliyor. Elle yazilan modallar bu
 * dortlusunu genelde eksik birakiyor.
 *
 * Hem misafir galerisinde hem yonetim panelinde AYNI bilesen kullaniliyor;
 * ikisinde ayri lightbox yazmak iki ayri hata kaynagi demekti.
 */
export default function FotoOnizle({
  idler,
  indeks,
  setIndeks,
}: {
  idler: string[];
  indeks: number | null;
  setIndeks: (i: number | null) => void;
}) {
  const pencere = useRef<HTMLDialogElement>(null);

  // indeks <-> <dialog> acik/kapali durumunu esitle
  useEffect(() => {
    const d = pencere.current;
    if (!d) return;
    if (indeks !== null && !d.open) d.showModal();
    if (indeks === null && d.open) d.close();
  }, [indeks]);

  // Pencere acikken arka plan kaymasin
  useEffect(() => {
    document.body.style.overflow = indeks !== null ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [indeks]);

  // Ok tuslariyla gezinme
  useEffect(() => {
    if (indeks === null) return;
    const tus = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") { e.preventDefault(); setIndeks((indeks + 1) % idler.length); }
      if (e.key === "ArrowLeft")  { e.preventDefault(); setIndeks((indeks - 1 + idler.length) % idler.length); }
    };
    window.addEventListener("keydown", tus);
    return () => window.removeEventListener("keydown", tus);
  }, [indeks, idler.length, setIndeks]);

  const id = indeks !== null ? idler[indeks] : null;

  return (
    <dialog
      ref={pencere}
      className="foto-pencere"
      /* ESC ve backdrop ile kapanisi da state'e yansit, yoksa dialog
         kapanir ama indeks dolu kalir ve bir daha acilmaz. */
      onClose={() => setIndeks(null)}
      onClick={(e) => { if (e.target === pencere.current) setIndeks(null); }}
    >
      {id && (
        <div className="foto-pencere-ic">
          <img src={`/api/an/${id}`} alt="" />

          <div className="foto-pencere-arac">
            {idler.length > 1 && (
              <button
                type="button" className="btn" aria-label="Önceki"
                onClick={() => setIndeks((indeks! - 1 + idler.length) % idler.length)}
              >
                ‹
              </button>
            )}
            <span className="kucuk">{indeks! + 1} / {idler.length}</span>
            {idler.length > 1 && (
              <button
                type="button" className="btn" aria-label="Sonraki"
                onClick={() => setIndeks((indeks! + 1) % idler.length)}
              >
                ›
              </button>
            )}
            <a className="btn btn-birincil" href={`/api/an/${id}?indir=1`} download>
              İndir
            </a>
            <button type="button" className="btn" onClick={() => setIndeks(null)}>
              Kapat
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
