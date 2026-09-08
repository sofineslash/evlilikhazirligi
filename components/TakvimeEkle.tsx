"use client";

import { useState, useRef, useEffect } from "react";
import { googleTakvimLinki, icsEtkinlikIndir } from "@/lib/takvim";

export default function TakvimeEkle() {
  const [acik, setAcik] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const disariTiklandi = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setAcik(false);
      }
    };
    if (acik) {
      document.addEventListener("mousedown", disariTiklandi);
    }
    return () => document.removeEventListener("mousedown", disariTiklandi);
  }, [acik]);

  const appleTakvimeEkle = () => {
    icsEtkinlikIndir();
    setAcik(false);
  };

  return (
    <div className="tema2-takvim-kapsul" ref={menuRef}>
      <button
        type="button"
        className="tema2-takvim-btn"
        onClick={() => setAcik((o) => !o)}
        aria-haspopup="true"
        aria-expanded={acik}
      >
        <span className="tema2-takvim-ikon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </span>
        <span>Takvime Ekle</span>
      </button>

      {acik && (
        <div className="tema2-takvim-menu" role="menu">
          <a
            href={googleTakvimLinki()}
            target="_blank"
            rel="noopener noreferrer"
            className="tema2-takvim-secenek"
            role="menuitem"
            onClick={() => setAcik(false)}
          >
            <span className="tema2-takvim-secenek-ikon">📅</span>
            <span>Google Takvim</span>
          </a>
          <button
            type="button"
            className="tema2-takvim-secenek"
            role="menuitem"
            onClick={appleTakvimeEkle}
          >
            <span className="tema2-takvim-secenek-ikon">🍏</span>
            <span>Apple / Telefon Takvimi</span>
          </button>
        </div>
      )}
    </div>
  );
}
