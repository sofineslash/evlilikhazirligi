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
  const [slug, setSlug] = useState(baslangicSlug || DEFAULT_DAVETIYE_SLUG);
  const [mesajSablonu, setMesajSablonu] = useState(
    baslangicMesaj || VARSAYILAN_WHATSAPP_SABLONU,
  );
  const [ogTur, setOgTur] = useState(baslangicOgTur || "dinamik");
  const [davetliler, setDavetliler] = useState<Davetli[]>(baslangicDavetliler);

  // Kopyalandi bildirimleri
  const [kopyalandiUrl, setKopyalandiUrl] = useState<string | null>(null);

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
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr", gap: "0.75rem" }}>
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
            <div>
              <label htmlFor="izinli_kisi_sayisi" className="kucuk">Kişi Hakkı</label>
              <input
                id="izinli_kisi_sayisi"
                name="izinli_kisi_sayisi"
                type="number"
                min={1}
                max={20}
                defaultValue={2}
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
                <th>Davetli &amp; İzin</th>
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
                        {d.izinli_kisi_sayisi} kişilik
                        {d.masa_no && ` · Masa ${d.masa_no}`}
                        {d.telefon && ` · ${d.telefon}`}
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
                      {d.whatsapp_acildi_mi === 1 && (
                        <div className="kucuk" style={{ color: "#2e7d32", fontSize: "0.72rem" }}>
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
                <div className="whatsapp-kart-baslik">{gelin} &amp; {damat} — Nişan Davetiyesi</div>
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
    </div>
  );
}
