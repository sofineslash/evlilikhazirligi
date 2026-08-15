"use client";

import { useEffect, useRef, useState } from "react";

export type Sekme = {
  id: string;
  etiket: string;
  /** Sekme basliginda gorunen kucuk sayi/uyari — orn. "3 boş" */
  rozet?: string;
  icerik: React.ReactNode;
};

/**
 * Yonetim panelinin sekmeleri.
 *
 * Pasif paneller DOM'da KALIR (`hidden` ile gizlenir), sokulmez. Sokulseydi
 * sekme degistirince o panelde doldurulmus ama kaydedilmemis alanlar
 * silinirdi. Her sekmenin kendi formu ve kendi kaydet butonu var; kaydetme
 * eylemi formda BULUNMAYAN alanlari atladigi icin (lib/admin.ts: `v === null`
 * -> continue) bir sekmeyi kaydetmek digerlerini bozmaz.
 *
 * Secili sekme adres cubugunda #id olarak tutulur, boylece sayfa yenilenince
 * ya da kaydetme sonrasi yerin kaybolmaz.
 */
export default function AdminSekmeler({ sekmeler }: { sekmeler: Sekme[] }) {
  // Sunucu ve istemci ayni ilk degeri uretmeli — hidrasyon uyusmazligi olmasin.
  const [aktif, setAktif] = useState(sekmeler[0]?.id ?? "");
  const seritRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = decodeURIComponent(location.hash.slice(1));
    if (h && sekmeler.some((s) => s.id === h)) setAktif(h);
  }, [sekmeler]);

  const sec = (id: string) => {
    setAktif(id);
    history.replaceState(null, "", "#" + id);
  };

  /* Ok tuslariyla gezinme — sekme serilerinde beklenen davranis. */
  const tus = (e: React.KeyboardEvent) => {
    const yon = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (!yon && e.key !== "Home" && e.key !== "End") return;
    e.preventDefault();
    const i = sekmeler.findIndex((s) => s.id === aktif);
    const y =
      e.key === "Home" ? 0
      : e.key === "End" ? sekmeler.length - 1
      : (i + yon! + sekmeler.length) % sekmeler.length;
    sec(sekmeler[y].id);
    seritRef.current?.querySelectorAll<HTMLButtonElement>("[role=tab]")[y]?.focus();
  };

  return (
    <div className="sekmeler">
      <div className="sekme-serit" role="tablist" ref={seritRef} onKeyDown={tus}>
        {sekmeler.map((s) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            id={`sekme-${s.id}`}
            aria-selected={aktif === s.id}
            aria-controls={`panel-${s.id}`}
            /* Yalnizca secili sekme sekme-sirasinda — serit tek durak olur,
                okla gezilir. ARIA sekme deseninin gerektirdigi sey bu. */
            tabIndex={aktif === s.id ? 0 : -1}
            className={`sekme-btn${aktif === s.id ? " secili" : ""}`}
            onClick={() => sec(s.id)}
          >
            {s.etiket}
            {s.rozet && <span className="sekme-rozet">{s.rozet}</span>}
          </button>
        ))}
      </div>

      {sekmeler.map((s) => (
        <div
          key={s.id}
          role="tabpanel"
          id={`panel-${s.id}`}
          aria-labelledby={`sekme-${s.id}`}
          hidden={aktif !== s.id}
          className="sekme-panel"
        >
          {s.icerik}
        </div>
      ))}
    </div>
  );
}
