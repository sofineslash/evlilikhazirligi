"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SlaytOge = {
  id: string;
  tur: "foto" | "video";
  yukleyen: string | null;
  /** Piksel boyutu — mozaikte yer ayırmak için (sayfa kaymasın). */
  g: number | null;
  y: number | null;
};

const OTO_MS = 5000;
const SAYFA = 24;

/* Slayt kartı ve mozaik KÜÇÜK boy ister (?w=); tam boy yalnızca büyütmede.
   Yüzlerce fotoğrafı tam boyda indirmek telefonda onlarca MB demek. */
const kucuk = (o: SlaytOge, w: 480 | 960) =>
  o.tur === "video" ? `/api/an/${o.id}?kapak=1` : `/api/an/${o.id}?w=${w}`;
const tam = (o: SlaytOge) => `/api/an/${o.id}`;
const indirUrl = (o: SlaytOge) => `/api/an/${o.id}?indir=1`;

/** Yatay kaydırma jesti. Dikey kaydırmayı bozmamak için yatay baskın olmalı. */
function kaydirma(sonraki: () => void, onceki: () => void, isaret: { current: boolean }) {
  let x0: number | null = null;
  let y0 = 0;
  return {
    onPointerDown: (e: React.PointerEvent) => { x0 = e.clientX; y0 = e.clientY; },
    onPointerUp: (e: React.PointerEvent) => {
      if (x0 === null) return;
      const dx = e.clientX - x0;
      const dy = e.clientY - y0;
      x0 = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.3) {
        // Kaydırmanın ardından gelen "click" büyütmeyi açmasın.
        isaret.current = true;
        setTimeout(() => { isaret.current = false; }, 350);
        if (dx < 0) sonraki(); else onceki();
      }
    },
    onPointerCancel: () => { x0 = null; },
  };
}

function Kutu({
  ogeler, indeks, kapat, git,
}: {
  ogeler: SlaytOge[];
  indeks: number;
  kapat: (son: number) => void;
  git: (i: number) => void;
}) {
  const n = ogeler.length;
  const o = ogeler[indeks];
  const kapatDugme = useRef<HTMLButtonElement>(null);
  const kutuRef = useRef<HTMLDivElement>(null);
  const kaydirildi = useRef(false);

  const sonraki = useCallback(() => git((indeks + 1) % n), [git, indeks, n]);
  const onceki = useCallback(() => git((indeks - 1 + n) % n), [git, indeks, n]);

  // Açılışta odağı kapat düğmesine al, kapanınca eski yere ver; arka plan kaymasın.
  useEffect(() => {
    const eskiOdak = document.activeElement as HTMLElement | null;
    const eskiTasma = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    kapatDugme.current?.focus();
    return () => {
      document.body.style.overflow = eskiTasma;
      eskiOdak?.focus?.();
    };
  }, []);

  // Komşu fotoğrafları önceden yükle: ok tuşuna basınca boş ekran görünmesin.
  useEffect(() => {
    for (const d of [1, -1]) {
      const k = ogeler[(indeks + d + n) % n];
      if (k && k.tur === "foto") { const im = new Image(); im.src = tam(k); }
    }
  }, [indeks, n, ogeler]);

  useEffect(() => {
    const tus = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); kapat(indeks); }
      else if (e.key === "ArrowRight") { e.preventDefault(); sonraki(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); onceki(); }
      else if (e.key === "Tab") {
        // Odak pencerenin dışına kaçmasın.
        const el = kutuRef.current?.querySelectorAll<HTMLElement>("button, a[href]");
        if (!el || !el.length) return;
        const ilk = el[0], son = el[el.length - 1];
        if (e.shiftKey && document.activeElement === ilk) { e.preventDefault(); son.focus(); }
        else if (!e.shiftKey && document.activeElement === son) { e.preventDefault(); ilk.focus(); }
      }
    };
    window.addEventListener("keydown", tus);
    return () => window.removeEventListener("keydown", tus);
  }, [indeks, kapat, sonraki, onceki]);

  const jest = kaydirma(sonraki, onceki, kaydirildi);

  return (
    <div
      className="sn-kutu"
      role="dialog"
      aria-modal="true"
      aria-label="Anı görüntüleyici"
      ref={kutuRef}
      onClick={(e) => { if (e.target === e.currentTarget && !kaydirildi.current) kapat(indeks); }}
    >
      <div className="sn-kutu-ust">
        <span className="sn-kutu-sayac">{indeks + 1} / {n}</span>
        <a className="btn sn-kutu-indir" href={indirUrl(o)} download>İndir</a>
        <button ref={kapatDugme} type="button" className="sn-kutu-kapat" onClick={() => kapat(indeks)} aria-label="Kapat">
          ✕
        </button>
      </div>

      <div className="sn-kutu-sahne" {...jest}>
        {n > 1 && (
          <button type="button" className="sn-ok sn-ok-sol" onClick={onceki} aria-label="Önceki anı">‹</button>
        )}
        {o.tur === "video" ? (
          <video
            key={o.id}
            className="sn-kutu-medya"
            src={tam(o)}
            poster={`/api/an/${o.id}?kapak=1`}
            controls
            autoPlay
            playsInline
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={o.id} className="sn-kutu-medya" src={tam(o)} alt={o.yukleyen ? `Gönderen: ${o.yukleyen}` : "Anı"} draggable={false} />
        )}
        {n > 1 && (
          <button type="button" className="sn-ok sn-ok-sag" onClick={sonraki} aria-label="Sonraki anı">›</button>
        )}
      </div>

      {o.yukleyen && <p className="sn-kutu-alt">Gönderen: <strong>{o.yukleyen}</strong></p>}
    </div>
  );
}

