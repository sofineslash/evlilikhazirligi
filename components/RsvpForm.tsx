"use client";

import { useState } from "react";
import { CFG } from "@/lib/config";

type Sonuc =
  | { tur: "bos" }
  | { tur: "gonderiliyor" }
  | { tur: "hata"; mesaj: string }
  | { tur: "basari" }
  | { tur: "zaten"; ad: string; geliyor: boolean; kisi: number };

export default function RsvpForm() {
  const [geliyor, setGeliyor] = useState<boolean | null>(null);
  const [kisi, setKisi] = useState(1);
  const [ad, setAd] = useState("");
  const [dilek, setDilek] = useState("");
  const [sonuc, setSonuc] = useState<Sonuc>({ tur: "bos" });

  const kilitli = sonuc.tur === "gonderiliyor";

  async function gonder(zorla = false) {
    if (geliyor === null) {
      setSonuc({ tur: "hata", mesaj: "Lütfen geliyorum ya da gelemiyorum seçin." });
      return;
    }
    setSonuc({ tur: "gonderiliyor" });
    try {
      const r = await fetch("/api/katilim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ad, geliyor, kisi: geliyor ? kisi : 0, dilek, zorla }),
      });
      const j = await r.json();
      if (r.ok) setSonuc({ tur: "basari" });
      else if (r.status === 409) setSonuc({ tur: "zaten", ...j.kayit });
      else setSonuc({ tur: "hata", mesaj: j.mesaj ?? "Bir şeyler ters gitti." });
    } catch {
      setSonuc({ tur: "hata", mesaj: "Bağlantı kurulamadı. Tekrar deneyin." });
    }
  }

  if (sonuc.tur === "basari")
    return (
      <p>
        <strong>Kaydınız bize ulaştı.</strong> Salon girişinde isim sormayacağız.
      </p>
    );

  if (sonuc.tur === "zaten")
    return (
      <div>
        <p>
          <strong>Zaten kayıtlısınız, teşekkür ederiz.</strong> Sizleri 29 Ekim 2026 günü
          nişanımızda görmekten mutluluk duyacağız.
        </p>
        <p className="kucuk">
          Kayıtlı bilgi: {sonuc.ad} — {sonuc.geliyor ? `${sonuc.kisi} kişi geliyor` : "gelemiyor"}
        </p>
        <div className="butonlar" style={{ justifyContent: "flex-start" }}>
          <button className="btn" onClick={() => gonder(true)}>
            Farklı bir kişiyim, yine de kaydol
          </button>
        </div>
      </div>
    );

  return (
    <div>
      <label>Geliyor musunuz?</label>
      <div className="cipler">
        <button
          type="button" className="cip" aria-pressed={geliyor === true}
          onClick={() => setGeliyor(true)}
        >
          Geliyorum
        </button>
        <button
          type="button" className="cip" aria-pressed={geliyor === false}
          onClick={() => setGeliyor(false)}
        >
          Gelemiyorum
        </button>
      </div>

      {geliyor === true && (
        <>
          <label htmlFor="kisi">Kaç kişi geleceksiniz? (kendiniz dahil)</label>
          <div className="sayac">
            <button type="button" className="btn" onClick={() => setKisi((k) => Math.max(1, k - 1))}>
              −
            </button>
            <output id="kisi">{kisi}</output>
            <button
              type="button" className="btn"
              onClick={() => setKisi((k) => Math.min(CFG.KISI_MAX, k + 1))}
            >
              +
            </button>
          </div>
        </>
      )}

      <label htmlFor="ad">Ad soyad</label>
      <input
        id="ad" type="text" value={ad} maxLength={CFG.AD_MAX_KARAKTER}
        onChange={(e) => setAd(e.target.value)} autoComplete="name"
      />

      <label htmlFor="dilek">Bize bir not bırakın (isteğe bağlı)</label>
      <textarea
        id="dilek" rows={3} value={dilek} maxLength={CFG.DILEK_MAX_KARAKTER}
        onChange={(e) => setDilek(e.target.value)}
      />

      {sonuc.tur === "hata" && <p className="hata">{sonuc.mesaj}</p>}

      <div className="butonlar" style={{ justifyContent: "flex-start", marginTop: "1rem" }}>
        <button className="btn btn-birincil" disabled={kilitli} onClick={() => gonder()}>
          {kilitli ? "Gönderiliyor…" : "Gönder"}
        </button>
      </div>

      <p className="kucuk" style={{ marginTop: "1rem" }}>
        Bu bilgiyi yalnızca biz görüyoruz, salona kaç kişi geleceğini bilmek için
        kullanıyoruz ve nişandan sonra siliyoruz.
      </p>
    </div>
  );
}
