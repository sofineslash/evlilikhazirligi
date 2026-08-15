"use client";

import { useEffect, useRef, useState } from "react";

type Durum = "bekliyor" | "gonderiliyor" | "tamam" | "hata";
type Kalem = {
  anahtar: string;
  dosya: File;
  onizleme: string;
  video: boolean;
  /** Tarayici bu dosyayi cizemiyor (HEIC gibi) — yer tutucu gosterilir. */
  onizlemeYok: boolean;
  durum: Durum;
  yuzde: number;
  mesaj?: string;
  kazanc?: number;
};

/* Ham dosya tavanlari — sunucudakiyle AYNI olmali, yoksa 413 alip
   sasiriyoruz. Video icin ayri: 1 dakikalik 4K kayit rahat 300 MB. */
const FOTO_MAX_BAYT = 25 * 1024 * 1024;
const VIDEO_MAX_BAYT = 600 * 1024 * 1024;
/** Parca boyu — sunucudaki PARCA_MAX ile AYNI. */
const PARCA_BAYT = 8 * 1024 * 1024;
/** Bunun ustundeki dosyalar parcalanarak gonderilir. */
const TEK_ISTEK_SINIRI = 8 * 1024 * 1024;

const videoMu = (d: File) => d.type.startsWith("video/");
const boyut = (b: number) =>
  b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`;

type Cevap = { ok: boolean; kod: number; veri: Record<string, unknown> };

/* crypto.randomUUID() yalnizca GUVENLI BAGLAMDA (https / localhost) var.
   Yerel agdan http ile bakildiginda tanimsiz oluyor ve butun yukleme
   patliyordu; sunucu zaten uuid bicimi bekliyor, elle uretiyoruz. */
function kimlikUret(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/**
 * XHR ile tek istek.
 *
 * fetch() YUKLEME ilerlemesi vermiyor — bu yuzden kullaniciya
 * "Gönderiliyor…" disinda bir sey gosterilemiyordu. XMLHttpRequest'in
 * upload.onprogress olayi gonderilen bayti bildiriyor.
 */
function istek(
  url: string,
  govde: Blob,
  basliklar: Record<string, string>,
  ilerleme?: (bayt: number) => void,
): Promise<Cevap> {
  return new Promise((coz, red) => {
    const x = new XMLHttpRequest();
    x.open("POST", url);
    for (const [k, v] of Object.entries(basliklar)) x.setRequestHeader(k, v);
    if (ilerleme) x.upload.onprogress = (e) => ilerleme(e.loaded);
    x.onload = () => {
      let veri: Record<string, unknown> = {};
      try { veri = JSON.parse(x.responseText); } catch { /* JSON degilse bos gec */ }
      coz({ ok: x.status >= 200 && x.status < 300, kod: x.status, veri });
    };
    x.onerror = () => red(new Error("ag hatasi"));
    x.ontimeout = () => red(new Error("zaman asimi"));
    x.send(govde);
  });
}

/**
 * Misafir fotograf/video yukleme.
 *
 * TEK TEK gonderiyor, hepsini birden degil: salon sebekesinde 20 dosyayi
 * paralel gondermek hepsinin birden zaman asimina ugramasi demek.
 *
 * BUYUK DOSYALAR PARCALI gidiyor. 409 MB'lik bir video tek istekte
 * gonderilince mobil baglantida kopuyor ve BASTAN basliyordu; parcalara
 * bolununce kopan yalnizca o parca oluyor ve tekrar deneniyor, gonderilmis
 * kisim korunuyor.
 *
 * Onizleme yerel dosyadan (createObjectURL) — sunucuya sormaya gerek yok.
 * URL'ler temizlikte serbest birakiliyor, yoksa bellek sizar.
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
        onizlemeYok: false,
        yuzde: 0,
        durum: d.size > tavan ? "hata" : "bekliyor",
        mesaj: d.size > tavan
          ? `Çok büyük (${boyut(d.size)}). En fazla ${vid ? "600 MB" : "25 MB"}.`
          : undefined,
      });
    }
    setKalemler((k) => [...k, ...yeni]);
    if (girdiRef.current) girdiRef.current.value = "";   // ayni dosya tekrar secilebilsin
  };

  const guncelle = (anahtar: string, y: Partial<Kalem>) =>
    setKalemler((k) => k.map((x) => (x.anahtar === anahtar ? { ...x, ...y } : x)));

  /* Ilerleme olayi saniyede onlarca kez tetikleniyor. Her seferinde state
     yazmak butun listeyi yeniden ciziyor ve telefonu yavaslatiyordu;
     yalnizca TAM YUZDE degisince yaziliyor. */
  const yuzdeYaz = (anahtar: string, son: { v: number }, yeni: number) => {
    if (yeni === son.v) return;
    son.v = yeni;
    guncelle(anahtar, { yuzde: yeni });
  };

  /** Buyuk dosyayi parcalara bolup sirayla gonderir. */
  const parcaliGonder = async (k: Kalem, kimlik: string): Promise<string | null> => {
    const yuklemeId = kimlikUret();
    const toplam = Math.ceil(k.dosya.size / PARCA_BAYT);
    const son = { v: 0 };
    let gonderilen = 0;

    for (let i = 0; i < toplam; i++) {
      const bas = i * PARCA_BAYT;
      const parca = k.dosya.slice(bas, Math.min(bas + PARCA_BAYT, k.dosya.size));
      const sonMu = i === toplam - 1;

      /* Her parca 3 kez denenir, aralar acilarak. Mobil baglantida tek bir
         parcanin kopmasi butun yuklemeyi bosa cikarmasin. */
      let cevap: Cevap | null = null;
      for (let deneme = 0; deneme < 3; deneme++) {
        try {
          cevap = await istek("/api/an/parca", parca, {
            "x-yukleme-id": yuklemeId,
            "x-parca-no": String(i),
            "x-parca-toplam": String(toplam),
            ...(sonMu ? { "x-yukleyen": kimlik } : {}),
          }, (bayt) => yuzdeYaz(k.anahtar, son,
            Math.min(99, Math.round(((gonderilen + bayt) / k.dosya.size) * 100))));
          if (cevap.ok) break;
          // 4xx kalici bir red — tekrar denemenin anlami yok
          if (cevap.kod >= 400 && cevap.kod < 500) break;
        } catch {
          cevap = null;
          await new Promise((r) => setTimeout(r, 800 * (deneme + 1)));
        }
      }

      if (!cevap || !cevap.ok) {
        return String(cevap?.veri?.mesaj ?? "Bağlantı kesildi. Tekrar deneyin.");
      }
      gonderilen += parca.size;

      if (sonMu) {
        guncelle(k.anahtar, {
          durum: "tamam", yuzde: 100, kazanc: Number(cevap.veri.kazanc) || undefined,
        });
      }
    }
    return null;
  };

  const gonder = async () => {
    setCalisiyor(true);
    const kimlik = encodeURIComponent(ad.trim());

    for (const k of kalemler) {
      if (k.durum !== "bekliyor") continue;
      guncelle(k.anahtar, { durum: "gonderiliyor", mesaj: undefined, yuzde: 0 });
      const son = { v: 0 };

      try {
        if (k.dosya.size <= TEK_ISTEK_SINIRI) {
          const y = await istek("/api/an", k.dosya, {
            // Basliklar latin-1; Turkce harfler icin kodlaniyor.
            "x-yukleyen": kimlik,
            "content-type": k.dosya.type || "application/octet-stream",
          }, (bayt) => yuzdeYaz(k.anahtar, son,
            Math.min(99, Math.round((bayt / k.dosya.size) * 100))));
          if (y.ok && y.veri.ok) {
            guncelle(k.anahtar, {
              durum: "tamam", yuzde: 100, kazanc: Number(y.veri.kazanc) || undefined,
            });
          } else {
            guncelle(k.anahtar, { durum: "hata", mesaj: String(y.veri.mesaj ?? "Gönderilemedi.") });
          }
        } else {
          const hata = await parcaliGonder(k, kimlik);
          if (hata) guncelle(k.anahtar, { durum: "hata", mesaj: hata });
        }
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
                {/* HEIC'i tarayici cizemiyor (Chrome/Android desteklemiyor,
                    onError tetikleniyor). Kirik resim simgesi yerine
                    duzgun bir yer tutucu — dosya yine de yuklenebiliyor,
                    sunucu HEIF'i cozuyor. */}
                {k.onizlemeYok ? (
                  <span className="an-yertutucu" aria-hidden="true">
                    {k.video ? "▶" : "HEIC"}
                  </span>
                ) : k.video ? (
                  /* #t=0.1 SART: preload="metadata" tek basina bos bir kare
                     birakiyor. Ortam parcasi verilince tarayici o ana atlayip
                     kareyi ciziyor — kucuk kutuda gercek onizleme cikiyor. */
                  <video
                    src={`${k.onizleme}#t=0.1`} muted playsInline preload="metadata"
                    onError={() => guncelle(k.anahtar, { onizlemeYok: true })}
                  />
                ) : (
                  <img
                    src={k.onizleme} alt=""
                    onError={() => guncelle(k.anahtar, { onizlemeYok: true })}
                  />
                )}

                <div className="an-bilgi">
                  <span className="an-durum">
                    {k.durum === "bekliyor" && "Hazır"}
                    {k.durum === "gonderiliyor" && `Gönderiliyor… %${k.yuzde}`}
                    {k.durum === "tamam" && `Yüklendi${k.kazanc ? ` · %${k.kazanc} küçültüldü` : ""}`}
                    {k.durum === "hata" && (k.mesaj ?? "Hata")}
                  </span>
                  <span className="kucuk">{boyut(k.dosya.size)}</span>

                  {k.durum === "gonderiliyor" && (
                    <span
                      className="an-bar"
                      role="progressbar"
                      aria-valuenow={k.yuzde}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <span className="an-bar-dolu" style={{ width: `${k.yuzde}%` }} />
                    </span>
                  )}
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
