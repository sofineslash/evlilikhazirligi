"use client";

import { useState, useEffect } from "react";
import { googleTakvimLinki } from "@/lib/takvim";

export default function TakvimeEkle() {
  const [hedefLink, setHedefLink] = useState("/takvim.ics");
  const [hedefTarget, setHedefTarget] = useState<string | undefined>(undefined);

  useEffect(() => {
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
    if (/Android/i.test(ua)) {
      setHedefLink(googleTakvimLinki());
      setHedefTarget("_blank");
    } else {
      setHedefLink("/takvim.ics");
      setHedefTarget(undefined);
    }
  }, []);

  return (
    <div className="tema2-takvim-kapsul">
      <a
        href={hedefLink}
        target={hedefTarget}
        rel={hedefTarget ? "noopener noreferrer" : undefined}
        className="tema2-takvim-btn"
        title="Telefon Takvimine Ekle"
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
      </a>
    </div>
  );
}
