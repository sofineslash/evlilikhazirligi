"use client";

import { useRef, useEffect } from "react";
import RsvpForm from "./RsvpForm";

/**
 * "Katılmak istiyorum" butonu + acilan pencere.
 *
 * Native <dialog> kullaniliyor, elle modal yazilmiyor: odak tuzagi,
 * ESC ile kapanma, arka planin erisilemez olmasi ve backdrop tarayicidan
 * geliyor. Elle yazilan modallar bu dortlusunu genelde eksik birakiyor.
 *
 * JS yoksa buton yerine dogrudan /tesekkurler'e giden bir baglanti kalir —
 * davetiyenin kendisi zaten JS'siz calisiyor (Premise 3).
 */
export default function KatilimButonu({ tel }: { tel?: string }) {
  const pencere = useRef<HTMLDialogElement>(null);

  // Pencere acikken arka plan kaymasin
  useEffect(() => {
    const d = pencere.current;
    if (!d) return;
    const izle = () => {
      document.body.style.overflow = d.open ? "hidden" : "";
    };
    const gozlemci = new MutationObserver(izle);
    gozlemci.observe(d, { attributes: true, attributeFilter: ["open"] });
    return () => {
      gozlemci.disconnect();
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <>
      <button
        type="button"
        className="btn btn-eylem btn-birincil"
        onClick={() => pencere.current?.showModal()}
      >
        Katılmak istiyorum
      </button>

      <dialog ref={pencere} className="tema-pencere" aria-labelledby="katilim-baslik">
        <div className="pencere-ic">
          <button
            type="button"
            className="pencere-kapat"
            aria-label="Kapat"
            onClick={() => pencere.current?.close()}
          >
            ×
          </button>

          <h2 id="katilim-baslik">Katılım</h2>
          <RsvpForm />

          {tel && (
            <p className="kucuk pencere-tel">
              Formu doldurmak istemiyorsanız bize yazın:{" "}
              <a href={`tel:${tel.replace(/\s/g, "")}`}>{tel}</a>
            </p>
          )}
        </div>
      </dialog>
    </>
  );
}
