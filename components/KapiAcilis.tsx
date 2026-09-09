"use client";

import { useEffect, useRef, useState } from "react";

export default function KapiAcilis({
  gelinAd = "Kübranur",
  damatAd = "Ömür",
  solHarf,
  sagHarf,
  onAcildi,
  children,
}: {
  gelinAd?: string;
  damatAd?: string;
  solHarf?: string;
  sagHarf?: string;
  onAcildi?: () => void;
  children: React.ReactNode;
}) {
  const [acildi, setAcildi] = useState(false);
  const [animasyonBitti, setAnimasyonBitti] = useState(false);
  const sahneRef = useRef<HTMLDivElement>(null);

  const sol = solHarf || (gelinAd ? gelinAd.charAt(0).toUpperCase() : "K");
  const sag = sagHarf || (damatAd ? damatAd.charAt(0).toUpperCase() : "Ö");

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
      {/* 3B LÜKS FİLDİŞİ & ŞAMPANYA DAVETİYE KAPAĞI */}
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

            {/* Kapak Üzerindeki Lüks Davetiye Kompozisyonu */}
            <div className="tema2-kapak-icerik">
              {/* Dikey İpek Şampanya Kurdele */}
              <div className="tema2-kapak-kurdele" aria-hidden="true" />

              {/* Üst Alan: Taç/Motif ve Nişan Davetiyesi Başlığı */}
              <div className="tema2-kapak-ust">
                <div className="tema2-kapak-motif" aria-hidden="true">
                  <span className="tema2-motif-cizgi" />
                  <span className="tema2-motif-simge">❖</span>
                  <span className="tema2-motif-cizgi" />
                </div>
                <div className="tema2-kapak-baslik">NİŞAN DAVETİYESİ</div>
              </div>

              {/* Orta Alan: Altın Mühür ve Çiftin İsimleri */}
              <div className="tema2-kapak-orta">
                <div className="tema2-kapi-muhur" aria-hidden="true">
                  <div className="tema2-muhur-halka">
                    <span className="tema2-muhur-harfler">
                      {sol}
                      <span className="tema2-muhur-ve">&amp;</span>
                      {sag}
                    </span>
                    <span className="tema2-muhur-dal" />
                  </div>
                </div>

                <div className="tema2-kapak-isimler">
                  {gelinAd} <span className="ve">&amp;</span> {damatAd}
                </div>
              </div>

              {/* Alt Alan: Açılış İpucu Butonu */}
              <div className="tema2-kapak-alt">
                <div className="tema2-ipucu-metin-kutusu">
                  <span className="tema2-ipucu-zarf-ikon">✉</span>
                  <div className="tema2-ipucu-metin-grup">
                    <span className="tema2-ipucu-satir-1">Davetiyeyi Açmak İçin</span>
                    <span className="tema2-ipucu-satir-2">Dokunun</span>
                  </div>
                  <div className="tema2-ipucu-ok" aria-hidden="true">
                    <svg
                      viewBox="0 0 24 24"
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
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
        </div>
      )}

      {/* KAPAĞIN ALTINDAKİ GERÇEK DAVETİYE KARTI (Açılırken Gerçekten Görünür) */}
      <div className="tema2-icerik-alani">
        {children}
      </div>
    </div>
  );
}
