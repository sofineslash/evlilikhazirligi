"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  misafirAd?: string;
  muzikRef: React.RefObject<HTMLAudioElement | null>;
  onAcildi: () => void;
}

export default function Tema3GirisOverlay({ misafirAd, muzikRef, onAcildi }: Props) {
  const [overlayGorunur, setOverlayGorunur] = useState(true);
  const [overlayFading, setOverlayFading] = useState(false);
  const [videoAktif, setVideoAktif] = useState(false);
  const [videoFading, setVideoFading] = useState(false);
  const [tamamlandi, setTamamlandi] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioUnlockedRef = useRef(false);

  // iOS Safari ve Android Chrome için ses kilidini açma (Touchstart priming)
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

  const baslatSekansi = () => {
    if (overlayFading || tamamlandi) return;
    setOverlayFading(true);

    // Zarfı yavaşça soldur (1.4s ease)
    setTimeout(() => {
      setOverlayGorunur(false);
    }, 1400);

    // Videoyu göster ve başlat
    setVideoAktif(true);
    const video = videoRef.current;
    if (video) {
      video.currentTime = 0;
      const vp = video.play();
      if (vp && vp.catch) vp.catch(() => {});
    }

    // Fon müziğini başlat
    const audio = muzikRef.current;
    if (audio) {
      audio.volume = 1;
      const ap = audio.play();
      if (ap && ap.catch) ap.catch(() => {});
    }

    // Dışarıya bildir (müzik butonu vb. için)
    onAcildi();
  };

  const bitirSekansi = () => {
    if (tamamlandi) return;
    setVideoFading(true);
    setTimeout(() => {
      setVideoAktif(false);
      setTamamlandi(true);
    }, 1400);
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (video && video.duration && video.currentTime >= video.duration - 0.8) {
      bitirSekansi();
    }
  };

  useEffect(() => {
    if (!tamamlandi) {
      const prevBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevBodyOverflow;
      };
    }
  }, [tamamlandi]);

  if (tamamlandi) return null;

  return (
    <>
      {/* 1. ADIM: ZARF VE MÜHÜR AÇILIŞ KAPAĞI */}
      {overlayGorunur && (
        <div
          className={`tema3-giris-overlay ${overlayFading ? "overlay-gizle" : ""}`}
          onClick={baslatSekansi}
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

          <img
            src="/tema3/zarf.png"
            alt="Davetiyeyi Aç"
            className="tema3-zarf-img"
            draggable={false}
          />

          <div className="tema3-tap-wrap">
            <div className="tema3-chevron" />
            <div className="tema3-tap-label">Davetiyeyi Açmak İçin Dokunun</div>
          </div>
        </div>
      )}

      {/* 2. ADIM: SİNEMATİK VİDEO GEÇİŞİ */}
      {videoAktif && (
        <div
          className={`tema3-video-wrap ${videoAktif && !videoFading ? "video-in" : ""} ${
            videoFading ? "video-out" : ""
          }`}
        >
          <button
            type="button"
            className="tema3-video-gec-btn"
            onClick={bitirSekansi}
            aria-label="Geç"
          >
            Geç ✕
          </button>

          <video
            ref={videoRef}
            className="tema3-intro-video"
            src="/tema3/intro.mp4"
            muted
            playsInline
            preload="auto"
            onTimeUpdate={handleTimeUpdate}
            onEnded={bitirSekansi}
            suppressHydrationWarning
          />
        </div>
      )}
    </>
  );
}
