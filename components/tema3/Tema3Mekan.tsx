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
            <span className="tema2-btn-ikon" aria-hidden="true" style={{ marginRight: "6px" }}>
              <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" />
              </svg>
            </span>
            <span>Google Haritalar</span>
          </a>

          <a
            href={harita.apple}
            target="_blank"
            rel="noopener noreferrer"
            className="tema3-btn tema3-btn-ikincil"
          >
            <span className="tema2-btn-ikon" aria-hidden="true" style={{ marginRight: "6px" }}>
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <polygon points="16.2 7.8 13.8 13.8 7.8 16.2 10.2 10.2" fill="currentColor" />
              </svg>
            </span>
            <span>Apple Haritalar</span>
          </a>
        </div>
      </div>
    </section>
  );
}
