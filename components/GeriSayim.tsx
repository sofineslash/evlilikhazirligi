"use client";

import { useEffect, useState } from "react";
import { CFG } from "@/lib/config";

function pad(n: number): string {
  return String(Math.max(0, n)).padStart(2, "0");
}

type KalanZaman = {
  gun: number;
  saat: number;
  dakika: number;
  saniye: number;
  bitti: boolean;
};

function hesapla(hedefMs: number): KalanZaman {
  const simdi = Date.now();
  const fark = hedefMs - simdi;

  if (fark <= 0) {
    return { gun: 0, saat: 0, dakika: 0, saniye: 0, bitti: true };
  }

  const saniyeTop = Math.floor(fark / 1000);
  const gun = Math.floor(saniyeTop / 86400);
  const saat = Math.floor((saniyeTop % 86400) / 3600);
  const dakika = Math.floor((saniyeTop % 3600) / 60);
  const saniye = saniyeTop % 60;

  return { gun, saat, dakika, saniye, bitti: false };
}

export default function GeriSayim({
  hedefTarih = CFG.TARIH,
  baslik = "Geri Sayım",
}: {
  hedefTarih?: string;
  baslik?: string;
}) {
  const hedefMs = Date.parse(hedefTarih);
  const [kalan, setKalan] = useState<KalanZaman>(() => hesapla(hedefMs));
  const [monte, setMonte] = useState(false);

  useEffect(() => {
    setMonte(true);
    setKalan(hesapla(hedefMs));

    const zamanlayici = setInterval(() => {
      setKalan(hesapla(hedefMs));
    }, 1000);

    return () => clearInterval(zamanlayici);
  }, [hedefMs]);

  return (
    <div className="tema2-gerisayim-kapsul" aria-label="Etkinliğe geri sayım">
      <div className="tema2-gerisayim-baslik">{baslik}</div>

      <div className="tema2-gerisayim-grid">
        <div className="tema2-gerisayim-kolon">
          <span className="tema2-gerisayim-sayi">{monte ? pad(kalan.gun) : "--"}</span>
          <span className="tema2-gerisayim-etiket">GÜN</span>
        </div>

        <div className="tema2-gerisayim-ayrac" aria-hidden="true" />

        <div className="tema2-gerisayim-kolon">
          <span className="tema2-gerisayim-sayi">{monte ? pad(kalan.saat) : "--"}</span>
          <span className="tema2-gerisayim-etiket">SAAT</span>
        </div>

        <div className="tema2-gerisayim-ayrac" aria-hidden="true" />

        <div className="tema2-gerisayim-kolon">
          <span className="tema2-gerisayim-sayi">{monte ? pad(kalan.dakika) : "--"}</span>
          <span className="tema2-gerisayim-etiket">DAKİKA</span>
        </div>

        <div className="tema2-gerisayim-ayrac" aria-hidden="true" />

        <div className="tema2-gerisayim-kolon">
          <span className="tema2-gerisayim-sayi">{monte ? pad(kalan.saniye) : "--"}</span>
          <span className="tema2-gerisayim-etiket">SANİYE</span>
        </div>
      </div>
    </div>
  );
}
