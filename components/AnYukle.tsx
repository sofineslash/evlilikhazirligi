"use client";

import { useEffect, useRef, useState } from "react";

type Durum = "bekliyor" | "gonderiliyor" | "tamam" | "hata";
type Kalem = {
  anahtar: string;
  dosya: File;
  onizleme: string;
  video: boolean;
  durum: Durum;
  mesaj?: string;
  kazanc?: number;
};

/* Ham dosya tavanlari — sunucudakiyle AYNI olmali, yoksa 413 alip
   sasiriyoruz. Video icin ayri: 1 dakikalik 4K kayit rahat 300 MB. */
const FOTO_MAX_BAYT = 25 * 1024 * 1024;
const VIDEO_MAX_BAYT = 400 * 1024 * 1024;
const videoMu = (d: File) => d.type.startsWith("video/");

const boyut = (b: number) =>
  b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`;

/**
 * Misafir fotograf yukleme.
 *
 * TEK TEK gonderiyor, hepsini birden degil: salon wifi'sinde 20 fotografi
 * paralel gondermek hepsinin birden zaman asimina ugramasi demek. Sirayla
 * gidince biri basarisiz olsa digerleri etkilenmiyor ve kullanici hangisinin
 * yuklendigini goruyor.
 *
 * Onizleme yerel dosyadan (createObjectURL) — sunucuya sormaya gerek yok,
 * aninda gorunuyor. URL'ler temizlikte serbest birakiliyor, yoksa bellek sizar.
 */
export default function AnYukle() {
  const [kalemler, setKalemler] = useState<Kalem[]>([]);
  const [ad, setAd] = useState("");
  const [calisiyor, setCalisiyor] = useState(false);
  const girdiRef = useRef<HTMLInputElement>(null);
  const urlRef = useRef<string[]>([]);

  useEffect(() => {
    const url = urlRef;
    return () => { url.current.forEach((u) => URL.revokeObjectURL(u)); };
  }, []);

  const ekle = (dosyalar: FileList | null) => {
    if (!dosyalar?.length) return;
    const yeni: Kalem[] = [];
    for (const d of Array.from(dosyalar)) {
      const onizleme = URL.createObjectURL(d);
      urlRef.current.push(onizleme);
      const vid = videoMu(d);
      const tavan = vid ? VIDEO_MAX_BAYT : FOTO_MAX_BAYT;
      yeni.push({
        anahtar: `${d.name}-${d.size}-${d.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
        dosya: d,
        onizleme,
        video: vid,
        durum: d.size > tavan ? "hata" : "bekliyor",
        mesaj: d.size > tavan
          ? `Çok büyük (${boyut(d.size)}). En fazla ${vid ? "400 MB" : "25 MB"}.`
          : undefined,
      });
    }
    setKalemler((k) => [...k, ...yeni]);
    if (girdiRef.current) girdiRef.current.value = "";   // ayni dosya tekrar secilebilsin
  };

  const guncelle = (anahtar: string, y: Partial<Kalem>) =>
    setKalemler((k) => k.map((x) => (x.anahtar === anahtar ? { ...x, ...y } : x)));

  const gonder = async () => {
    setCalisiyor(true);
    for (const k of kalemler) {
      if (k.durum !== "bekliyor") continue;
      guncelle(k.anahtar, { durum: "gonderiliyor", mesaj: undefined });
      try {
        const y = await fetch("/api/an", {
          method: "POST",
          body: k.dosya,
          headers: {
            // Basliklar latin-1; Turkce harfler icin kodlaniyor.
            "x-yukleyen": encodeURIComponent(ad.trim()),
            "content-type": k.dosya.type || "application/octet-stream",
          },
        });
        const c = await y.json().catch(() => ({}));
        if (y.ok && c.ok) guncelle(k.anahtar, { durum: "tamam", kazanc: c.kazanc });
        else guncelle(k.anahtar, { durum: "hata", mesaj: c.mesaj ?? "Gönderilemedi." });
      } catch {
        guncelle(k.anahtar, { durum: "hata", mesaj: "Bağlantı kesildi. Tekrar deneyin." });
      }
    }
    setCalisiyor(false);
  };

  const bekleyen = kalemler.filter((k) => k.durum === "bekliyor").length;
  const tamam = kalemler.filter((k) => k.durum === "tamam").length;

  return (
    <div className="an-yukle">
      <label htmlFor="an-ad">İsim soyisim (isteğe bağlı)</label>
      <input
        id="an-ad" type="text" value={ad} maxLength={60}
        onChange={(e) => setAd(e.target.value)}
      />

      <label htmlFor="an-dosya" className="an-sec">
        <input
          ref={girdiRef}
          id="an-dosya"
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={(e) => ekle(e.target.files)}
        />
        <span className="btn btn-birincil">Fotoğraf veya video seç</span>
      </label>

      {kalemler.length > 0 && (
        <>
          <ul className="an-liste">
            {kalemler.map((k) => (
              <li key={k.anahtar} className={`an-kalem an-${k.durum}`}>
                {/* Video onizlemesi de yerel dosyadan: <video> ilk kareyi
                    kendisi cizer, sunucuya sormaya gerek yok. */}
                {k.video
                  ? <video src={k.onizleme} muted playsInline preload="metadata" />
                  : <img src={k.onizleme} alt="" />}
                <div className="an-bilgi">
                  <span className="an-durum">
                    {k.durum === "bekliyor" && "Hazır"}
                    {k.durum === "gonderiliyor" && "Gönderiliyor…"}
                    {k.durum === "tamam" && `Yüklendi${k.kazanc ? ` · %${k.kazanc} küçültüldü` : ""}`}
                    {k.durum === "hata" && (k.mesaj ?? "Hata")}
                  </span>
                  <span className="kucuk">{boyut(k.dosya.size)}</span>
                </div>
              </li>
            ))}
          </ul>

          <div className="butonlar" style={{ justifyContent: "flex-start" }}>
            <button
              type="button"
              className="btn btn-birincil"
              onClick={gonder}
              disabled={calisiyor || bekleyen === 0}
            >
              {calisiyor ? "Gönderiliyor…" : `Gönder (${bekleyen})`}
            </button>
          </div>

          {/* Ekran okuyucu icin: durum degisimi sessizce gecmesin */}
          <p className="kucuk" role="status" aria-live="polite">
            {tamam > 0 && `${tamam} dosya yüklendi. Teşekkür ederiz!`}
          </p>
        </>
      )}
    </div>
  );
}
