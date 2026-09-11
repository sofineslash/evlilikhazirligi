"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  misafirAd?: string;
  muzikRef: React.RefObject<HTMLAudioElement | null>;
  onAcildi: () => void;
}

export default function Tema3GirisOverlay({ misafirAd, muzikRef, onAcildi }: Props) {
  const [aciliyor, setAciliyor] = useState(false);
  const [videoFading, setVideoFading] = useState(false);
  const [tamamlandi, setTamamlandi] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioUnlockedRef = useRef(false);
  const bitirildiRef = useRef(false);
  const guvenlikTimerRef = useRef<NodeJS.Timeout | null>(null);

  // iOS Safari ve Android Chrome için ses kilidi açma
  const sesKilidiAc = () => {
    if (audioUnlockedRef.current) return;
    audioUnlockedRef.current = true;
    const audio = muzikRef.current;
    if (audio) {
      const p = audio.play();
      if (p && p.then) {
        p.then(() => {
          audio.pause();
          audio.currentTime = 0;
        }).catch(() => {});
      } else {
        audio.pause();
      }
    }
  };

  const bitirSekansi = () => {
    if (bitirildiRef.current) return;
    bitirildiRef.current = true;

    if (guvenlikTimerRef.current) {
      clearTimeout(guvenlikTimerRef.current);
      guvenlikTimerRef.current = null;
    }

    setVideoFading(true);

    // 700ms yumuşak erime ile arkadaki kuğu bahçesine geç ve katmanı kaldır
    setTimeout(() => {
      setTamamlandi(true);
    }, 700);
  };

  const acilisBaslat = () => {
    if (tamamlandi) return;
    if (aciliyor) {
      // İkinci tıklamada bekletmeden anında geç
      bitirSekansi();
      return;
    }
    setAciliyor(true);

    // 1. Fon müziğini başlat
    const audio = muzikRef.current;
    if (audio) {
      audio.volume = 1;
      const ap = audio.play();
      if (ap && ap.catch) ap.catch(() => {});
    }

    // 2. Açılış videosunu doğrudan kullanıcı tıklaması bağlamında başlat
    const video = videoRef.current;
    if (video) {
      video.currentTime = 0;
      const vp = video.play();
      if (vp && vp.catch) vp.catch(() => {});
    }

    // 3. Yüzen müzik kontrol butonunu aktifleştir
    onAcildi();

    // 4. Video 4.8s — 4.5s sonra garantili bitirme zamanlayıcısı (asla takılı kalmaz)
    guvenlikTimerRef.current = setTimeout(() => {
      bitirSekansi();
    }, 4500);
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    // Video son 0.6 saniyesine geldiğinde yumuşak erimeyi başlat
    if (video && video.duration && video.currentTime >= video.duration - 0.6) {
      bitirSekansi();
    }
  };

  useEffect(() => {
    if (!tamamlandi) {
      const prevBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevBodyOverflow;
        if (guvenlikTimerRef.current) {
          clearTimeout(guvenlikTimerRef.current);
        }
      };
    }
  }, [tamamlandi]);

  if (tamamlandi) return null;

  return (
    <>
      {/* 1. ADIM: ZARF VE MÜHÜR DOKUNMA KAPAĞI */}
      <div
        className={`tema3-giris-overlay ${aciliyor ? "overlay-gizle" : ""}`}
        onClick={acilisBaslat}
        onTouchStart={sesKilidiAc}
        role="button"
        tabIndex={0}
        aria-label="Davetiyeyi açmak için dokunun"
      >
        {misafirAd && (
          <div className="tema3-misafir-karsilama-kapak">
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
          <div className="tema3-altin-halo" aria-hidden="true" />
          <img
            src="/tema3/zarf_cover.jpg"
            alt="Kübranur & Ömür Davetiyesi"
            className="tema3-zarf-img"
            draggable={false}
          />
        </div>

        <div className="tema3-tap-wrap">
          <div className="tema3-chevron" />
          <div className="tema3-tap-label">Davetiyeyi Açmak İçin Dokunun</div>
        </div>
      </div>

      {/* 2. ADIM: SİNEMATİK VİDEO GEÇİŞ KATMANI (DOM'da hazır bekler, kullanıcı jestiyle anında akar) */}
      <div
        className={`tema3-video-wrap ${aciliyor && !videoFading ? "video-in" : ""} ${
          videoFading ? "video-out" : ""
        }`}
        onClick={bitirSekansi}
      >
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

        <video
          ref={videoRef}
          className="tema3-intro-video"
          src="/tema3/intro.mp4"
          poster="/tema3/zarf_cover.jpg"
          muted
          playsInline
          preload="auto"
          onTimeUpdate={handleTimeUpdate}
          onEnded={bitirSekansi}
          suppressHydrationWarning
        />
      </div>
    </>
  );
}
