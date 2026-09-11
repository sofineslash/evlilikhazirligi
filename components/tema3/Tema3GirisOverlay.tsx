"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  misafirAd?: string;
  muzikRef: React.RefObject<HTMLAudioElement | null>;
  onAcildi: () => void;
}

export default function Tema3GirisOverlay({ misafirAd, muzikRef, onAcildi }: Props) {
  const [aciliyor, setAciliyor] = useState(false);
  const [tamamlandi, setTamamlandi] = useState(false);
  const audioUnlockedRef = useRef(false);

  // iOS Safari ve Android Chrome için dokunma ile ses kilidini açma
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

  const acilisBaslat = () => {
    if (tamamlandi) return;
    if (aciliyor) {
      // İkinci tıklamada anında geç
      setTamamlandi(true);
      return;
    }
    setAciliyor(true);

    // Müziği başlat
    const audio = muzikRef.current;
    if (audio) {
      audio.volume = 1;
      const ap = audio.play();
      if (ap && ap.catch) ap.catch(() => {});
    }

    // Yüzen müzik butonunu aktif et
    onAcildi();

    // 1.1 saniyelik altın ışıltı ve zarf süzülme animasyonundan sonra katmanı tamamen kaldır
    setTimeout(() => {
      setTamamlandi(true);
    }, 1100);
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
    <div
      className={`tema3-giris-overlay ${aciliyor ? "overlay-aciliyor" : ""}`}
      onClick={acilisBaslat}
      onTouchStart={sesKilidiAc}
      role="button"
      tabIndex={0}
      aria-label="Davetiyeyi açmak için dokunun"
    >
      {/* 1. KİŞİYE ÖZEL MİSAFİR KARŞILAMA KARTI */}
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

      {/* 2. ZARF VE MERKEZİ ALTIN IŞIK HALOSU */}
      <div className="tema3-zarf-sarma">
        <div className="tema3-altin-halo" aria-hidden="true" />
        <img
          src="/tema3/zarf.png"
          alt="Kübranur & Ömür Davetiyesi"
          className="tema3-zarf-img"
          draggable={false}
        />
      </div>

      {/* 3. DOKUN VE AÇ UYARISI */}
      <div className="tema3-tap-wrap">
        <div className="tema3-chevron" />
        <div className="tema3-tap-label">Davetiyeyi Açmak İçin Dokunun</div>
      </div>
    </div>
  );
}
