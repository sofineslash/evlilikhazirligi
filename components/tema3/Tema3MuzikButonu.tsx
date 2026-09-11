"use client";

import { useEffect, useState } from "react";

interface Props {
  muzikRef: React.RefObject<HTMLAudioElement | null>;
  gorunur: boolean;
}

export default function Tema3MuzikButonu({ muzikRef, gorunur }: Props) {
  const [caliyor, setCaliyor] = useState(false);

  useEffect(() => {
    const audio = muzikRef.current;
    if (!audio) return;

    const handlePlay = () => setCaliyor(true);
    const handlePause = () => setCaliyor(false);

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
    };
  }, [muzikRef]);

  const toggleMuzik = () => {
    const audio = muzikRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  };

  return (
    <button
      type="button"
      className={`tema3-muzik-btn ${gorunur ? "gorunur" : ""}`}
      onClick={toggleMuzik}
      aria-label={caliyor ? "Müziği Duraklat" : "Müziği Başlat"}
    >
      {caliyor ? (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="6" y="5" width="4" height="14" rx="1" />
          <rect x="14" y="5" width="4" height="14" rx="1" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <polygon points="5,3 19,12 5,21" />
        </svg>
      )}
    </button>
  );
}
