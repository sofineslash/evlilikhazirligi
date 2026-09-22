"use client";

import { useActionState, useState, useEffect } from "react";
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
  whatsappVideoMesajiUret,
  whatsappGonderUrl,
  VARSAYILAN_WHATSAPP_SABLONU,
} from "@/lib/whatsapp";
import { siteUrl, DEFAULT_DAVETIYE_SLUG, telefonNormalize } from "@/lib/site";
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
      .replace(new RegExp(`${gelin}\\s*[?&❤\\uFFFD]+\\s*${damat}`, "gi"), `${gelin} ❤ ${damat}`);

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
  const [videoHazirUrl, setVideoHazirUrl] = useState<string | null>(null);
  const [videoKopyalandi, setVideoKopyalandi] = useState(false);
  const [videoPaylasimDurumu, setVideoPaylasimDurumu] = useState<string | null>(null);
  const [masaustuRehberGoster, setMasaustuRehberGoster] = useState(false);

  useEffect(() => {
    fetch("/api/video?durum=1")
      .then((r) => r.json())
      .then((d) => {
        if (d?.varMi) {
          setVideoHazirUrl(`/davetiye-video.mp4?v=${d.sonGuncellemeMs || Date.now()}`);
        } else {
          setVideoHazirUrl(`/davetiye-video.mp4?v=${Date.now()}`);
        }
      })
      .catch(() => {
        setVideoHazirUrl(`/davetiye-video.mp4?v=${Date.now()}`);
      });
  }, []);

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

  const videoWhatsappGonder = async (davetli?: Davetli | null, metinleAc = false) => {
    const secili = davetli !== undefined ? davetli : videoSecilenDavetli;
    const videoUrl = videoHazirUrl || "/davetiye-video.mp4";

    // Video altına gelecek özel açıklama metni
    const videoMesaj = secili
      ? whatsappVideoMesajiUret({
          gelin,
          damat,
          url: siteUrl(`/davet/${slug}?g=${secili.token}`),
        })
      : whatsappVideoMesajiUret({
          gelin,
          damat,
          url: siteUrl(`/davet/${slug}`),
        });

    // Klasik linkli metin
    const metinMesaj = secili
      ? whatsappMesajiUret({
          sablon: mesajSablonu,
          gelin,
          damat,
          tarih: TARIH_METNI,
          saat: SAAT_METNI,
          salon: CFG.SALON_AD,
          url: siteUrl(`/davet/${slug}?g=${secili.token}`),
          misafir: secili.ad_soyad,
        })
      : genelMesaj;

    const aktifPaylasimMetni = metinleAc ? metinMesaj : videoMesaj;

    // 1. İlgili metni panoya kopyala
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(aktifPaylasimMetni);
        setVideoKopyalandi(true);
        setTimeout(() => setVideoKopyalandi(false), 3500);
      }
    } catch {}

    const dosyaAdi = secili
      ? `davetiye-${secili.ad_soyad.toLowerCase().replace(/\s+/g, "-")}.mp4`
      : "kubranur-omur-davetiye.mp4";

    // 2. Mobil / Web Share API desteği varsa doğrudan videoyu WhatsApp'a aktar
    const isMobile =
      typeof navigator !== "undefined" &&
      /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile && navigator.share && navigator.canShare) {
      try {
        setVideoPaylasimDurumu("⏳ Video WhatsApp'a aktarılıyor...");
        const resp = await fetch(videoUrl);
        const blob = await resp.blob();
        const file = new File([blob], dosyaAdi, { type: "video/mp4" });

        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `${gelin} ❤️ ${damat} Nişan Davetiyesi`,
            text: videoMesaj,
          });
          setVideoPaylasimDurumu("✓ WhatsApp'ta video başarıyla paylaşıldı!");
          setTimeout(() => setVideoPaylasimDurumu(null), 5000);
          if (secili) {
            davetliWhatsappAcildiAction(secili.id, true).catch(() => {});
            setDavetliler((prev) =>
              prev.map((item) => (item.id === secili.id ? { ...item, whatsapp_acildi_mi: 1 } : item)),
            );
          }
          return;
        }
      } catch (err) {
        console.log("Web Share:", err);
      }
    }

    // 3. Masaüstü / PC / Mac:
    // EĞER metinleAc=true ise URL'ye metin verilir (link kartı çıkar).
    // EĞER metinleAc=false ise (VİDEOLU PAYLAŞIM):
    // WhatsApp boş açılır, böylece o istenmeyen web link kartı videonun yerini almaz!
    // Mesaj zaten panoya kopyalanmıştır. Kullanıcı videoyu sürükleyip alttaki kutuya yapıştırır (Cmd+V).
    const telRakam = secili?.telefon ? telefonNormalize(secili.telefon) : "";
    let hedefWpUrl = "";
    if (metinleAc) {
      hedefWpUrl = whatsappGonderUrl({
        telefon: secili?.telefon,
        mesaj: metinMesaj,
      });
    } else {
      hedefWpUrl = isMobile
        ? (telRakam ? `https://wa.me/${telRakam}` : `https://wa.me/`)
        : (telRakam ? `https://web.whatsapp.com/send?phone=${telRakam}` : `https://web.whatsapp.com/`);
    }

    window.open(hedefWpUrl, "whatsapp_web");

    if (secili) {
      davetliWhatsappAcildiAction(secili.id, true).catch(() => {});
      setDavetliler((prev) =>
        prev.map((item) => (item.id === secili.id ? { ...item, whatsapp_acildi_mi: 1 } : item)),
      );
    }

    setMasaustuRehberGoster(true);
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

  // Aktif secili davetli ve kisisel mesaj
  const aktifDavetli = videoSecilenDavetli;
  const aktifUrl = aktifDavetli
    ? siteUrl(`/davet/${slug}?g=${aktifDavetli.token}`)
    : genelUrl;
  const aktifMesaj = whatsappMesajiUret({
    sablon: mesajSablonu,
    gelin,
    damat,
    tarih: TARIH_METNI,
    saat: SAAT_METNI,
    salon: CFG.SALON_AD,
    url: aktifUrl,
    misafir: aktifDavetli?.ad_soyad,
  });

  const aktifVideoMesaj = whatsappVideoMesajiUret({
    gelin,
    damat,
    url: aktifUrl,
  });

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
            target="whatsapp_web"
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
          <div>
            <h3 style={{ marginTop: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span>👤</span> Kişiye Özel Davetli Ekleme &amp; Takip
            </h3>
            <p className="kucuk" style={{ color: "#666", margin: "0.2rem 0 0 0" }}>
              Davetliye özel güvenli token üretilir. Misafir linki açtığında kişiye özel karşılama yapılır.
              Link başkasına yönlendirilirse sistem gelen cevabı ayrı bir davetli olarak algılar ve bağlar.
            </p>
          </div>
          <div style={{ fontSize: "0.82rem", background: "#f8fafc", padding: "0.35rem 0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <strong>{davetliler.filter((d) => !d.yonlendiren_ad).length}</strong> Asıl Davetli
            {davetliler.some((d) => !!d.yonlendiren_ad) && (
              <> · <strong style={{ color: "#0284c7" }}>{davetliler.filter((d) => !!d.yonlendiren_ad).length}</strong> Yönlendirilen Katılım 🔗</>
            )}
          </div>
        </div>

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
                  <tr key={d.id} style={d.yonlendiren_ad ? { background: "#f8fafc" } : undefined}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                        {d.yonlendiren_ad && (
                          <span style={{ color: "#0284c7", fontWeight: 700, fontSize: "0.95rem" }} title="Yönlendirilen Davetli">
                            ↳
                          </span>
                        )}
                        <strong>{d.ad_soyad}</strong>
                      </div>
                      {d.yonlendiren_ad && (
                        <div style={{ marginTop: "0.2rem" }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.25rem",
                              background: "#e0f2fe",
                              color: "#0369a1",
                              fontSize: "0.72rem",
                              fontWeight: 600,
                              padding: "0.15rem 0.45rem",
                              borderRadius: "6px",
                              border: "1px solid #bae6fd",
                            }}
                            title={`${d.yonlendiren_ad} kişisinin özel davetiye bağlantısı üzerinden katıldı`}
                          >
                            <span>🔗</span> {d.yonlendiren_ad}&apos;dan Yönlendirildi
                          </span>
                        </div>
                      )}
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
                          target="whatsapp_web"
                          rel="noopener noreferrer"
                          className="btn"
                          style={{
                            padding: "0.25rem 0.6rem",
                            fontSize: "0.8rem",
                            background: "#e8f5e9",
                            color: "#1b5e20",
                            borderColor: "#81c784",
                          }}
                          onClick={async () => {
                            try {
                              if (navigator.clipboard) {
                                await navigator.clipboard.writeText(kisiselMesaj);
                                setKopyalandiUrl(`msg-${d.id}`);
                                setTimeout(() => setKopyalandiUrl(null), 2500);
                              }
                            } catch {}
                            davetliWhatsappAcildiAction(d.id, true).catch(() => {});
                            setDavetliler((prev) =>
                              prev.map((item) => (item.id === d.id ? { ...item, whatsapp_acildi_mi: 1 } : item)),
                            );
                          }}
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
                            padding: "0.25rem 0.6rem",
                            fontSize: "0.78rem",
                            background: "#f3e5f5",
                            color: "#4a148c",
                            borderColor: "#ba68c8",
                            fontWeight: 600,
                          }}
                          title="Davetliye özel videolu paylaşım"
                          onClick={() => videoUretimiBaslat(d)}
                        >
                          🎬 Video ile Paylaş
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
                <div className="whatsapp-kart-baslik">{gelin} ❤️ {damat} — Nişan Davetiyesi</div>
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
                  {aktifDavetli ? (
                    <span><strong>{aktifDavetli.ad_soyad}</strong> için kişiye özel paylaşım</span>
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

            {/* Davetli Seçici ve Gezinme (200 kişilik liste) */}
            <div
              style={{
                background: "#f8f9fa",
                border: "1.5px solid #e2e8f0",
                borderRadius: "12px",
                padding: "0.75rem 0.9rem",
                marginBottom: "1rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1e293b" }}>
                  👤 Kime Gönderilecek? ({davetliler.length} Davetli)
                </label>
                {aktifDavetli && (
                  <span
                    style={{
                      fontSize: "0.74rem",
                      background: aktifDavetli.gonderildi_mi === 1 ? "#e8f5e9" : "#fff3e0",
                      color: aktifDavetli.gonderildi_mi === 1 ? "#2e7d32" : "#e65100",
                      padding: "0.15rem 0.45rem",
                      borderRadius: "6px",
                      fontWeight: 600,
                    }}
                  >
                    {aktifDavetli.gonderildi_mi === 1 ? "✓ Gönderildi" : "⏳ Gönderilmedi"}
                  </span>
                )}
              </div>

              <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                <select
                  value={aktifDavetli?.id || ""}
                  onChange={(e) => {
                    const found = davetliler.find((item) => item.id === e.target.value) || null;
                    setVideoSecilenDavetli(found);
                  }}
                  className="admin-input"
                  style={{ flex: 1, padding: "0.4rem 0.6rem", fontSize: "0.84rem", height: "36px" }}
                >
                  <option value="">🌐 Genel Paylaşım (Kişiye Özel Değil)</option>
                  {davetliler.map((item, idx) => (
                    <option key={item.id} value={item.id}>
                      {idx + 1}. {item.ad_soyad} {item.telefon ? `(${item.telefon})` : ""} {item.gonderildi_mi === 1 ? "✓ Gönderildi" : ""}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  className="btn"
                  style={{ padding: "0.4rem 0.65rem", height: "36px", fontSize: "0.8rem", whiteSpace: "nowrap" }}
                  disabled={!aktifDavetli || davetliler.findIndex((d) => d.id === aktifDavetli.id) <= 0}
                  onClick={() => {
                    const curIdx = davetliler.findIndex((d) => d.id === aktifDavetli?.id);
                    if (curIdx > 0) setVideoSecilenDavetli(davetliler[curIdx - 1]);
                  }}
                  title="Önceki Davetli"
                >
                  ◀ Önceki
                </button>
                <button
                  type="button"
                  className="btn"
                  style={{ padding: "0.4rem 0.65rem", height: "36px", fontSize: "0.8rem", whiteSpace: "nowrap" }}
                  disabled={
                    davetliler.length === 0 ||
                    (!!aktifDavetli && davetliler.findIndex((d) => d.id === aktifDavetli.id) >= davetliler.length - 1)
                  }
                  onClick={() => {
                    if (!aktifDavetli && davetliler.length > 0) {
                      setVideoSecilenDavetli(davetliler[0]);
                    } else {
                      const curIdx = davetliler.findIndex((d) => d.id === aktifDavetli?.id);
                      if (curIdx >= 0 && curIdx < davetliler.length - 1) {
                        setVideoSecilenDavetli(davetliler[curIdx + 1]);
                      }
                    }
                  }}
                  title="Sonraki Davetli"
                >
                  Sonraki ▶
                </button>
              </div>
            </div>

            {/* Kişiye Özel Mesaj Önizlemesi */}
            <div
              style={{
                background: "#f0f4f8",
                border: "1px solid #cbd5e1",
                borderRadius: "10px",
                padding: "0.6rem 0.8rem",
                fontSize: "0.78rem",
                marginBottom: "1rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                <strong style={{ color: "#0f172a" }}>
                  📝 Gönderilecek Mesaj {aktifDavetli ? `(${aktifDavetli.ad_soyad})` : "(Genel)"}:
                </strong>
                <button
                  type="button"
                  style={{
                    background: "none",
                    border: "none",
                    color: "#0284c7",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                    padding: 0,
                    fontWeight: 600,
                  }}
                  onClick={() => kopyala(aktifMesaj, "modal-mesaj")}
                >
                  {kopyalandiUrl === "modal-mesaj" ? "✓ Kopyalandı" : "Mesajı Kopyala"}
                </button>
              </div>
              <div
                style={{
                  whiteSpace: "pre-line",
                  color: "#334155",
                  maxHeight: "85px",
                  overflowY: "auto",
                  padding: "0.4rem 0.6rem",
                  background: "#ffffff",
                  borderRadius: "6px",
                  border: "1px solid #e2e8f0",
                  lineHeight: 1.4,
                  fontSize: "0.76rem",
                }}
              >
                {aktifMesaj}
              </div>
            </div>

            {/* Video Özellikleri Özeti */}
            <div
              style={{
                background: "#f9f8f5",
                border: "1px solid #eee",
                borderRadius: "10px",
                padding: "0.5rem 0.8rem",
                fontSize: "0.76rem",
                color: "#555",
                marginBottom: "1rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.2rem",
              }}
            >
              <div>✨ <strong>2 sn Dokunun Yazısız Sabit Kapak:</strong> Mühürlü zarf kapağı sabit başlar.</div>
              <div>🔓 <strong>Mühür Açılış Efekti:</strong> Ekrana dokunulmuş gibi mühür kırılarak zarf iki yana açılır.</div>
              <div>📜 <strong>Sayfa Akışı:</strong> Davetiye sayfası sinematik şekilde aşağıya doğru yumuşakça kayar.</div>
              <div>🎵 <strong>Fon Müziği:</strong> Giriş ve çıkışta yumuşak erimeyle mikslenmiş arka plan müziği.</div>
            </div>

            {/* İlerleme Çubuğu & Yüzde Göstergesi */}
            <div style={{ marginBottom: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#333" }}>
                  {videoAsama}
                </span>
                <span
                  style={{
                    fontSize: "1.05rem",
                    fontWeight: 800,
                    color: videoYuzde === 100 ? "#2e7d32" : "#673ab7",
                  }}
                >
                  %{videoYuzde}
                </span>
              </div>

              <div
                style={{
                  height: "10px",
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
              <div style={{ textAlign: "center", marginBottom: "1rem" }}>
                <video
                  key={videoHazirUrl}
                  src={videoHazirUrl}
                  controls
                  autoPlay
                  loop
                  playsInline
                  style={{
                    maxHeight: "220px",
                    width: "auto",
                    borderRadius: "10px",
                    boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
                    border: "2px solid #e0e0e0",
                    background: "#000",
                  }}
                />
              </div>
            )}

            {/* Video Altına Gelecek Açıklama Önizlemesi */}
            <div
              style={{
                background: "#f9fbf9",
                border: "1px solid #c8e6c9",
                borderRadius: "8px",
                padding: "0.6rem 0.8rem",
                marginBottom: "0.6rem",
                fontSize: "0.82rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "0.4rem",
                  color: "#2e7d32",
                  fontWeight: 700,
                  fontSize: "0.78rem",
                }}
              >
                <span>📝 Video Altı Açıklaması (Kişiye Özel Linkli):</span>
                <button
                  type="button"
                  className="btn"
                  style={{
                    padding: "0.2rem 0.5rem",
                    fontSize: "0.72rem",
                    background: "#e8f5e9",
                    borderColor: "#a5d6a7",
                    color: "#2e7d32",
                  }}
                  onClick={() => kopyala(aktifVideoMesaj, "video-caption-preview")}
                >
                  {kopyalandiUrl === "video-caption-preview" ? "✓ Kopyalandı" : "📋 Kopyala"}
                </button>
              </div>
              <pre
                style={{
                  margin: 0,
                  fontFamily: "inherit",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  lineHeight: 1.45,
                  color: "#333",
                  background: "#fff",
                  padding: "0.5rem",
                  borderRadius: "6px",
                  border: "1px solid #e0e0e0",
                  fontSize: "0.8rem",
                }}
              >
                {aktifVideoMesaj}
              </pre>
            </div>

            {/* Butonlar ve Paylaşım Seçenekleri */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {/* 1. ÖNCELİKLİ BUTON: VİDEOLU PAYLAŞ (TEK MESAJ: VİDEO + ALTI AÇIKLAMA) */}
              <button
                type="button"
                className="btn btn-eylem"
                style={{
                  background: "#25D366",
                  color: "#ffffff",
                  borderColor: "#1da851",
                  padding: "0.75rem 1rem",
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.2rem",
                  boxShadow: "0 4px 12px rgba(37, 211, 102, 0.3)",
                  cursor: "pointer",
                }}
                onClick={() => videoWhatsappGonder(aktifDavetli, false)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <span>🎬</span> {aktifDavetli ? `${aktifDavetli.ad_soyad} İçin Videolu Paylaş` : "Videolu Paylaş"}
                </div>
                <span style={{ fontSize: "0.72rem", fontWeight: 400, opacity: 0.95 }}>
                  (Metin panoya kopyalanır • Boş sohbet açılır • Videoyu sürükleyip alttaki kutuya Cmd+V ile yapıştırın)
                </span>
              </button>

              {/* 2. ALTERNATİF BUTONLAR: 1 KEZ İNDİR & SADECE METİN/LİNK */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                <a
                  href={videoHazirUrl || "/davetiye-video.mp4"}
                  download="kubranur-omur-davetiye.mp4"
                  className="btn btn-birincil"
                  style={{
                    textAlign: "center",
                    textDecoration: "none",
                    padding: "0.55rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.3rem",
                    fontSize: "0.82rem",
                    background: "#673ab7",
                    borderColor: "#512da8",
                  }}
                  title="Videoyu 1 kez bilgisayarınıza indirin"
                >
                  <span>⬇️</span> Videoyu İndir (1 Kez)
                </a>

                <button
                  type="button"
                  className="btn"
                  style={{
                    padding: "0.55rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.3rem",
                    fontSize: "0.82rem",
                    background: "#f5f5f5",
                    borderColor: "#ccc",
                    color: "#333",
                  }}
                  title="Sadece linkli metin olarak WhatsApp'ı açar"
                  onClick={() => videoWhatsappGonder(aktifDavetli, true)}
                >
                  <span>💬</span> Sadece Linkli Metin
                </button>
              </div>

              {/* 3. SIRADAKİ DAVETLİYE GEÇME BUTONU */}
              <div>
                {aktifDavetli ? (
                  <button
                    type="button"
                    className="btn"
                    style={{
                      width: "100%",
                      padding: "0.55rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.3rem",
                      fontSize: "0.82rem",
                      background: aktifDavetli.gonderildi_mi === 1 ? "#f1f8e9" : "#e3f2fd",
                      borderColor: aktifDavetli.gonderildi_mi === 1 ? "#81c784" : "#90caf9",
                      color: aktifDavetli.gonderildi_mi === 1 ? "#2e7d32" : "#1565c0",
                      fontWeight: 600,
                    }}
                    onClick={async () => {
                      const yeniDurum = !(aktifDavetli.gonderildi_mi === 1);
                      await gonderildiDegistir(aktifDavetli.id, aktifDavetli.gonderildi_mi === 1);
                      // Otomatik bir sonraki davetliye geç
                      const curIdx = davetliler.findIndex((d) => d.id === aktifDavetli.id);
                      if (curIdx >= 0 && curIdx < davetliler.length - 1) {
                        setVideoSecilenDavetli(davetliler[curIdx + 1]);
                      }
                    }}
                    title="Bu davetliyi gönderildi say ve listedeki sonraki kişiye geç"
                  >
                    <span>{aktifDavetli.gonderildi_mi === 1 ? "✓" : "☑️"}</span>
                    {aktifDavetli.gonderildi_mi === 1 ? "Gönderildi (Sonraki ➡️)" : "Gönderildi Say & Sonraki ➡️"}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn"
                    style={{
                      width: "100%",
                      padding: "0.55rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.3rem",
                      fontSize: "0.82rem",
                    }}
                    onClick={() => kopyala(aktifMesaj, "modal-sadece-metin")}
                  >
                    <span>📋</span> {kopyalandiUrl === "modal-sadece-metin" ? "✓ Kopyalandı" : "Mesajı Kopyala"}
                  </button>
                )}
              </div>

              {/* BİLDİRİM: WEB SHARE DURUMU */}
              {videoPaylasimDurumu && (
                <div
                  style={{
                    background: "#e8f5e9",
                    color: "#2e7d32",
                    padding: "0.5rem",
                    borderRadius: "8px",
                    fontSize: "0.8rem",
                    textAlign: "center",
                    fontWeight: 600,
                  }}
                >
                  {videoPaylasimDurumu}
                </div>
              )}

              {/* BİLDİRİM: METİN KOPYALANDI */}
              {videoKopyalandi && !videoPaylasimDurumu && (
                <div
                  style={{
                    background: "#e8f5e9",
                    color: "#2e7d32",
                    padding: "0.45rem",
                    borderRadius: "6px",
                    fontSize: "0.78rem",
                    textAlign: "center",
                    fontWeight: 600,
                  }}
                >
                  ✓ Davet metni panoya kopyalandı! WhatsApp açılıyor...
                </div>
              )}

              {/* MASAÜSTÜ KULLANICISI YARDIMCI REHBERİ */}
              {masaustuRehberGoster && (
                <div
                  style={{
                    background: "#f0f7f2",
                    border: "1.5px solid #a5d6a7",
                    borderRadius: "10px",
                    padding: "0.7rem 0.9rem",
                    fontSize: "0.8rem",
                    color: "#1b5e20",
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: "0.3rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <span>🎬</span> Tek Mesajda Video + Açıklama Gönderme:
                  </div>
                  <ol style={{ margin: 0, paddingLeft: "1.1rem", lineHeight: 1.5 }}>
                    <li>İndirdiğiniz videoyu WhatsApp sohbet penceresine <strong>sürükleyip bırakın</strong> (oynatılabilir video önizlemesi açılır).</li>
                    <li>WhatsApp&apos;ın videonun altında açtığı <strong>&quot;Açıklama ekle...&quot;</strong> kutusuna tıklayıp <strong>Cmd+V (Yapıştır)</strong> yapın!</li>
                    <li>Gönder&apos;e bastığınızda video ve kişiye özel davetiyeniz <strong>tek parça</strong> olarak gider (link kartı çıkmaz).</li>
                    <li>Buradan <strong>Gönderildi Say &amp; Sonraki ➡️</strong> butonuna basarak sıradaki davetliye geçin.</li>
                  </ol>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.3rem" }}>
                <button
                  type="button"
                  className="btn"
                  style={{ fontSize: "0.76rem" }}
                  disabled={videoUretiliyor}
                  onClick={() => videoUretimiBaslat(videoSecilenDavetli, true)}
                >
                  {videoUretiliyor ? "Üretiliyor…" : "🔄 Videoyu Yeniden Oluştur"}
                </button>
                <button
                  type="button"
                  className="btn"
                  style={{ fontSize: "0.76rem" }}
                  onClick={() => {
                    setVideoModalAcik(false);
                    setMasaustuRehberGoster(false);
                    setVideoPaylasimDurumu(null);
                  }}
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
