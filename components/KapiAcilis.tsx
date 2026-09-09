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
    try {
      window.dispatchEvent(new CustomEvent("davetiye-muzik-cal"));
    } catch {}
    setAcildi(true);
    onAcildi?.();
    setTimeout(() => {
      setAnimasyonBitti(true);
    }, 1250);
  };

  useEffect(() => {
    // Kapak kapalıyken sayfa kaydırmasını (scroll) tamamen kilitle:
    // Giriş sayfası telefon ekranı ile 1:1 kalsın, aşağı kaymasın.
    if (!acildi) {
      const prevBodyOverflow = document.body.style.overflow;
      const prevHtmlOverflow = document.documentElement.style.overflow;
      const prevBodyHeight = document.body.style.height;
      const prevHtmlHeight = document.documentElement.style.height;

      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      document.body.style.height = "100%";
      document.documentElement.style.height = "100%";

      return () => {
        document.body.style.overflow = prevBodyOverflow;
        document.documentElement.style.overflow = prevHtmlOverflow;
        document.body.style.height = prevBodyHeight;
        document.documentElement.style.height = prevHtmlHeight;
      };
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      document.body.style.height = "";
      document.documentElement.style.height = "";
    }
  }, [acildi]);

  return (
    <div
      className={`tema2-sahne-kapsayici ${!acildi ? "kapak-kapali" : "kapak-acildi"}`}
      ref={sahneRef}
    >
      {/* 3B LÜKS ÇİFT KANATLI ORTADAN AÇILAN DAVETİYE KAPAĞI */}
      {!animasyonBitti && (
        <div
          className={`tema2-kapak-overlay ${acildi ? "kapak-aciliyor" : ""}`}
          onClick={kapagiAc}
          role="button"
          tabIndex={0}
          aria-label="Davetiyeyi açmak için dokunun"
        >
          {/* SOL KANAT (Ortadan Sola Doğru 3B Açılır) */}
          <div className="tema2-kapak-kanat sol-kanat">
            <div className="tema2-kanat-doku sol">
              <div className="tema2-kanat-cerceve sol">
                <div className="tema2-kapi-motif sol-ust" />
                <div className="tema2-kapi-motif sol-alt" />
              </div>
            </div>
          </div>

          {/* SAĞ KANAT (Ortadan Sağa Doğru 3B Açılır — MÜHÜR SAĞ KANADA BAĞLIDIR) */}
          <div className="tema2-kapak-kanat sag-kanat">
            <div className="tema2-kanat-doku sag">
              <div className="tema2-kanat-cerceve sag">
                <div className="tema2-kapi-motif sag-ust" />
                <div className="tema2-kapi-motif sag-alt" />
              </div>
            </div>

            {/* MÜHÜR SAĞ KANADA MONTE EDİLMİŞTİR (Kanatla birlikte sağa açılır) */}
            <div className="tema2-kapi-muhur-kapsayici" aria-hidden="true">
              <div className="tema2-kapi-muhur">
                <div className="tema2-muhur-halka">
                  <span className="tema2-muhur-harfler">
                    {sol}
                    <span className="tema2-muhur-ve">&amp;</span>
                    {sag}
                  </span>
                  <span className="tema2-muhur-dal" />
                </div>
              </div>
            </div>
          </div>

          {/* KAPAĞIN ÜZERİNDEKİ YAZI VE İPUCU DÜZENİ */}
          <div className="tema2-kapak-icerik">
            {/* Üst Alan: Taç/Motif ve Nişan Davetiyesi */}
            <div className="tema2-kapak-ust">
              <div className="tema2-kapak-motif" aria-hidden="true">
                <span className="tema2-motif-cizgi" />
                <span className="tema2-motif-simge">❖</span>
                <span className="tema2-motif-cizgi" />
              </div>
              <div className="tema2-kapak-baslik">NİŞAN DAVETİYESİ</div>
            </div>

            {/* Orta Alan: Çiftin İsimleri */}
            <div className="tema2-kapak-orta">
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
      )}

      {/* KAPAĞIN ALTINDAKİ GERÇEK DAVETİYE KARTI (Açılırken arkada doğrudan görünür) */}
      <div className="tema2-icerik-alani">
        {children}
      </div>
    </div>
  );
}