/**
 * Anılar: üst üste dizilen kartlardan oluşan slayt + altında yan yana mozaik.
 *
 * - Slayt kendiliğinden ilerler (5 sn); fareyle üstüne gelince, odaktayken,
 *   sekme gizliyken, büyütme açıkken ya da kullanıcı durdurduğunda DURUR.
 *   Hareketi azalt tercihi açıksa hiç kendiliğinden oynamaz (WCAG 2.2.2).
 * - Yatay kaydırma, ok tuşları ve ‹ › düğmeleriyle gezilir.
 * - Karta/fayansa basınca tam boy büyütme açılır; video orada oynar.
 */
export default function AnilarSlayt({ ogeler }: { ogeler: SlaytOge[] }) {
  const n = ogeler.length;
  const [aktif, setAktif] = useState(0);
  const [oynat, setOynat] = useState(true);
  const [azHareket, setAzHareket] = useState(false);
  const [beklet, setBeklet] = useState(false);
  const [gorunur, setGorunur] = useState(true);
  const [acik, setAcik] = useState<number | null>(null);
  const [kac, setKac] = useState(SAYFA);
  const kaydirildi = useRef(false);

  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    const f = () => setAzHareket(m.matches);
    f();
    m.addEventListener("change", f);
    return () => m.removeEventListener("change", f);
  }, []);

  useEffect(() => {
    const f = () => setGorunur(!document.hidden);
    document.addEventListener("visibilitychange", f);
    return () => document.removeEventListener("visibilitychange", f);
  }, []);

  const git = useCallback((i: number) => setAktif(((i % n) + n) % n), [n]);
  const sonraki = useCallback(() => setAktif((a) => (a + 1) % n), [n]);
  const onceki = useCallback(() => setAktif((a) => (a - 1 + n) % n), [n]);

  const otomatik = oynat && !azHareket && !beklet && gorunur && acik === null && n > 1;
  useEffect(() => {
    if (!otomatik) return;
    const t = setTimeout(sonraki, OTO_MS);
    return () => clearTimeout(t);
  }, [otomatik, aktif, sonraki]);

  if (n === 0) return null;

  // Yalnızca görünür kartlar DOM'da: 150 fotoğraflı bir galeride 150 <img> olmaz.
  const pencere: { d: number | "x"; i: number }[] = [0, 1, 2].filter((d) => d < n).map((d) => ({ d, i: (aktif + d) % n }));
  if (n > 3) pencere.push({ d: "x", i: (aktif - 1 + n) % n });

  const jest = kaydirma(sonraki, onceki, kaydirildi);
  const calisiyor = oynat && !azHareket;

  const tusla = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") { e.preventDefault(); sonraki(); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); onceki(); }
  };

  return (
    <div className="sn-anilar-ic">
      <div
        className="sn-sahne"
        role="region"
        aria-roledescription="slayt"
        aria-label="Anılarımız"
        tabIndex={0}
        onKeyDown={tusla}
        onMouseEnter={() => setBeklet(true)}
        onMouseLeave={() => setBeklet(false)}
        onFocus={() => setBeklet(true)}
        onBlur={() => setBeklet(false)}
      >
        <div className="sn-deste" {...jest}>
          {pencere.map(({ d, i }) => {
            const o = ogeler[i];
            const on = d === 0;
            return (
              <div
                key={o.id}
                className="sn-kart"
                data-d={d}
                aria-hidden={!on}
                role={on ? "button" : undefined}
                tabIndex={on ? 0 : -1}
                aria-label={on ? `${i + 1}. anıyı büyüt` : undefined}
                onClick={on ? () => { if (!kaydirildi.current) setAcik(i); } : undefined}
                onKeyDown={on ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setAcik(i); } } : undefined}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={kucuk(o, 960)}
                  alt={on ? (o.yukleyen ? `Anı ${i + 1}, gönderen ${o.yukleyen}` : `Anı ${i + 1}`) : ""}
                  draggable={false}
                  decoding="async"
                  loading={on ? "eager" : "lazy"}
                />
                {o.tur === "video" && <span className="sn-oynat" aria-hidden="true">▶</span>}
                {on && o.yukleyen && <span className="sn-alt">Gönderen: {o.yukleyen}</span>}
              </div>
            );
          })}
        </div>

        {n > 1 && (
          <>
            <span className="sn-ilerleme-yol" aria-hidden="true">
              <span
                key={aktif}
                className="sn-ilerleme"
                style={{ animationDuration: `${OTO_MS}ms`, animationPlayState: otomatik ? "running" : "paused" }}
                data-aktif={calisiyor ? "1" : "0"}
              />
            </span>
            <div className="sn-kontrol">
              <button type="button" onClick={onceki} aria-label="Önceki anı">‹</button>
              <button
                type="button"
                onClick={() => setOynat((o) => !o)}
                aria-pressed={calisiyor}
                aria-label={calisiyor ? "Slaytı durdur" : "Slaytı oynat"}
                className="sn-oyna"
              >
                {calisiyor ? "❚❚" : "▶"}
              </button>
              <span className="sn-sayac" aria-live={calisiyor ? "off" : "polite"}>{aktif + 1} / {n}</span>
              <button type="button" onClick={sonraki} aria-label="Sonraki anı">›</button>
            </div>
          </>
        )}
      </div>

      <h3 className="sn-alt-baslik">Tüm anılar</h3>
      <ul className="sn-mozaik">
        {ogeler.slice(0, kac).map((o, i) => (
          <li key={o.id}>
            <button
              type="button"
              className="sn-fayans"
              onClick={() => setAcik(i)}
              aria-label={`${o.tur === "video" ? "Videoyu" : "Fotoğrafı"} büyüt (${i + 1}/${n})`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={kucuk(o, 480)}
                alt=""
                loading="lazy"
                decoding="async"
                width={o.g ?? 3}
                height={o.y ?? 4}
              />
              {o.tur === "video" && <span className="sn-oynat" aria-hidden="true">▶</span>}
            </button>
          </li>
        ))}
      </ul>
      {kac < n && (
        <div className="sn-devam">
          <button type="button" className="btn" onClick={() => setKac((k) => k + SAYFA)}>
            Daha fazla göster ({n - kac})
          </button>
        </div>
      )}

      {acik !== null && (
        <Kutu
          ogeler={ogeler}
          indeks={acik}
          git={setAcik}
          kapat={(son) => { setAktif(son); setAcik(null); }}
        />
      )}
    </div>
  );
}
