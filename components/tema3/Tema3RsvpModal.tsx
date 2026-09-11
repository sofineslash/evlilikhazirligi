"use client";

import { useState, useEffect } from "react";
import { CFG } from "@/lib/config";

type KatilimDurumu = "katilacagim" | "net_degil" | "katilmayacagim";

type Sonuc =
  | { tur: "bos" }
  | { tur: "gonderiliyor" }
  | { tur: "hata"; mesaj: string }
  | { tur: "basari"; durum: KatilimDurumu }
  | { tur: "zaten"; ad: string; durum?: string; geliyor: boolean; kisi: number };

interface Props {
  varsayilanAd?: string;
  token?: string;
  izinliKisi?: number;
}

export default function Tema3RsvpModal({
  varsayilanAd = "",
  token,
  izinliKisi = 10,
}: Props) {
  const [modalAcik, setModalAcik] = useState(false);
  const [durum, setDurum] = useState<KatilimDurumu | null>("katilacagim");
  const [kisi, setKisi] = useState<number>(1);
  const [ad, setAd] = useState(varsayilanAd);
  const [dilek, setDilek] = useState("");
  const [sonuc, setSonuc] = useState<Sonuc>({ tur: "bos" });

  const tavanKisi = Math.min(CFG.KISI_MAX, Math.max(1, izinliKisi || CFG.KISI_MAX));
  const kilitli = sonuc.tur === "gonderiliyor";

  const urlIsmiGetir = (): string => {
    if (typeof window === "undefined") return "";
    try {
      const sp = new URLSearchParams(window.location.search);
      const gParam = sp.get("guest") || sp.get("misafir");
      if (!gParam) return "";
      return decodeURIComponent(gParam)
        .replace(/[-_]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .split(" ")
        .map((k) => (k ? k[0].toLocaleUpperCase("tr") + k.slice(1).toLocaleLowerCase("tr") : ""))
        .join(" ");
    } catch {
      return "";
    }
  };

  useEffect(() => {
    if (varsayilanAd) {
      setAd(varsayilanAd);
    } else {
      const uAd = urlIsmiGetir();
      if (uAd) setAd(uAd);
    }
  }, [varsayilanAd]);

  const modalAc = () => {
    if (!ad.trim()) {
      const adayAd = varsayilanAd || urlIsmiGetir();
      if (adayAd) setAd(adayAd);
    }
    setModalAcik(true);
  };

  const modalKapat = () => {
    setModalAcik(false);
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

  return (
    <>
      {/* 1. SAYFA ÜZERİNDEKİ RSVP TETİK KARTI */}
      <section className="tema3-bolum-kapsul">
        <div className="tema3-rsvp-alani">
          <img
            src="/tema3/muhur.png"
            alt=""
            className="tema3-muhur-img"
            aria-hidden="true"
          />

          <h3 className="tema3-bolum-baslik" style={{ margin: "0 0 0.6rem" }}>
            Confirm Your Attendance
          </h3>

          <p className="tema3-rsvp-aciklama">
            Özel günümüzde sizleri aramızda görmekten mutluluk duyarız. Lütfen katılım durumunuzu bildiriniz.
          </p>

          <button
            type="button"
            className="tema3-btn tema3-btn-birincil tema3-rsvp-tetik-btn"
            onClick={modalAc}
          >
            Click to open ✉
          </button>
        </div>
      </section>

      {/* 2. LÜKS RSVP MODAL PENCERESİ */}
      {modalAcik && (
        <div
          className="tema3-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) modalKapat();
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="tema3-modal-kutu">
            <button
              type="button"
              className="tema3-modal-kapat"
              onClick={modalKapat}
              aria-label="Kapat"
            >
              ×
            </button>

            {sonuc.tur === "basari" ? (
              <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
                <div style={{ fontSize: "3rem", color: "#5A0F1B", marginBottom: "0.8rem" }}>✓</div>
                <h4 className="tema3-modal-baslik">Teşekkür Ederiz!</h4>
                <p style={{ color: "#6a5140", lineHeight: 1.5, margin: "1rem 0 1.5rem" }}>
                  {durum === "katilacagim"
                    ? "Katılımınız bizi çok mutlu etti. Birlikte kutlamayı heyecanla bekliyoruz! ✨"
                    : durum === "net_degil"
                    ? "Yanıtınız not alındı. Planınız netleştiğinde bizi haberdar edebilirsiniz."
                    : "Yanıtınız kaydedildi. Güzel dilekleriniz için teşekkür ederiz."}
                </p>
                <button
                  type="button"
                  className="tema3-btn tema3-btn-birincil"
                  onClick={modalKapat}
                >
                  Tamam
                </button>
              </div>
            ) : sonuc.tur === "zaten" ? (
              <div style={{ textAlign: "center", padding: "1rem 0" }}>
                <h4 className="tema3-modal-baslik">Zaten Kayıtlısınız</h4>
                <p style={{ color: "#6a5140", margin: "1rem 0" }}>
                  Bu isimle daha önce kayıt yapılmış: <strong>{sonuc.ad}</strong>
                </p>
                <div style={{ display: "flex", gap: "0.6rem", marginTop: "1rem" }}>
                  <button
                    type="button"
                    className="tema3-btn tema3-btn-ikincil"
                    onClick={() => gonder(true)}
                  >
                    Yine de Kaydet
                  </button>
                  <button
                    type="button"
                    className="tema3-btn tema3-btn-birincil"
                    onClick={modalKapat}
                  >
                    Kapat
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  gonder();
                }}
              >
                <h4 className="tema3-modal-baslik">Confirm Your Attendance</h4>
                <p className="tema3-modal-alt-metin">
                  Lütfen katılım durumunuzu ve kişi sayınızı belirtiniz.
                </p>

                {/* AD SOYAD */}
                <div className="tema3-form-grup">
                  <label className="tema3-form-label" htmlFor="tema3-ad">
                    Adınız Soyadınız
                  </label>
                  <input
                    id="tema3-ad"
                    type="text"
                    className="tema3-input"
                    value={ad}
                    onChange={(e) => setAd(e.target.value)}
                    placeholder="Adınız ve Soyadınız"
                    required
                  />
                </div>

                {/* KATILIM DURUMU */}
                <div className="tema3-form-grup">
                  <label className="tema3-form-label">Katılım Durumunuz</label>
                  <div className="tema3-radio-grup">
                    <label className={`tema3-radio-secenek ${durum === "katilacagim" ? "secili" : ""}`}>
                      <input
                        type="radio"
                        name="durum"
                        checked={durum === "katilacagim"}
                        onChange={() => {
                          setDurum("katilacagim");
                          setKisi((k) => (k > 0 ? k : 1));
                        }}
                      />
                      <span className="tema3-radio-metin">Memnuniyetle Katılacağım (Accepts with pleasure)</span>
                    </label>

                    <label className={`tema3-radio-secenek ${durum === "katilmayacagim" ? "secili" : ""}`}>
                      <input
                        type="radio"
                        name="durum"
                        checked={durum === "katilmayacagim"}
                        onChange={() => {
                          setDurum("katilmayacagim");
                          setKisi(0);
                        }}
                      />
                      <span className="tema3-radio-metin">Üzülerek Katılamayacağım (Declines with regret)</span>
                    </label>

                    <label className={`tema3-radio-secenek ${durum === "net_degil" ? "secili" : ""}`}>
                      <input
                        type="radio"
                        name="durum"
                        checked={durum === "net_degil"}
                        onChange={() => {
                          setDurum("net_degil");
                          setKisi((k) => (k > 0 ? k : 1));
                        }}
                      />
                      <span className="tema3-radio-metin">Henüz Net Değil</span>
                    </label>
                  </div>
                </div>

                {/* KİŞİ SAYISI */}
                {durum !== "katilmayacagim" && (
                  <div className="tema3-form-grup">
                    <label className="tema3-form-label" htmlFor="tema3-kisi">
                      Katılacak Kişi Sayısı (Siz Dahil)
                    </label>
                    <input
                      id="tema3-kisi"
                      type="number"
                      min={1}
                      max={tavanKisi}
                      className="tema3-input"
                      value={kisi}
                      onChange={(e) => setKisi(Number(e.target.value))}
                    />
                  </div>
                )}

                {/* HATIRA NOTU / DİLEK */}
                <div className="tema3-form-grup">
                  <label className="tema3-form-label" htmlFor="tema3-dilek">
                    Hatıra Notunuz / Sevdiğiniz Bir Şarkı
                  </label>
                  <textarea
                    id="tema3-dilek"
                    rows={3}
                    className="tema3-input"
                    value={dilek}
                    onChange={(e) => setDilek(e.target.value)}
                    placeholder="Güzel dileklerinizi veya bizi dans ettirecek bir şarkıyı yazabilirsiniz..."
                  />
                </div>

                {sonuc.tur === "hata" && (
                  <p style={{ color: "#b32424", fontSize: "0.85rem", margin: "0.5rem 0" }}>
                    {sonuc.mesaj}
                  </p>
                )}

                <button
                  type="submit"
                  className="tema3-btn tema3-btn-birincil"
                  style={{ width: "100%", marginTop: "1rem", padding: "0.9rem" }}
                  disabled={kilitli}
                >
                  {kilitli ? "Gönderiliyor…" : "Cevabı Gönder"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
