"use client";

import { useState } from "react";
import { CFG } from "@/lib/config";

type KatilimDurumu = "katilacagim" | "net_degil" | "katilmayacagim";

type Sonuc =
  | { tur: "bos" }
  | { tur: "gonderiliyor" }
  | { tur: "hata"; mesaj: string }
  | { tur: "basari"; durum: KatilimDurumu }
  | { tur: "zaten"; ad: string; durum?: string; geliyor: boolean; kisi: number };

export default function RsvpForm({
  onKapat,
  varsayilanAd = "",
  token,
  izinliKisi = 10,
}: {
  onKapat?: () => void;
  varsayilanAd?: string;
  token?: string;
  izinliKisi?: number;
}) {
  const [durum, setDurum] = useState<KatilimDurumu | null>(null);
  const [kisi, setKisi] = useState<number>(0);
  const [ad, setAd] = useState(varsayilanAd);
  const [dilek, setDilek] = useState("");
  const [sonuc, setSonuc] = useState<Sonuc>({ tur: "bos" });

  const tavanKisi = Math.min(CFG.KISI_MAX, Math.max(1, izinliKisi || CFG.KISI_MAX));
  const kilitli = sonuc.tur === "gonderiliyor";

  const handleDurumSecim = (secim: KatilimDurumu) => {
    setDurum(secim);
    if (secim === "katilacagim") {
      setKisi((prev) => (prev > 0 ? prev : 1));
    } else if (secim === "katilmayacagim") {
      setKisi(0);
    } else if (secim === "net_degil") {
      setKisi((prev) => (prev > 0 ? prev : 1));
    }
  };

  async function gonder(zorla = false) {
    if (!durum) {
      setSonuc({ tur: "hata", mesaj: "Lütfen katılım durumunuzu seçin." });
      return;
    }
    if (!ad.trim()) {
      setSonuc({ tur: "hata", mesaj: "Lütfen adınızı ve soyadınızı yazın." });
      return;
    }

    setSonuc({ tur: "gonderiliyor" });
    try {
      const r = await fetch("/api/katilim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ad,
          durum,
          geliyor: durum === "katilacagim" ? 1 : durum === "net_degil" ? 2 : 0,
          kisi: durum === "katilmayacagim" ? 0 : kisi,
          dilek,
          hatiraNotu: dilek,
          token,
          zorla,
        }),
      });
      const j = await r.json();
      if (r.ok) setSonuc({ tur: "basari", durum });
      else if (r.status === 409) setSonuc({ tur: "zaten", ...j.kayit });
      else setSonuc({ tur: "hata", mesaj: j.mesaj ?? "Bir şeyler ters gitti." });
    } catch {
      setSonuc({ tur: "hata", mesaj: "Bağlantı kurulamadı. Lütfen tekrar deneyin." });
    }
  }

  if (sonuc.tur === "basari") {
    return (
      <div className="katilim-basari-kapsul">
        <div className="katilim-basari-simge">✓</div>
        <h3 className="katilim-basari-baslik">Cevabınız İletildi!</h3>
        <p className="katilim-basari-metin">
          {durum === "katilacagim"
            ? "Katılımınız bizi çok mutlu etti. 29 Ekim 2026'da birlikte olmayı heyecanla bekliyoruz! ✨"
            : durum === "net_degil"
            ? "Durumunuz not alındı. Planınız netleştiğinde bizi haberdar edebilirsiniz."
            : "Yanıtınız kaydedildi. Gönüller bir olsun, güzel dilekleriniz için teşekkür ederiz."}
        </p>
        <button
          type="button"
          className="btn btn-birincil"
          onClick={onKapat}
          style={{ marginTop: "1.2rem" }}
        >
          Kapat
        </button>
      </div>
    );
  }

  if (sonuc.tur === "zaten") {
    const durumMetni =
      sonuc.durum === "katilacagim" || sonuc.geliyor
        ? `${sonuc.kisi} kişi katılacak`
        : sonuc.durum === "net_degil"
        ? "Durum net değil"
        : "Katılamayacak";

    return (
      <div className="katilim-zaten-kapsul">
        <h3 className="katilim-basari-baslik">Zaten Kayıtlısınız</h3>
        <p className="katilim-basari-metin">
          Bu isimle daha önce kayıt yapılmış: <strong>{sonuc.ad}</strong> ({durumMetni}).
        </p>
        <div
          className="katilim-buton-satiri"
          style={{ display: "flex", gap: "0.8rem", marginTop: "1.2rem", justifyContent: "center" }}
        >
          <button type="button" className="btn" onClick={() => gonder(true)}>
            Farklı kişiyim, yine de kaydet
          </button>
          <button type="button" className="btn btn-birincil" onClick={onKapat}>
            Tamam
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      className="katilim-formu"
      onSubmit={(e) => {
        e.preventDefault();
        gonder();
      }}
    >
      {/* 1. BÖLÜM: KATILIM DURUMU */}
      <div className="katilim-bolum">
        <label className="katilim-bolum-baslik">KATILIM DURUMU</label>
        <div className="katilim-kart-grid">
          {/* KATILACAĞIM */}
          <button
            type="button"
            className={`katilim-kart ${durum === "katilacagim" ? "secili" : ""}`}
            onClick={() => handleDurumSecim("katilacagim")}
            aria-pressed={durum === "katilacagim"}
          >
            <div className="katilim-kart-ikon">
              <svg
                viewBox="0 0 24 24"
                width="24"
                height="24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M8.5 12l2.5 2.5 5-5" />
              </svg>
            </div>
            <span className="katilim-kart-metin">KATILACAĞIM</span>
          </button>

          {/* NET DEĞİL */}
          <button
            type="button"
            className={`katilim-kart ${durum === "net_degil" ? "secili" : ""}`}
            onClick={() => handleDurumSecim("net_degil")}
            aria-pressed={durum === "net_degil"}
          >
            <div className="katilim-kart-ikon">
              <svg
                viewBox="0 0 24 24"
                width="24"
                height="24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="9" />
                <polyline points="12 7 12 12 15 14" />
              </svg>
            </div>
            <span className="katilim-kart-metin">NET DEĞİL</span>
          </button>

          {/* ÜZÜLEREK KATILMAYACAĞIM */}
          <button
            type="button"
            className={`katilim-kart ${durum === "katilmayacagim" ? "secili" : ""}`}
            onClick={() => handleDurumSecim("katilmayacagim")}
            aria-pressed={durum === "katilmayacagim"}
          >
            <div className="katilim-kart-ikon">
              <svg
                viewBox="0 0 24 24"
                width="24"
                height="24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="9" />
                <line x1="9" y1="9" x2="15" y2="15" />
                <line x1="15" y1="9" x2="9" y2="15" />
              </svg>
            </div>
            <span className="katilim-kart-metin">
              ÜZÜLEREK
              <br />
              KATILMAYACAĞIM
            </span>
          </button>
        </div>
      </div>

      {/* 2. BÖLÜM: TOPLAM KATILIMCI SAYISI */}
      <div className="katilim-bolum">
        <div className="katilim-bolum-baslik-satir">
          <label className="katilim-bolum-baslik" htmlFor="katilim-sayac">
            TOPLAM KATILIMCI SAYISI
          </label>
          <span className="katilim-bolum-ipucu">(sen dahil)</span>
        </div>

        <div className="katilim-sayac-kapsul" id="katilim-sayac">
          <button
            type="button"
            className="katilim-sayac-btn"
            aria-label="Kişi sayısını azalt"
            onClick={() => setKisi((k) => Math.max(0, k - 1))}
            disabled={kisi <= 0}
          >
            −
          </button>

          <div className="katilim-sayac-deger">
            <span className="sayac-rakam">{kisi}</span>
            <span className="sayac-birim">KİŞİ</span>
          </div>

          <button
            type="button"
            className="katilim-sayac-btn"
            aria-label="Kişi sayısını artır"
            onClick={() => setKisi((k) => Math.min(tavanKisi, k + 1))}
          >
            +
          </button>
        </div>
      </div>

      {/* 3. BÖLÜM: AD SOYAD */}
      <div className="katilim-bolum">
        <label className="katilim-bolum-baslik" htmlFor="ad">
          ADINIZ SOYADINIZ
        </label>
        <input
          id="ad"
          type="text"
          className="katilim-input"
          placeholder="Adınız ve Soyadınız"
          value={ad}
          maxLength={CFG.AD_MAX_KARAKTER}
          onChange={(e) => setAd(e.target.value)}
          autoComplete="name"
          required
        />
      </div>

      {/* 4. BÖLÜM: HATIRA NOTUNUZ */}
      <div className="katilim-bolum">
        <label className="katilim-bolum-baslik" htmlFor="dilek">
          HATIRA NOTUNUZ
        </label>
        <textarea
          id="dilek"
          rows={3}
          className="katilim-textarea"
          placeholder="Hatıra notunuz"
          value={dilek}
          maxLength={CFG.DILEK_MAX_KARAKTER}
          onChange={(e) => setDilek(e.target.value)}
        />
      </div>

      {sonuc.tur === "hata" && <p className="hata katilim-hata">{sonuc.mesaj}</p>}

      {/* GÖNDER BUTONU */}
      <div className="katilim-buton-satiri">
        <button
          type="submit"
          className="btn btn-birincil katilim-gonder-btn"
          disabled={kilitli}
        >
          {kilitli ? "Gönderiliyor…" : "Cevabı Gönder"}
        </button>
      </div>

      <p className="kucuk katilim-guvenlik-notu">
        Bu bilgiyi yalnızca biz görüyoruz, salona kaç kişi geleceğini bilmek için
        kullanıyoruz ve nişandan sonra siliyoruz.
      </p>
    </form>
  );
}
