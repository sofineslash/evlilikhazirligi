"use client";

import { useEffect, useRef, useState } from "react";

export default function KapiAcilis({
  misafirAd,
  onAcildi,
  children,
}: {
  gelinAd?: string;
  damatAd?: string;
  solHarf?: string;
  sagHarf?: string;
  misafirAd?: string;
  onAcildi?: () => void;
  children: React.ReactNode;
}) {
  const [aciliyor, setAciliyor] = useState(false);
  const [videoOynuyor, setVideoOynuyor] = useState(false);
  const [videoFading, setVideoFading] = useState(false);
  const [animasyonBitti, setAnimasyonBitti] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const bitirildiRef = useRef(false);
  const guvenlikTimerRef = useRef<NodeJS.Timeout | null>(null);
  const acilisZamaniRef = useRef<number>(0);

  const bitirSekansi = () => {
    if (bitirildiRef.current) return;
    bitirildiRef.current = true;

    if (guvenlikTimerRef.current) {
      clearTimeout(guvenlikTimerRef.current);
      guvenlikTimerRef.current = null;
    }

    setVideoFading(true);

    // 800ms yumuşak erime ile arkadaki Tema 2 içeriğine geç ve katmanı kaldır
    setTimeout(() => {
      setAnimasyonBitti(true);
    }, 800);
  };

  const acilisBaslat = () => {
    if (animasyonBitti) return;
    if (aciliyor) {
      // Çift dokunma koruması (1.5s)
      if (Date.now() - acilisZamaniRef.current > 1500) {
        bitirSekansi();
      }
      return;
    }
    setAciliyor(true);
    acilisZamaniRef.current = Date.now();

    // 1. Fon müziğini başlat (MuzikCalar bunu dinler)
    try {
      window.dispatchEvent(new CustomEvent("davetiye-muzik-cal"));
    } catch {}

    // 2. Açılış videosunu başlat
    const video = videoRef.current;
    if (video) {
      video.currentTime = 0;
      const vp = video.play();
      if (vp && vp.catch) vp.catch(() => {});
    }

    onAcildi?.();

    // 3. 4.83s video için 5.4s güvenlik sınırı
    guvenlikTimerRef.current = setTimeout(() => {
      bitirSekansi();
    }, 5400);
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (video) {
      if (!videoOynuyor && video.currentTime > 0.05) {
        setVideoOynuyor(true);
      }
      if (video.duration && video.currentTime >= video.duration - 0.25) {
        bitirSekansi();
      }
    }
  };

  const handleOverlayClick = () => {
    if (!aciliyor) {
      acilisBaslat();
    } else {
      if (Date.now() - acilisZamaniRef.current > 1500) {
        bitirSekansi();
      }
    }
  };

  useEffect(() => {
    if (!animasyonBitti) {
      const prevBodyOverflow = document.body.style.overflow;
      const prevHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";

      return () => {
        document.body.style.overflow = prevBodyOverflow;
        document.documentElement.style.overflow = prevHtmlOverflow;
        if (guvenlikTimerRef.current) {
          clearTimeout(guvenlikTimerRef.current);
        }
      };
    }
  }, [animasyonBitti]);

  return (
    <div className={`tema2-sahne-kapsayici ${animasyonBitti ? "kapak-acildi" : "kapak-kapali"}`}>
      {!animasyonBitti && (
        <div
          className={`tema3-giris-overlay ${videoFading ? "overlay-kapanis" : ""}`}
          onClick={handleOverlayClick}
          role="button"
          tabIndex={0}
          aria-label="Davetiyeyi açmak için dokunun"
        >
          {misafirAd && (
            <div className={`tema3-misafir-karsilama-kapak ${aciliyor ? "oge-gizle" : ""}`}>
              <span className="tema3-misafir-ikon">💌</span>
              <div className="tema3-misafir-metinler">
                <span className="tema3-misafir-hitap">Sayın {misafirAd},</span>
                <span className="tema3-misafir-cumle">
                  Özel günümüzde sizleri de aramızda görmekten onur ve mutluluk duyarız.
                </span>
              </div>
            </div>
          )}

          <div className="tema3-zarf-sarma">
            <video
              ref={videoRef}
              className="tema3-intro-video"
              src="/tema3/orijinal_intro_20260911223616.mp4"
              poster="/tema3/zarf_cover.jpg"
              muted
              playsInline
              preload="auto"
              onTimeUpdate={handleTimeUpdate}
              onPlaying={() => setVideoOynuyor(true)}
              onEnded={bitirSekansi}
              suppressHydrationWarning
            />

            <img
              src="/tema3/zarf_cover.jpg"
              alt="Kübranur & Ömür Davetiyesi"
              className={`tema3-zarf-img ${videoOynuyor ? "img-gizli" : ""}`}
              draggable={false}
            />

            <div className={`tema3-tap-wrap ${aciliyor ? "oge-gizle" : ""}`}>
              <div className="tema3-chevron" />
              <div className="tema3-tap-label">Davetiyeyi Açmak İçin Dokunun</div>
            </div>
          </div>

          {aciliyor && !videoFading && (
            <button
              type="button"
              className="tema3-video-gec-btn"
              onClick={(e) => {
                e.stopPropagation();
                bitirSekansi();
              }}
              aria-label="Geç"
            >
              Geç ✕
            </button>
          )}
        </div>
      )}

      {/* KAPAĞIN ALTINDAKİ GERÇEK DAVETİYE KARTI */}
      <div className="tema2-icerik-alani">
        {children}
      </div>
    </div>
  );
}
