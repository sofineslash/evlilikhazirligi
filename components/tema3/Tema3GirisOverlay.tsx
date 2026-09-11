"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  misafirAd?: string;
  muzikRef: React.RefObject<HTMLAudioElement | null>;
  onAcildi: () => void;
}

export default function Tema3GirisOverlay({ misafirAd, muzikRef, onAcildi }: Props) {
  const [aciliyor, setAciliyor] = useState(false);
  const [videoOynuyor, setVideoOynuyor] = useState(false);
  const [videoFading, setVideoFading] = useState(false);
  const [tamamlandi, setTamamlandi] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioUnlockedRef = useRef(false);
  const bitirildiRef = useRef(false);
  const guvenlikTimerRef = useRef<NodeJS.Timeout | null>(null);
  const acilisZamaniRef = useRef<number>(0);

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

    // 800ms yumuşak erime ile arkadaki kuğu bahçesine geç ve katmanı kaldır
    setTimeout(() => {
      setTamamlandi(true);
    }, 800);
  };

  const acilisBaslat = () => {
    if (tamamlandi) return;
    if (aciliyor) {
      // İkinci tıklamada yalnızca 1.5s sonra geçişe izin ver (çift dokunma koruması)
      if (Date.now() - acilisZamaniRef.current > 1500) {
        bitirSekansi();
      }
      return;
    }
    setAciliyor(true);
    acilisZamaniRef.current = Date.now();

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

    // 4. Video 4.83s — 5.4s sonra garantili bitirme zamanlayıcısı (asla erken kesilmez, takılı kalmaz)
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
      // Video son 0.25 saniyesine geldiğinde yumuşak erimeyi başlat
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
    <div
      className={`tema3-giris-overlay ${videoFading ? "overlay-kapanis" : ""}`}
      onClick={handleOverlayClick}
      onTouchStart={sesKilidiAc}
      role="button"
      tabIndex={0}
      aria-label="Davetiyeyi açmak için dokunun"
    >
      {/* Misafir Karşılama Rozeti (Açılış tıklanınca yumuşakça kaybolur) */}
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

      {/* Ortadaki Zarf / Video Kapsayıcısı */}
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

        {/* Video ilk karesini çizene kadar sabit kalan kapak resmi (Asla sıçrama veya aralık yapmaz) */}
        <img
          src="/tema3/zarf_cover.jpg"
          alt="Kübranur & Ömür Davetiyesi"
          className={`tema3-zarf-img ${videoOynuyor ? "img-gizli" : ""}`}
          draggable={false}
        />

        {/* Dokun uyarısı */}
        <div className={`tema3-tap-wrap ${aciliyor ? "oge-gizle" : ""}`}>
          <div className="tema3-chevron" />
          <div className="tema3-tap-label">Davetiyeyi Açmak İçin Dokunun</div>
        </div>
      </div>

      {/* Video başladıktan sonra sağ üstte beliren "Geç ✕" butonu */}
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
  );
}
