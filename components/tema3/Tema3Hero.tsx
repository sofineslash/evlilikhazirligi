"use client";

interface Props {
  gelinAd: string;
  damatAd: string;
  tepeBaslik?: string;
  tarihKisa?: string;
  askSozu?: string;
  davetCumlesi?: string;
}

export default function Tema3Hero({
  gelinAd,
  damatAd,
  tepeBaslik,
  tarihKisa,
  askSozu,
  davetCumlesi,
}: Props) {
  const baslik = tepeBaslik || "NİŞAN TÖRENİ";
  const tarih = tarihKisa || "29.10.2026";
  const soz =
    askSozu || "İki Ruh, Tek Kader\nSonsuzluğa Atılan İlk Adım";
  const davet =
    davetCumlesi ||
    "Sevgili Ailemiz ve Dostlarımız, Sonsuzluğumuza adım atarken bu özel günümüzde sizleri de aramızda görmekten mutluluk duyarız.";

  const scrollAsagi = () => {
    window.scrollBy({ top: window.innerHeight * 0.8, behavior: "smooth" });
  };

  return (
    <section className="tema3-hero-bolum">
      {/* 1. TAŞ KEMER VE KUĞU VİDEOSU ARKA PLANI */}
      <div className="tema3-kemer-kapsayici">
        <video
          className="tema3-kugu-video"
          src="/tema3/swans.mp4"
          poster="/tema3/swans_poster.jpg"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          suppressHydrationWarning
        />
        <div className="tema3-kugu-video-overlay" />
        <div className="tema3-kugu-alt-gecis" />

        {/* KEMER İÇİNDEKİ YAZILAR (Açık gökyüzü alanında) */}
        <div className="tema3-kemer-metinler">
          <h2 className="tema3-tepe-baslik">{baslik}</h2>
          <div className="tema3-tarih-ust">{tarih}</div>

          <div className="tema3-isimler-alani">
            <img
              src="/tema3/gul.png"
              alt=""
              className="tema3-sulu-gul sol"
              aria-hidden="true"
            />
            <h1 className="tema3-isimler tema3-isimler-el-yazisi">
              <span>{gelinAd}</span>
              <span className="tema3-isim-kalp" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </span>
              <span>{damatAd}</span>
            </h1>
            <img
              src="/tema3/gul.png"
              alt=""
              className="tema3-sulu-gul sag"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>

      {/* 2. KEMERİN ALTINDAKİ VİNTAGE PARŞÖMEN ALANI */}
      <div className="tema3-parsomon-alani">
        <div className="tema3-romantik-soz" style={{ whiteSpace: "pre-line" }}>
          {soz}
        </div>

        <p className="tema3-davet-paragraf">{davet}</p>

        {/* AŞAĞI KAYDIRIN UYARISI */}
        <div
          className="tema3-scroll-down"
          onClick={scrollAsagi}
          role="button"
          tabIndex={0}
        >
          <span className="tema3-scroll-text">Aşağı Kaydırın</span>
          <svg
            className="tema3-scroll-chevron"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>

        <img
          src="/tema3/separator.png"
          alt=""
          className="tema3-separator-img"
          aria-hidden="true"
        />
      </div>
    </section>
  );
}
