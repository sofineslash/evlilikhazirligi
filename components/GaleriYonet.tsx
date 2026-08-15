"use client";

import { useState, useTransition } from "react";
import FotoOnizle from "./FotoOnizle";
import { anlariSil } from "@/lib/admin";

export type AnOzet = {
  id: string;
  yukleyen: string | null;
  bayt: number;
  olusturuldu: string;
  tur: "foto" | "video";
  sure: number | null;
};

const sureMetni = (sn: number) =>
  `${Math.floor(sn / 60)}:${String(Math.round(sn % 60)).padStart(2, "0")}`;

const boyut = (b: number) =>
  b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`;

const tarih = (s: string) =>
  new Intl.DateTimeFormat("tr-TR", { dateStyle: "short", timeStyle: "short" }).format(new Date(s));

/**
 * Yonetim galerisi: onizleme, secim, toplu indirme.
 *
 * Indirme bir <a href> DEGIL fetch + Blob: zip ucu POST istiyor (id
 * listesi URL'e sigmaz ve uzun URL'ler vekillerde kirpilir). Blob'u
 * gecici bir baglantiyla indirtip URL'i hemen serbest birakiyoruz.
 */
export default function GaleriYonet({ anlar }: { anlar: AnOzet[] }) {
  const [secili, setSecili] = useState<Set<string>>(new Set());
  const [calisiyor, setCalisiyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [onizleme, setOnizleme] = useState<number | null>(null);
  const [siliniyor, basla] = useTransition();
  const [onay, setOnay] = useState(false);

  /* Silme GERI ALINAMAZ: dosya diskten, satir veritabanindan gidiyor.
     Tek tikla silinmesin — once "Emin misin" adimi. */
  const sil = () => {
    const idler = [...secili];
    basla(async () => {
      await anlariSil(idler);
      setSecili(new Set());
      setOnay(false);
    });
  };

  const degistir = (id: string) =>
    setSecili((s) => {
      const y = new Set(s);
      y.has(id) ? y.delete(id) : y.add(id);
      return y;
    });

  const tumunuSec = () =>
    setSecili((s) => (s.size === anlar.length ? new Set() : new Set(anlar.map((a) => a.id))));

  const indir = async (govde: { idler?: string[]; tumu?: boolean }) => {
    setCalisiyor(true);
    setHata(null);
    try {
      const y = await fetch("/api/an/zip", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(govde),
      });
      if (!y.ok) {
        const c = await y.json().catch(() => ({}));
        setHata(c.mesaj ?? "İndirilemedi.");
        return;
      }
      const blob = await y.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        y.headers.get("content-disposition")?.match(/filename="([^"]+)"/)?.[1] ??
        "nisan-fotograflar.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();
      // Hemen revoke etme — bazi tarayicilar indirmeye baslamadan iptal ediyor.
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
    } catch {
      setHata("Bağlantı hatası. Tekrar deneyin.");
    } finally {
      setCalisiyor(false);
    }
  };

  if (anlar.length === 0) {
    return <p className="kucuk">Henüz fotoğraf yüklenmedi.</p>;
  }

  return (
    <div className="galeri-yonet">
      <div className="butonlar" style={{ justifyContent: "flex-start" }}>
        <button type="button" className="btn" onClick={tumunuSec}>
          {secili.size === anlar.length ? "Seçimi kaldır" : "Tümünü seç"}
        </button>
        <button
          type="button"
          className="btn"
          disabled={calisiyor || secili.size === 0}
          onClick={() => indir({ idler: [...secili] })}
        >
          Seçilenleri indir ({secili.size})
        </button>
        <button
          type="button"
          className="btn btn-birincil"
          disabled={calisiyor}
          onClick={() => indir({ tumu: true })}
        >
          {calisiyor ? "Hazırlanıyor…" : `Tümünü indir (${anlar.length})`}
        </button>

        {secili.size > 0 && (
          onay ? (
            <>
              <button
                type="button" className="btn btn-tehlike"
                disabled={siliniyor} onClick={sil}
              >
                {siliniyor ? "Siliniyor…" : `Evet, ${secili.size} tanesini sil`}
              </button>
              <button type="button" className="btn" onClick={() => setOnay(false)}>
                Vazgeç
              </button>
            </>
          ) : (
            <button type="button" className="btn btn-tehlike-ana" onClick={() => setOnay(true)}>
              Seçilenleri sil ({secili.size})
            </button>
          )
        )}
      </div>
      {onay && (
        <p className="hata kucuk">
          {secili.size} dosya kalıcı olarak silinecek. Geri alınamaz.
        </p>
      )}
      {hata && <p className="hata">{hata}</p>}

      <ul className="galeri-izgara">
        {anlar.map((a, i) => (
          <li key={a.id} className={secili.has(a.id) ? "secili" : ""}>
            <div className="galeri-kutu">
              {/* Onay kutusu gorselin ICINDE degil KARDESI: label icindeyken
                  gorsele tiklamak secimi degistiriyordu ve onizleme
                  acilamiyordu. Ikisi ayri hedef. */}
              <input
                type="checkbox"
                checked={secili.has(a.id)}
                onChange={() => degistir(a.id)}
                aria-label={`Seç: ${a.yukleyen ?? "İsimsiz"} — ${tarih(a.olusturuldu)}`}
              />
              <button type="button" className="galeri-ac" onClick={() => setOnizleme(i)}>
                <img
                  src={a.tur === "video" ? `/api/an/${a.id}?kapak=1` : `/api/an/${a.id}`}
                  alt="" loading="lazy"
                />
                {a.tur === "video" && (
                  <span className="an-video-isaret" aria-hidden="true">
                    ▶{a.sure ? ` ${sureMetni(a.sure)}` : ""}
                  </span>
                )}
              </button>
            </div>
            <div className="galeri-alt">
              <span className="kucuk">{a.yukleyen ?? "İsimsiz"}</span>
              <span className="kucuk">{boyut(a.bayt)}</span>
              <a className="kucuk" href={`/api/an/${a.id}?indir=1`} download>
                İndir
              </a>
            </div>
          </li>
        ))}
      </ul>

      <FotoOnizle
        ogeler={anlar.map((a) => ({ id: a.id, yukleyen: a.yukleyen, tur: a.tur, sure: a.sure }))}
        indeks={onizleme}
        setIndeks={setOnizleme}
      />
    </div>
  );
}
