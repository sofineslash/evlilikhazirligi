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
    askSozu || "Two Souls, One destiny\nA Lifetime written by Allah";
  const davet =
    davetCumlesi ||
    "Sevgili Ailemiz ve Dostlarımız, Sonsuzluğumuza adım atarken bu özel günümüzde sizleri de aramızda görmekten mutluluk duyarız.";

  const scrollAsagi = () => {
    window.scrollBy({ top: window.innerHeight * 0.75, behavior: "smooth" });
  };

  return (
    <section className="tema3-hero-bolum">
      {/* 1. DÖNGÜSEL KUĞU ARKA PLAN VİDEOSU */}
      <div className="tema3-kugu-video-kapsayici" aria-hidden="true">
        <video
          className="tema3-kugu-video"
          src="/tema3/swans.mp4"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          suppressHydrationWarning
        />
        <div className="tema3-kugu-video-overlay" />
      </div>

      {/* SÜZÜLEN DEKORATİF GÜL VE ÇİÇEK MOTİFLERİ */}
      <img
        src="/tema3/gul.png"
        alt=""
        className="tema3-sulu-gul sol"
        aria-hidden="true"
      />
      <img
        src="/tema3/gul.png"
        alt=""
        className="tema3-sulu-gul sag"
        aria-hidden="true"
      />

      {/* TEPE BAŞLIK VE TARİH */}
      <h2 className="tema3-tepe-baslik">{baslik}</h2>
      <div className="tema3-tarih-ust">{tarih}</div>

      {/* ÇİFTİN İSİMLERİ */}
      <h1 className="tema3-isimler">
        <span>{gelinAd}</span>
        <span className="tema3-ve-isareti">&amp;</span>
        <span>{damatAd}</span>
      </h1>

      {/* DEKORATİF ÇİZGİ DESENİ */}
      <img
        src="/tema3/separator.png"
        alt=""
        style={{ width: "160px", margin: "0.4rem auto 1rem", opacity: 0.8 }}
        aria-hidden="true"
      />

      {/* ROMANTİK AŞK SÖZÜ */}
      <div className="tema3-romantik-soz" style={{ whiteSpace: "pre-line" }}>
        {soz}
      </div>

      {/* DAVET PARAGRAFI */}
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
    </section>
  );
}
