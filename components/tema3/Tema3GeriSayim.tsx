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

export default function Tema3GeriSayim({
  hedefTarih = CFG.TARIH,
}: {
  hedefTarih?: string;
}) {
  const hedefMs = Date.parse(hedefTarih);
  const [kalan, setKalan] = useState<KalanZaman>(() => hesapla(hedefMs));

  useEffect(() => {
    setKalan(hesapla(hedefMs));
    const timer = setInterval(() => {
      setKalan(hesapla(hedefMs));
    }, 1000);
    return () => clearInterval(timer);
  }, [hedefMs]);

  if (kalan.bitti) {
    return (
      <div className="tema3-bolum-kapsul">
        <h3 className="tema3-bolum-baslik">Büyük Gün Geldi!</h3>
        <p style={{ fontStyle: "italic", color: "#5A0F1B" }}>
          Mutluluğumuzu paylaştığınız için teşekkür ederiz.
        </p>
      </div>
    );
  }

  return (
    <section className="tema3-bolum-kapsul">
      <h3 className="tema3-bolum-baslik">The Celebration Begins In</h3>

      <div className="tema3-gerisayim-grid">
        <div className="tema3-sayac-kutu">
          <span className="tema3-sayac-rakam">{pad(kalan.gun)}</span>
          <span className="tema3-sayac-etiket">Gün</span>
        </div>
        <div className="tema3-sayac-kutu">
          <span className="tema3-sayac-rakam">{pad(kalan.saat)}</span>
          <span className="tema3-sayac-etiket">Saat</span>
        </div>
        <div className="tema3-sayac-kutu">
          <span className="tema3-sayac-rakam">{pad(kalan.dakika)}</span>
          <span className="tema3-sayac-etiket">Dakika</span>
        </div>
        <div className="tema3-sayac-kutu">
          <span className="tema3-sayac-rakam">{pad(kalan.saniye)}</span>
          <span className="tema3-sayac-etiket">Saniye</span>
        </div>
      </div>
    </section>
  );
}
