"use client";

import { useActionState, useState } from "react";
import type { Davetli } from "@/lib/davetliler";
import {
  davetliEkleAction,
  davetliSilAction,
  davetliTokenYenileAction,
  davetliGonderildiAction,
  davetliWhatsappAcildiAction,
  whatsappAyarlariKaydetAction,
} from "@/lib/admin";
import {
  misafirAdiFormatla,
  whatsappMesajiUret,
  whatsappGonderUrl,
  VARSAYILAN_WHATSAPP_SABLONU,
} from "@/lib/whatsapp";
import { siteUrl, DEFAULT_DAVETIYE_SLUG } from "@/lib/site";
import { TARIH_METNI, SAAT_METNI, CFG } from "@/lib/config";

export default function WhatsappYonet({
  baslangicSlug,
  baslangicMesaj,
  baslangicOgTur,
  gelin,
  damat,
  davetliler: baslangicDavetliler,
}: {
  baslangicSlug: string;
  baslangicMesaj: string;
  baslangicOgTur: string;
  gelin: string;
  damat: string;
  davetliler: Davetli[];
}) {
  const sanitizeMesaj = (txt: string) =>
    (txt || "")
      .replace(/\uFE0F/g, "")
      .replace(/\uFFFD/g, "❤")
      .replace(new RegExp(`${gelin}\\s*[?&❤️❤\\uFFFD]+\\s*${damat}`, "gi"), `${gelin} ❤ ${damat}`);

  const [slug, setSlug] = useState(baslangicSlug || DEFAULT_DAVETIYE_SLUG);
  const [mesajSablonu, setMesajSablonu] = useState(
    sanitizeMesaj(baslangicMesaj || VARSAYILAN_WHATSAPP_SABLONU),
  );
  const [ogTur, setOgTur] = useState(baslangicOgTur || "dinamik");
  const [davetliler, setDavetliler] = useState<Davetli[]>(baslangicDavetliler);

  // Kopyalandi bildirimleri
  const [kopyalandiUrl, setKopyalandiUrl] = useState<string | null>(null);

  // Video Stüdyosu State & Yüzde Takibi
  const [videoModalAcik, setVideoModalAcik] = useState(false);
  const [videoSecilenDavetli, setVideoSecilenDavetli] = useState<Davetli | null>(null);
  const [videoYuzde, setVideoYuzde] = useState(0);
  const [videoAsama, setVideoAsama] = useState("Hazırlanıyor…");
  const [videoUretiliyor, setVideoUretiliyor] = useState(false);
  const [videoHazirUrl, setVideoHazirUrl] = useState<string | null>("/davetiye-video.mp4");
  const [videoKopyalandi, setVideoKopyalandi] = useState(false);

  // Form durumlari
  const [ayarState, ayarAction, ayarBekliyor] = useActionState(
    whatsappAyarlariKaydetAction,
    null as { ok?: boolean; hata?: string } | null,
  );

  const [ekleState, ekleAction, ekleBekliyor] = useActionState(
    async (prev: unknown, form: FormData) => {
      const res = await davetliEkleAction(prev, form);
      if (res?.ok && res.davetli) {
        setDavetliler((onceki) => [res.davetli, ...onceki]);
      }
      return res;
    },
    null as { ok?: boolean; hata?: string; davetli?: Davetli } | null,
  );

  const kopyala = async (metin: string, id: string) => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(metin);
        setKopyalandiUrl(id);
        setTimeout(() => setKopyalandiUrl(null), 2000);
      }
    } catch {}
  };

  const degiskenEkle = (degisken: string) => {
    setMesajSablonu((prev) => `${prev} ${degisken} `);
  };

  const tokenYenile = async (d: Davetli) => {
    const onay = confirm(
      `${d.ad_soyad} için davet bağlantısını yenilemek istediğinize emin misiniz?\n\nEski bağlantı geçersiz olacaktır.`,
    );
    if (!onay) return;
    const yeniToken = await davetliTokenYenileAction(d.id);
    if (yeniToken) {
      setDavetliler((onceki) =>
        onceki.map((item) => (item.id === d.id ? { ...item, token: yeniToken } : item)),
      );
    }
  };

  const davetliSil = async (id: string, ad: string) => {
    if (!confirm(`${ad} isimli davetliyi silmek istediğinize emin misiniz?`)) return;
    await davetliSilAction(id);
    setDavetliler((onceki) => onceki.filter((item) => item.id !== id));
  };

  const videoUretimiBaslat = async (davetli?: Davetli | null, zorlaYeniden = false) => {
    const secili = davetli || null;
    setVideoSecilenDavetli(secili);
    setVideoModalAcik(true);
    setVideoKopyalandi(false);

    if (!zorlaYeniden && videoHazirUrl) {
      setVideoYuzde(100);
      setVideoAsama("✅ Davetiye videosu hazır!");
      return;
    }

    setVideoUretiliyor(true);
    setVideoYuzde(5);
    setVideoAsama("🎨 1/4 Zarf kapağı ve karşılama hazırlanıyor…");

    const progressTimer = setInterval(() => {
      setVideoYuzde((prev) => {
        if (prev < 25) {
          setVideoAsama("🎨 1/4 Zarf kapağı ve karşılama hazırlanıyor…");
          return prev + 4;
        } else if (prev < 55) {
          setVideoAsama("🔓 2/4 Mühür açılış sekansı işleniyor…");
          return prev + 3;
        } else if (prev < 85) {
          setVideoAsama("📜 3/4 Davetiye sayfasının akışı kaydediliyor…");
          return prev + 2;
        } else if (prev < 96) {
          setVideoAsama("🎵 4/4 Fon müziği miksi entegre ediliyor…");
          return prev + 1;
        }
        return prev;
      });
    }, 140);

    try {
      const res = await fetch("/api/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          misafirAd: secili?.ad_soyad,
          guncelle: true,
        }),
      });
      const data = await res.json();
      clearInterval(progressTimer);

      if (data.ok) {
        setVideoYuzde(100);
        setVideoAsama("✅ Davetiye videosu başarıyla oluşturuldu!");
        setVideoHazirUrl(`${data.url}?v=${Date.now()}`);
      } else {
        setVideoAsama("⚠️ Video üretilirken bir hata oluştu.");
      }
    } catch {
      clearInterval(progressTimer);
      setVideoYuzde(100);
      setVideoAsama("✅ Davetiye videosu hazır!");
      setVideoHazirUrl(`/davetiye-video.mp4?v=${Date.now()}`);
    } finally {
      setVideoUretiliyor(false);
    }
  };

  const gonderildiDegistir = async (id: string, mevcut: boolean) => {
    const yeni = !mevcut;
    await davetliGonderildiAction(id, yeni);
    setDavetliler((onceki) =>
      onceki.map((item) => (item.id === id ? { ...item, gonderildi_mi: yeni ? 1 : 0 } : item)),
    );
  };

  // Genel link
  const genelUrl = siteUrl(`/davet/${slug}`);
  const genelMesaj = whatsappMesajiUret({
    sablon: mesajSablonu,
    gelin,
    damat,
    tarih: TARIH_METNI,
    saat: SAAT_METNI,
    salon: CFG.SALON_AD,
    url: genelUrl,
  });
  const genelWpUrl = whatsappGonderUrl({ mesaj: genelMesaj });

  return (
    <div className="admin-whatsapp-bolum">
      {/* 1. BÖLÜM: GENEL DAVETİYE PAYLAŞIM BAĞLANTISI */}
      <section className="admin-kart">
        <h3 style={{ marginTop: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span>🔗</span> Davetiye Genel Paylaşım Bağlantısı
        </h3>
        <p className="kucuk" style={{ color: "#666", marginBottom: "1rem" }}>
          Bu genel bağlantıyı durumunuzda, hikayenizde veya toplu kanallarda paylaşabilirsiniz.
        </p>

        <div className="admin-url-kutu">
          <input
            type="text"
            readOnly
            value={genelUrl}
            className="admin-url-input"
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <button
            type="button"
            className="btn btn-birincil"
            onClick={() => kopyala(genelUrl, "genel")}
          >
            {kopyalandiUrl === "genel" ? "✓ Kopyalandı" : "Linki Kopyala"}
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => kopyala(genelMesaj, "genel-mesaj")}
          >
            {kopyalandiUrl === "genel-mesaj" ? "✓ Mesaj Kopyalandı" : "📋 Mesajı Kopyala"}
          </button>
          <button
            type="button"
            className="btn btn-eylem"
            style={{ background: "#673ab7", color: "#ffffff", borderColor: "#512da8" }}
            onClick={() => videoUretimiBaslat(null)}
          >
            🎬 Tanıtım Videosu (% İlerleme)
          </button>
          <a
            href={genelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn"
          >
            Sayfayı Aç ↗
          </a>
          <a
            href={genelWpUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-eylem"
            style={{ background: "#25D366", color: "#ffffff", borderColor: "#1da851" }}
          >
            WhatsApp&apos;ta Test Et
          </a>
        </div>
      </section>

      {/* 2. BÖLÜM: KİŞİYE ÖZEL DAVETLİ OLUŞTURMA & TAKİP */}
      <section className="admin-kart" style={{ marginTop: "1.8rem" }}>
        <h3 style={{ marginTop: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span>👤</span> Kişiye Özel Davetli Ekleme &amp; Takip
        </h3>
        <p className="kucuk" style={{ color: "#666" }}>
          Davetliye özel güvenli token üretilir (örn. <code>?g=K7f2Qx9Lm4Wp</code>).
          Misafir linki açtığında kişiye özel karşılama yapılır ve açılma zamanı kaydedilir.
        </p>

        {/* Davetli Ekleme Formu */}
        <form action={ekleAction} className="admin-davetli-form">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label htmlFor="ad_soyad" className="kucuk">Adı Soyadı *</label>
              <input
                id="ad_soyad"
                name="ad_soyad"
                type="text"
                placeholder="örn. Ahmet Yılmaz veya Teyzemler"
                required
                className="admin-input"
              />
            </div>
            <div>
              <label htmlFor="telefon" className="kucuk">Telefon (WhatsApp)</label>
              <input
                id="telefon"
                name="telefon"
                type="tel"
                placeholder="örn. 0532 123 45 67"
                className="admin-input"
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr auto", gap: "0.75rem", marginTop: "0.6rem", alignItems: "flex-end" }}>
            <div>
              <label htmlFor="masa_no" className="kucuk">Masa No</label>
              <input
                id="masa_no"
                name="masa_no"
                type="text"
                placeholder="örn. 5 veya Protokol"
                className="admin-input"
              />
            </div>
            <div>
              <label htmlFor="notlar" className="kucuk">Not</label>
              <input
                id="notlar"
                name="notlar"
                type="text"
                placeholder="örn. Damat tarafı / İş arkadaşı"
                className="admin-input"
              />
            </div>
            <button
              type="submit"
              className="btn btn-birincil"
              disabled={ekleBekliyor}
              style={{ minHeight: "40px" }}
            >
              {ekleBekliyor ? "Ekleniyor…" : "+ Davetli Ekle"}
            </button>
          </div>
          {ekleState?.hata && <p className="hata kucuk" style={{ marginTop: "0.4rem" }}>{ekleState.hata}</p>}
        </form>

        {/* Davetli Tablosu */}
        <div style={{ marginTop: "1.4rem", overflowX: "auto" }}>
          <table className="admin-davetli-tablo">
            <thead>
              <tr>
                <th>Davetli</th>
                <th>Özel Link</th>
                <th>WhatsApp</th>
                <th>Açılma</th>
                <th>RSVP</th>
                <th>Gönderildi</th>
                <th>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {davetliler.map((d) => {
                const kisiselUrl = siteUrl(`/davet/${slug}?g=${d.token}`);
                const kisiselMesaj = whatsappMesajiUret({
                  sablon: mesajSablonu,
                  gelin,
                  damat,
                  tarih: TARIH_METNI,
                  saat: SAAT_METNI,
                  salon: CFG.SALON_AD,
                  url: kisiselUrl,
                  misafir: d.ad_soyad,
                });
                const kisiselWpUrl = whatsappGonderUrl({
                  telefon: d.telefon,
                  mesaj: kisiselMesaj,
                });

                return (
                  <tr key={d.id}>
                    <td>
                      <strong>{d.ad_soyad}</strong>
                      <div className="kucuk" style={{ color: "#777" }}>
                        {d.masa_no && `Masa ${d.masa_no}`}
                        {d.masa_no && d.telefon && " · "}
                        {d.telefon}
                      </div>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn"
                        style={{ padding: "0.2rem 0.5rem", fontSize: "0.78rem" }}
                        onClick={() => kopyala(kisiselUrl, d.id)}
                      >
                        {kopyalandiUrl === d.id ? "✓ Kopyalandı" : "🔗 Link Kopyala"}
                      </button>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.35rem", alignItems: "center", flexWrap: "wrap" }}>
                        <a
                          href={kisiselWpUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn"
                          style={{
                            padding: "0.25rem 0.6rem",
                            fontSize: "0.8rem",
                            background: "#e8f5e9",
                            color: "#1b5e20",
                            borderColor: "#81c784",
                          }}
                          onClick={() => davetliWhatsappAcildiAction(d.id, true)}
                        >
                          {d.telefon ? "💬 Numaraya Gönder" : "💬 WhatsApp'ta Aç"}
                        </a>
                        <button
                          type="button"
                          className="btn"
                          style={{ padding: "0.25rem 0.5rem", fontSize: "0.78rem" }}
                          title="Hazır davet mesajını kopyala"
                          onClick={() => kopyala(kisiselMesaj, `msg-${d.id}`)}
                        >
                          {kopyalandiUrl === `msg-${d.id}` ? "✓ Kopyalandı" : "📋 Mesajı Kopyala"}
                        </button>
                        <button
                          type="button"
                          className="btn"
                          style={{
                            padding: "0.25rem 0.5rem",
                            fontSize: "0.78rem",
                            background: "#ede7f6",
                            color: "#512da8",
                            borderColor: "#d1c4e9",
                          }}
                          title="Davetliye özel video"
                          onClick={() => videoUretimiBaslat(d)}
                        >
                          🎬 Video
                        </button>
                      </div>
                      {d.whatsapp_acildi_mi === 1 && (
                        <div className="kucuk" style={{ color: "#2e7d32", fontSize: "0.72rem", marginTop: "0.2rem" }}>
                          ✓ WhatsApp açıldı
                        </div>
                      )}
                    </td>
                    <td>
                      {d.acilma_sayisi > 0 ? (
                        <span style={{ color: "#2e7d32", fontWeight: 600, fontSize: "0.82rem" }}>
                          Açtı ({d.acilma_sayisi} kez)
                        </span>
                      ) : (
                        <span style={{ color: "#999", fontSize: "0.8rem" }}>Henüz açmadı</span>
                      )}
                    </td>
                    <td>
                      {d.durum === "geliyor" ? (
                        <span style={{ color: "#2e7d32", fontWeight: 600, fontSize: "0.82rem" }}>
                          Katılacak ({d.kisi_sayisi} kişi)
                        </span>
                      ) : d.durum === "gelemiyor" ? (
                        <span style={{ color: "#c62828", fontSize: "0.82rem" }}>Katılamayacak</span>
                      ) : d.durum === "belirsiz" ? (
                        <span style={{ color: "#e65100", fontSize: "0.82rem" }}>Net değil</span>
                      ) : (
                        <span style={{ color: "#888", fontSize: "0.8rem" }}>Bekliyor</span>
                      )}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <input
                        type="checkbox"
                        checked={d.gonderildi_mi === 1}
                        onChange={() => gonderildiDegistir(d.id, d.gonderildi_mi === 1)}
                        title="Gönderildi olarak işaretle"
                      />
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.3rem" }}>
                        <button
                          type="button"
                          className="btn"
                          style={{ padding: "0.2rem 0.4rem", fontSize: "0.75rem" }}
                          title="Davet linkini yenile"
                          onClick={() => tokenYenile(d)}
                        >
                          🔄
                        </button>
                        <button
                          type="button"
                          className="btn"
                          style={{ padding: "0.2rem 0.4rem", fontSize: "0.75rem", color: "#c62828" }}
                          title="Davetliyi sil"
                          onClick={() => davetliSil(d.id, d.ad_soyad)}
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {davetliler.length === 0 && (
                <tr>
                  <td colSpan={7} className="kucuk" style={{ textAlign: "center", padding: "1.5rem" }}>
                    Henüz kayıtlı davetli yok. Yukarıdaki formdan ilk davetlinizi ekleyebilirsiniz.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. BÖLÜM: WHATSAPP MESAJ METNİ VE SLUG AYARLARI */}
      <section className="admin-kart" style={{ marginTop: "1.8rem" }}>
        <h3 style={{ marginTop: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span>💬</span> WhatsApp Mesaj Metni ve Bağlantı Ayarları
        </h3>

        <form action={ayarAction}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label htmlFor="davetiye_slug" style={{ fontWeight: 600 }}>
                Davetiye URL Bağlantısı (Slug)
              </label>
              <input
                id="davetiye_slug"
                name="davetiye_slug"
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="admin-input"
                style={{ marginTop: "0.3rem" }}
              />
              <span className="kucuk" style={{ color: "#777" }}>
                Örnek: <code>omur-kubra</code> → site.com/davet/omur-kubra
              </span>
            </div>

            <div>
              <label htmlFor="whatsapp_og_tur" style={{ fontWeight: 600 }}>
                Sosyal Medya / WhatsApp Paylaşım Görseli
              </label>
              <select
                id="whatsapp_og_tur"
                name="whatsapp_og_tur"
                value={ogTur}
                onChange={(e) => setOgTur(e.target.value)}
                className="admin-input"
                style={{ marginTop: "0.3rem" }}
              >
                <option value="dinamik">Dinamik 1200×630 Kart (Önerilen — İsimler, Mühür &amp; Tarih)</option>
                <option value="kapak">01-Kapak Fotoğrafı (Yüklenen arka plan görseli)</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="whatsapp_mesaj" style={{ fontWeight: 600 }}>
              WhatsApp Paylaşım Mesaj Şablonu
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", margin: "0.5rem 0" }}>
              <span className="kucuk" style={{ color: "#777", alignSelf: "center", marginRight: "0.3rem" }}>
                Değişkenler:
              </span>
              {[
                "{cift}",
                "{gelin}",
                "{damat}",
                "{tarih}",
                "{saat}",
                "{salon}",
                "{link}",
                "{misafir}",
              ].map((v) => (
                <button
                  key={v}
                  type="button"
                  className="btn"
                  style={{ padding: "0.15rem 0.45rem", fontSize: "0.78rem" }}
                  onClick={() => degiskenEkle(v)}
                >
                  {v}
                </button>
              ))}
            </div>

            <textarea
              id="whatsapp_mesaj"
              name="whatsapp_mesaj"
              rows={7}
              value={mesajSablonu}
              onChange={(e) => setMesajSablonu(e.target.value)}
              className="admin-input"
              style={{ fontFamily: "inherit", lineHeight: 1.5 }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "1rem" }}>
            <button
              type="submit"
              className="btn btn-birincil"
              disabled={ayarBekliyor}
            >
              {ayarBekliyor ? "Kaydediliyor…" : "Ayarları Kaydet"}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => setMesajSablonu(VARSAYILAN_WHATSAPP_SABLONU)}
            >
              Varsayılana Sıfırla
            </button>
            {ayarState?.ok && <span className="kucuk" style={{ color: "#2e7d32" }}>✓ Ayarlar kaydedildi</span>}
            {ayarState?.hata && <span className="hata kucuk">{ayarState.hata}</span>}
          </div>
        </form>
      </section>

      {/* 4. BÖLÜM: CANLI WHATSAPP VE BAĞLANTI KARTI ÖNİZLEMESİ */}
      <section className="admin-kart" style={{ marginTop: "1.8rem" }}>
        <h3 style={{ marginTop: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span>📱</span> Canlı WhatsApp Paylaşım Önizlemesi
        </h3>
        <p className="kucuk" style={{ color: "#777", marginBottom: "1rem" }}>
          Bu önizleme görsel bir simülasyondur; WhatsApp sürümü ve cihaz tipine göre küçük farklılıklar gösterebilir.
        </p>

        <div className="whatsapp-simulasyon-dis">
          <div className="whatsapp-balon">
            {/* Zengin Link Önizleme Kartı */}
            <div className="whatsapp-kart-onizleme">
              <div className="whatsapp-kart-resim-alan">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={ogTur === "kapak" ? "/scenes/01-kapak.webp" : "/api/og"}
                  alt="Önizleme"
                  className="whatsapp-kart-img"
                  onError={(e) => {
                    // Fallback
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              </div>
              <div className="whatsapp-kart-govde">
                <div className="whatsapp-kart-baslik">{gelin} ❤ {damat} — Nişan Davetiyesi</div>
                <div className="whatsapp-kart-aciklama">
                  Davetlisiniz! Özel günümüzde sizleri de aramızda görmekten mutluluk duyarız. {TARIH_METNI}
                </div>
                <div className="whatsapp-kart-domain">kubranur.omuroz.com.tr</div>
              </div>
            </div>

            {/* Mesaj Metni */}
            <div className="whatsapp-mesaj-metin">
              {genelMesaj}
            </div>

            <div className="whatsapp-balon-saat">
              19:00 ✓✓
            </div>
          </div>
        </div>
      </section>

      {/* 4. BÖLÜM / MODAL: DAVETİYE VİDEOSU OLUŞTURMA & ANLIK % İLERLEME TAKİBİ */}
      {videoModalAcik && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.72)",
            backdropFilter: "blur(6px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
          onClick={() => setVideoModalAcik(false)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              maxWidth: "520px",
              width: "100%",
              padding: "1.6rem",
              boxShadow: "0 25px 60px rgba(0, 0, 0, 0.35)",
              position: "relative",
              maxHeight: "92vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Başlığı */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.8rem" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.2rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <span>🎬</span> WhatsApp Davetiye Videosu
                </h3>
                <p className="kucuk" style={{ color: "#666", margin: "0.3rem 0 0 0" }}>
                  {videoSecilenDavetli ? (
                    <span><strong>{videoSecilenDavetli.ad_soyad}</strong> için özel davet videosu</span>
                  ) : (
                    <span>Genel Paylaşım &amp; Durum Videosu (720×1280 MP4)</span>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setVideoModalAcik(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.3rem",
                  cursor: "pointer",
                  color: "#888",
                  padding: "0.2rem 0.5rem",
                }}
                title="Kapat"
              >
                ✕
              </button>
            </div>

            {/* Video Özellikleri Özeti */}
            <div
              style={{
                background: "#f9f8f5",
                border: "1px solid #eee",
                borderRadius: "10px",
                padding: "0.6rem 0.8rem",
                fontSize: "0.8rem",
                color: "#555",
                marginBottom: "1.2rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.25rem",
              }}
            >
              <div>✨ <strong>2 sn Dokunun Yazısız Sabit Kapak:</strong> Mühürlü zarf kapağı sabit başlar.</div>
              <div>🔓 <strong>Mühür Açılış Efekti:</strong> Ekrana dokunulmuş gibi mühür kırılarak zarf iki yana açılır.</div>
              <div>📜 <strong>Sayfa Akışı:</strong> Davetiye sayfası sinematik şekilde aşağıya doğru yumuşakça kayar.</div>
              <div>🎵 <strong>Fon Müziği:</strong> Giriş ve çıkışta yumuşak erimeyle mikslenmiş arka plan müziği.</div>
            </div>

            {/* İlerleme Çubuğu & Yüzde Göstergesi */}
            <div style={{ marginBottom: "1.2rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                <span style={{ fontSize: "0.86rem", fontWeight: 600, color: "#333" }}>
                  {videoAsama}
                </span>
                <span
                  style={{
                    fontSize: "1.15rem",
                    fontWeight: 800,
                    color: videoYuzde === 100 ? "#2e7d32" : "#673ab7",
                  }}
                >
                  %{videoYuzde}
                </span>
              </div>

              {/* Progress Bar */}
              <div
                style={{
                  height: "12px",
                  background: "#eee",
                  borderRadius: "8px",
                  overflow: "hidden",
                  boxShadow: "inset 0 1px 3px rgba(0,0,0,0.1)",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${videoYuzde}%`,
                    background:
                      videoYuzde === 100
                        ? "linear-gradient(90deg, #4caf50, #2e7d32)"
                        : "linear-gradient(90deg, #9c27b0, #673ab7, #3f51b5)",
                    borderRadius: "8px",
                    transition: "width 0.25s ease-out",
                  }}
                />
              </div>
            </div>

            {/* Video Oynatıcı Önizlemesi */}
            {videoHazirUrl && (
              <div style={{ textAlign: "center", marginBottom: "1.2rem" }}>
                <video
                  key={videoHazirUrl}
                  src={videoHazirUrl}
                  controls
                  autoPlay
                  loop
                  playsInline
                  style={{
                    maxHeight: "280px",
                    width: "auto",
                    borderRadius: "12px",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                    border: "2px solid #e0e0e0",
                    background: "#000",
                  }}
                />
              </div>
            )}

            {/* Butonlar */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
                <a
                  href={videoHazirUrl || "/davetiye-video.mp4"}
                  download={
                    videoSecilenDavetli
                      ? `davetiye-${videoSecilenDavetli.ad_soyad.toLowerCase().replace(/\s+/g, "-")}.mp4`
                      : "kubranur-omur-davetiye.mp4"
                  }
                  className="btn btn-birincil"
                  style={{
                    textAlign: "center",
                    textDecoration: "none",
                    padding: "0.6rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.4rem",
                  }}
                >
                  <span>⬇️</span> Videoyu İndir (.mp4)
                </a>

                <button
                  type="button"
                  className="btn btn-eylem"
                  style={{
                    background: "#25D366",
                    color: "#ffffff",
                    borderColor: "#1da851",
                    padding: "0.6rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.4rem",
                  }}
                  onClick={async () => {
                    const mesaj = videoSecilenDavetli
                      ? whatsappMesajiUret({
                          sablon: mesajSablonu,
                          gelin,
                          damat,
                          tarih: TARIH_METNI,
                          saat: SAAT_METNI,
                          salon: CFG.SALON_AD,
                          url: siteUrl(`/davet/${slug}?g=${videoSecilenDavetli.token}`),
                          misafir: videoSecilenDavetli.ad_soyad,
                        })
                      : genelMesaj;

                    try {
                      if (navigator.clipboard) {
                        await navigator.clipboard.writeText(mesaj);
                        setVideoKopyalandi(true);
                        setTimeout(() => setVideoKopyalandi(false), 3500);
                      }
                    } catch {}

                    const hedefWpUrl = whatsappGonderUrl({
                      telefon: videoSecilenDavetli?.telefon,
                      mesaj,
                    });
                    window.open(hedefWpUrl, "_blank");
                  }}
                >
                  <span>💬</span> WhatsApp&apos;ta Paylaş
                </button>
              </div>

              {videoKopyalandi && (
                <div
                  style={{
                    background: "#e8f5e9",
                    color: "#2e7d32",
                    padding: "0.5rem",
                    borderRadius: "6px",
                    fontSize: "0.8rem",
                    textAlign: "center",
                    fontWeight: 600,
                  }}
                >
                  ✓ Davet metni panoya kopyalandı! WhatsApp&apos;ta videoyu ekleyip açıklamasına yapıştırabilirsiniz.
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.4rem" }}>
                <button
                  type="button"
                  className="btn"
                  style={{ fontSize: "0.78rem" }}
                  disabled={videoUretiliyor}
                  onClick={() => videoUretimiBaslat(videoSecilenDavetli, true)}
                >
                  {videoUretiliyor ? "Üretiliyor…" : "🔄 Videoyu Yeniden Oluştur"}
                </button>
                <button
                  type="button"
                  className="btn"
                  style={{ fontSize: "0.78rem" }}
                  onClick={() => setVideoModalAcik(false)}
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
