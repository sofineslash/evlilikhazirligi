"use client";

import { useEffect, useRef, useState } from "react";

export default function KapiAcilis({
  solHarf = "K",
  sagHarf = "Ö",
  onAcildi,
  children,
}: {
  solHarf?: string;
  sagHarf?: string;
  onAcildi?: () => void;
  children: React.ReactNode;
}) {
  const [acildi, setAcildi] = useState(false);
  const [animasyonBitti, setAnimasyonBitti] = useState(false);
  const sahneRef = useRef<HTMLDivElement>(null);

  const kapagiAc = () => {
    if (acildi) return;
    setAcildi(true);
    onAcildi?.();
    setTimeout(() => {
      setAnimasyonBitti(true);
    }, 1250);
  };

  useEffect(() => {
    // Scroll edilirse de kapağı otomatik aç
    const onScroll = () => {
      if (!acildi && window.scrollY > 15) {
        kapagiAc();
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [acildi]);

  return (
    <div className="tema2-sahne-kapsayici" ref={sahneRef}>
      {/* 3B LÜKS KAPAK AÇILIŞ SAHNESİ */}
      {!animasyonBitti && (
        <div
          className={`tema2-kapak-overlay ${acildi ? "kapak-aciliyor" : ""}`}
          onClick={kapagiAc}
          role="button"
          tabIndex={0}
          aria-label="Davetiyeyi açmak için dokunun"
        >
          {/* Tek Parça 3B Davetiye Kapağı (Soldan Kitap/Albüm Kapağı Gibi Açılır) */}
          <div className="tema2-kapak-kanat">
            <div className="tema2-kapak-doku">
              <div className="tema2-kapak-cerceve-dis">
                <div className="tema2-kapak-cerceve-ic">
                  <div className="tema2-kapi-motif sol-ust" />
                  <div className="tema2-kapi-motif sol-alt" />
                  <div className="tema2-kapi-motif sag-ust" />
                  <div className="tema2-kapi-motif sag-alt" />
                </div>
              </div>
            </div>

            {/* Kapak Üzerindeki Mühür ve Aşağı Taşınan İpucu */}
            <div className="tema2-kapak-icerik">
              {/* Merkez Mühür & Açılış Madalyonu */}
              <div className="tema2-merkez-muhur-alani">
                <div className="tema2-kapi-muhur">
                  <div className="tema2-muhur-halka">
                    <span className="tema2-muhur-harfler">
                      {solHarf}
                      <span className="tema2-muhur-ve">&amp;</span>
                      {sagHarf}
                    </span>
                    <span className="tema2-muhur-dal" />
                  </div>
                </div>
              </div>

              {/* Aşağı Taşınmış ve Ortalanmış Rehber Metin */}
              <div className="tema2-kapak-ipucu-alani">
                <div className="tema2-ipucu-metin-kutusu">
                  <span className="tema2-ipucu-satir-1">Davetiyeyi Açmak</span>
                  <span className="tema2-ipucu-satir-2">İçin Dokunun</span>
                </div>
                <div className="tema2-ipucu-ok" aria-hidden="true">
                  <svg
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KAPAĞIN ALTINDAKİ GERÇEK DAVETİYE KARTI (Açılırken Gerçekten Görünür) */}
      <div className="tema2-icerik-alani">
        {children}
      </div>
    </div>
  );
}
