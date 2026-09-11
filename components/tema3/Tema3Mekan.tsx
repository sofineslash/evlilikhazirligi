"use client";

import { haritaLinkleri, CFG } from "@/lib/config";

interface Props {
  salon?: string;
  adres?: string;
}

export default function Tema3Mekan({ salon, adres }: Props) {
  const harita = haritaLinkleri();
  const mekanAdi = salon || CFG.SALON_AD;
  const mekanAdres = adres || CFG.SALON_ADRES;

  return (
    <section className="tema3-bolum-kapsul">
      <h3 className="tema3-bolum-baslik">Location</h3>

      <div className="tema3-mekan-kart">
        <img
          src="/tema3/acomm-decor.png"
          alt=""
          style={{ width: "120px", opacity: 0.8 }}
          aria-hidden="true"
        />

        <h4 className="tema3-mekan-ad">{mekanAdi}</h4>
        <p className="tema3-mekan-adres">
          <strong>Adres:</strong> {mekanAdres}
        </p>

        <div className="tema3-harita-butonlar">
          <a
            href={harita.google}
            target="_blank"
            rel="noopener noreferrer"
            className="tema3-btn tema3-btn-birincil"
          >
            <span>📍 Google Haritalar</span>
          </a>

          <a
            href={harita.apple}
            target="_blank"
            rel="noopener noreferrer"
            className="tema3-btn tema3-btn-ikincil"
          >
            <span>🧭 Apple Haritalar</span>
          </a>
        </div>
      </div>
    </section>
  );
}
