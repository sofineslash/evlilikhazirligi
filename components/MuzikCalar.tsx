"use client";

import { useEffect, useRef, useState } from "react";

export default function MuzikCalar({
  aktif,
  sesDosyasi = "/api/muzik/ses",
}: {
  aktif: boolean;
  sesDosyasi?: string;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [caliyor, setCaliyor] = useState(false);
  const [yuklendi, setYuklendi] = useState(false);

  useEffect(() => {
    if (!aktif) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setCaliyor(false);
      return;
    }

    const audio = new Audio();
    audio.src = sesDosyasi;
    audio.loop = true;
    audio.preload = "auto";
    audioRef.current = audio;

    const onCanPlay = () => setYuklendi(true);
    const onPlay = () => setCaliyor(true);
    const onPause = () => setCaliyor(false);
    const onError = (e: Event) => {
      console.warn("Müzik yüklenemedi:", e);
      setYuklendi(false);
      setCaliyor(false);
    };

    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("canplaythrough", onCanPlay);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("error", onError);

    let temizlendi = false;
    const temizle = () => {
      if (temizlendi) return;
      temizlendi = true;
      window.removeEventListener("click", baslat);
      window.removeEventListener("touchstart", baslat);
      window.removeEventListener("pointerdown", baslat);
    };

    // Mobil tarayıcı autoplay kuralını aşmak için ilk kullanıcı etkileşimini dinle
    const baslat = () => {
      if (audioRef.current && audioRef.current.paused) {
        const p = audioRef.current.play();
        if (p && typeof p.then === "function") {
          p.then(() => {
            temizle();
          }).catch(() => {
            // Tarayıcı bu dokunuşta izin vermediyse bir sonraki dokunuşta tekrar denensin
          });
        }
      }
    };

    window.addEventListener("click", baslat, { passive: true });
    window.addEventListener("touchstart", baslat, { passive: true });
    window.addEventListener("pointerdown", baslat, { passive: true });

    return () => {
      temizle();
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("canplaythrough", onCanPlay);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("error", onError);
      audio.pause();
      audio.src = "";
    };
  }, [aktif, sesDosyasi]);

  if (!aktif) return null;

  const toggleMuzik = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (caliyor) {
      audio.pause();
    } else {
      audio.play().catch((err) => {
        console.warn("Müzik çalma başlatılamadı:", err);
      });
    }
  };

  return (
    <div className="muzik-kapsul" aria-label="Fon müziği kontrolü">
      <button
        type="button"
        className={`muzik-btn ${caliyor ? "caliyor" : "durdu"}`}
        onClick={toggleMuzik}
        title={caliyor ? "Müziği Durdur" : "Müziği Başlat"}
        aria-label={caliyor ? "Müziği Durdur" : "Müziği Başlat"}
      >
        <span className="muzik-ikon">
          {caliyor ? (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M4.27 3L3 4.27l9 9v.28c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4v-1.73L19.73 21 21 19.73 4.27 3zM14 7h4V3h-6v5.18l2 2V7z" />
            </svg>
          )}
        </span>
        {caliyor && (
          <span className="muzik-dalgalar" aria-hidden="true">
            <span className="dalga dalga-1" />
            <span className="dalga dalga-2" />
            <span className="dalga dalga-3" />
          </span>
        )}
      </button>
    </div>
  );
}
