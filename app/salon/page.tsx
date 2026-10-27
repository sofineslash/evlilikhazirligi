import type { Metadata } from "next";

/* Arama motorları indekslemesin: bu sayfa misafirler için değil, salon
   ekranına görseli koyacak kişi için. Adresi bilen indirebilir. */
export const metadata: Metadata = {
  title: "Salon ekranı",
  robots: { index: false, follow: false },
};

const DOSYALAR = [
  {
    ad: "Full HD",
    boyut: "1920 × 1080",
    yol: "/salon/nisan-hosgeldiniz-1920x1080.png",
    dosya: "nisan-hosgeldiniz-1920x1080.png",
    not: "Standart salon ekranı ve projeksiyon için.",
    birincil: true,
  },
  {
    ad: "4K",
    boyut: "3840 × 2160",
    yol: "/salon/nisan-hosgeldiniz-3840x2160.jpg",
    dosya: "nisan-hosgeldiniz-3840x2160.jpg",
    not: "Ekran 4K ise bunu kullanın; daha keskin görünür.",
    birincil: false,
  },
];

export default function Salon() {
  return (
    <main className="salon-sayfa">
      <style>{`
        body { background: #120c07 !important; }
        .salon-sayfa { max-width: 1040px; margin: 0 auto; padding: 2.2rem 1rem 3rem; color: #f2e4c1; text-align: center; }
        .salon-sayfa h1 { font-size: clamp(1.4rem, 4vw, 2rem); letter-spacing: .12em; margin: 0 0 .4rem; color: #e6c476; text-transform: uppercase; }
        .salon-sayfa p.alt { margin: 0 0 1.6rem; color: #cdb98a; font-size: .95rem; }
        .salon-onizleme { display: block; width: 100%; height: auto; aspect-ratio: 16 / 9; border-radius: 12px;
          border: 2px solid rgba(214,174,92,.7); box-shadow: 0 18px 60px rgba(0,0,0,.6); background: #1a1209; }
        .salon-liste { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem; margin-top: 1.6rem; }
        .salon-kart { padding: 1.1rem 1rem; border: 1px solid rgba(214,174,92,.4); border-radius: 14px; background: rgba(255,255,255,.04); }
        .salon-kart strong { display: block; font-size: 1.05rem; color: #f6e9c9; }
        .salon-kart span { display: block; margin-top: .2rem; font-size: .85rem; color: #cdb98a; }
        .salon-indir { display: inline-flex; align-items: center; justify-content: center; margin-top: .9rem; min-height: 48px; padding: .6rem 1.4rem;
          border-radius: 999px; font-weight: 700; text-decoration: none; color: #2a1d0b; background: linear-gradient(180deg, #f3d98f, #d6ae5c);
          border: 1px solid #b8893a; }
        .salon-indir.ikincil { color: #f2e4c1; background: transparent; border-color: rgba(214,174,92,.7); }
        .salon-indir:focus-visible { outline: 3px solid #fff3cf; outline-offset: 3px; }
      `}</style>

      <h1>Nişanımıza Hoş Geldiniz</h1>
      <p className="alt">Salon ekranı görseli. Aşağıdan indirip ekrana yansıtabilirsiniz.</p>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="salon-onizleme"
        src="/salon/nisan-hosgeldiniz-1920x1080.png"
        alt="Nişanımıza Hoş Geldiniz — Kübranur & Ömür, 29 Ekim 2026, sitenin QR kodu"
        width={1920}
        height={1080}
      />

      <div className="salon-liste">
        {DOSYALAR.map((d) => (
          <div className="salon-kart" key={d.dosya}>
            <strong>{d.ad} · {d.boyut}</strong>
            <span>{d.not}</span>
            <a className={`salon-indir${d.birincil ? "" : " ikincil"}`} href={d.yol} download={d.dosya}>
              İndir
            </a>
          </div>
        ))}
      </div>
    </main>
  );
}
