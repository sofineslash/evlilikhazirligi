"use client";

import { useRef, useEffect, useState } from "react";
import AnYukle from "./AnYukle";

/**
 * "Fotoğraf yükle" butonu — Katılım penceresiyle AYNI kaliptan.
 *
 * Once /an sayfasina goturuyordu; davetiyeden ayrilmak akisi kiriyordu.
 * Artik yerinde acilan bir pencere. /an rotasi DURUYOR: masalardaki
 * karekod oraya gidiyor ve o baglantinin calismaya devam etmesi gerek.
 *
 * Kapaliyken buton pasif YAPILMIYOR — basan misafire ne zaman
 * acilacagini soyleyen yazi gosteriliyor.
 */
export default function FotoYukleButonu({ acik, mesaj }: { acik: boolean; mesaj: string }) {
  const pencere = useRef<HTMLDialogElement>(null);
  const [goster, setGoster] = useState(false);

  useEffect(() => {
    const d = pencere.current;
    if (!d) return;
    const izle = () => { document.body.style.overflow = d.open ? "hidden" : ""; };
    const g = new MutationObserver(izle);
    g.observe(d, { attributes: true, attributeFilter: ["open"] });
    return () => { g.disconnect(); document.body.style.overflow = ""; };
  }, []);

  if (!acik) {
    return (
      <>
        <button
          type="button" className="btn btn-eylem"
          onClick={() => setGoster(true)} aria-expanded={goster}
        >
          Fotoğraf yükle
        </button>
        <p className="yukleme-not" role="status" aria-live="polite">
          {goster ? mesaj : ""}
        </p>
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        className="btn btn-eylem"
        onClick={() => pencere.current?.showModal()}
      >
        Fotoğraf yükle
      </button>

      <dialog ref={pencere} className="tema-pencere" aria-labelledby="yukle-baslik">
        <div className="pencere-ic">
          <button
            type="button" className="pencere-kapat" aria-label="Kapat"
            onClick={() => pencere.current?.close()}
          >
            ×
          </button>
          <h2 id="yukle-baslik">Fotoğraf yükle</h2>
          <AnYukle />
          <p className="kucuk" style={{ marginTop: "1rem" }}>
            Fotoğraflar gönderilirken otomatik küçültülür, konum bilgisi silinir.
          </p>
        </div>
      </dialog>
    </>
  );
}
