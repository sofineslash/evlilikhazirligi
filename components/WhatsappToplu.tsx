"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Davetli } from "@/lib/davetliler";
import { TARAF_ETIKET, type DavetliTaraf } from "@/lib/taraf";

type WaDurum = "kapali" | "baglaniyor" | "qr" | "bagli";
type KalemDurum =
  | "bekliyor" | "gonderiliyor" | "onay-bekliyor"
  | "gonderildi" | "atlandi" | "bulunamadi" | "hata";

type Ilerleme = {
  calisiyor: boolean;
  durum: WaDurum;
  toplam: number;
  gonderildi: number;
  kalemler: { id: string; ad: string; durum: KalemDurum; mesaj?: string }[];
  gunluk: string[];
  onayBekleyen: string | null;
  oturumVar: boolean;
};

const UC = "/api/admin/wa";

const DURUM_YAZI: Record<WaDurum, string> = {
  kapali: "Bağlı değil",
  baglaniyor: "Bağlanıyor…",
  qr: "QR bekleniyor",
  bagli: "Bağlı",
};

const KALEM_YAZI: Record<KalemDurum, string> = {
  bekliyor: "Sırada",
  gonderiliyor: "Gönderiliyor…",
  "onay-bekliyor": "Onayınız bekleniyor",
  gonderildi: "Gönderildi",
  atlandi: "Atlandı",
  bulunamadi: "Numara bulunamadı",
  hata: "Hata",
};

/**
 * WhatsApp toplu gonderim paneli.
 *
 * Tarayici SUNUCUDA calisiyor; buradan gordugumuz, o tarayicinin canli
 * ekran goruntusu. QR'i oradan okutuyoruz. Bu yuzden panel acikken
 * goruntuyu duzenli yenilemek gerekiyor.
 */
export default function WhatsappToplu({ davetliler }: { davetliler: Davetli[] }) {
  /* Taraf basina AYRI oturum: kiz tarafi kendi numarasindan, erkek tarafi
     kendi numarasindan gonderiyor. Panel hangi tarafa bakiyorsa onun
     durumunu gosterir. */
  const [taraf, setTaraf] = useState<DavetliTaraf>("gelin");
  const [ilerleme, setIlerleme] = useState<Ilerleme | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [mesgul, setMesgul] = useState(false);
  const [ekranMs, setEkranMs] = useState(0);
  const [acik, setAcik] = useState(false);

  const [belirsizlerDahil, setBelirsizlerDahil] = useState(false);
  const [mod, setMod] = useState<"onay" | "otomatik">("onay");
  const [videoGonder, setVideoGonder] = useState(true);
  const [enAz, setEnAz] = useState(25);
  const [enCok, setEnCok] = useState(60);
  const [sinir, setSinir] = useState(60);

  const gunlukRef = useRef<HTMLPreElement>(null);

  const bekleyen = davetliler.filter((d) => d.gonderildi_mi !== 1);
  const hedefler = bekleyen.filter(
    (d) => d.telefon && (d.taraf === taraf || (belirsizlerDahil && !d.taraf)),
  );
  const telefonsuz = bekleyen.filter((d) => !d.telefon && d.taraf === taraf);
  const belirsiz = bekleyen.filter((d) => !d.taraf && d.telefon);

  const yokla = useCallback(async () => {
    try {
      const c = await fetch(`${UC}?taraf=${taraf}`, { cache: "no-store" });
      if (!c.ok) return;
      setIlerleme(await c.json());
    } catch { /* ag kesintisi — bir sonraki yoklamada toparlanir */ }
  }, [taraf]);

  // Taraf degisince eski tarafin ilerlemesi ekranda kalmasin
  useEffect(() => { setIlerleme(null); setHata(null); }, [taraf]);

  /* Panel kapaliyken yoklamayi DURDUR: aksi halde admin paneli acik
     kaldigi surece saniyede bir istek gider ve sunucuda bos yere
     ekran goruntusu uretilir. */
  useEffect(() => {
    if (!acik) return;
    void yokla();
    const t = setInterval(yokla, 1500);
    return () => clearInterval(t);
  }, [acik, yokla]);

  // Ekran goruntusu yalnizca baglanti kurulana kadar ve gonderim sirasinda gerekli
  useEffect(() => {
    if (!acik) return;
    const d = ilerleme?.durum;
    if (d !== "qr" && d !== "baglaniyor" && !ilerleme?.calisiyor) return;
    const t = setInterval(() => setEkranMs(Date.now()), d === "qr" ? 1200 : 3000);
    return () => clearInterval(t);
  }, [acik, ilerleme?.durum, ilerleme?.calisiyor]);

  useEffect(() => {
    const el = gunlukRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [ilerleme?.gunluk?.length]);

  const istek = async (is: string, govde?: unknown) => {
    setHata(null);
    setMesgul(true);
    try {
      const c = await fetch(`${UC}?is=${is}&taraf=${taraf}`, {
        method: "POST",
        headers: govde ? { "content-type": "application/json" } : undefined,
        body: govde ? JSON.stringify(govde) : undefined,
      });
      const v = await c.json().catch(() => ({}));
      if (!c.ok) setHata(v.mesaj ?? "İşlem başarısız.");
      await yokla();
    } catch {
      setHata("Sunucuya ulaşılamadı.");
    } finally {
      setMesgul(false);
    }
  };

  const durum = ilerleme?.durum ?? "kapali";
  const calisiyor = ilerleme?.calisiyor ?? false;
  const onayli = ilerleme?.onayBekleyen
    ? ilerleme.kalemler.find((k) => k.id === ilerleme.onayBekleyen)
    : null;

  return (
    <section className="admin-kart">
      <h3 style={{ marginTop: 0, display: "flex", alignItems: "center", gap: ".5rem", flexWrap: "wrap" }}>
        <span>🤖</span> Toplu WhatsApp Gönderimi
      </h3>

      {/* Taraf secici — her tarafin kendi numarasi, kendi listesi */}
      <div className="wa-taraf-serit">
        {(["gelin", "damat"] as DavetliTaraf[]).map((t) => (
          <button
            key={t}
            type="button"
            className={`wa-taraf-btn${taraf === t ? " secili" : ""}`}
            onClick={() => setTaraf(t)}
          >
            {t === "gelin" ? "👰 " : "🤵 "}{TARAF_ETIKET[t]}
            {taraf === t && <span className={`wa-rozet wa-${durum}`}>{DURUM_YAZI[durum]}</span>}
          </button>
        ))}
      </div>

      {!acik ? (
        <>
          <p className="kucuk" style={{ color: "#666", marginBottom: ".8rem" }}>
            Sunucuda bir tarayıcıda WhatsApp Web açılır, QR&apos;ı telefonunuzla okutursunuz ve
            davetliler sırayla numaralarından bulunup davetiye gönderilir.
            Gönderilen kişiler &quot;Gönderilenler&quot; sekmesine taşınır.
          </p>
          <button type="button" className="btn btn-birincil" onClick={() => setAcik(true)}>
            Toplu gönderim panelini aç
          </button>
        </>
      ) : (
        <>
          <div className="wa-uyari">
            <strong>Dikkat:</strong> Toplu otomatik gönderim WhatsApp&apos;ın kullanım
            şartlarına aykırıdır ve hesabınız kısıtlanabilir. Riski azaltmak için kişiler
            arasında rastgele bekleme ve günlük üst sınır var. İlk seferde
            <strong> Onaylı</strong> modda 3-5 kişiyle deneyin.
          </div>

          {/* 1) BAĞLANTI */}
          <div className="wa-bolum">
            <h4>1. Bağlantı</h4>
            {durum === "bagli" ? (
              <>
                <p className="kucuk" style={{ color: "#2e7d32", fontWeight: 600 }}>
                  ✓ {TARAF_ETIKET[taraf]} numarası bağlı. Oturum sunucuda saklanıyor, tekrar QR istemez.
                </p>
                <button
                  type="button" className="btn" disabled={mesgul || calisiyor}
                  style={{ marginTop: ".5rem" }}
                  onClick={() => {
                    if (!confirm(
                      `${TARAF_ETIKET[taraf]} için WhatsApp oturumu kapatılsın mı?\n\n` +
                      "Kayıtlı oturum silinir; yeniden bağlanırken QR istenir ve " +
                      "farklı bir numara bağlayabilirsiniz. Bu işlem geri alınamaz.",
                    )) return;
                    void istek("cikis");
                  }}
                >
                  Çıkış yap / numarayı değiştir
                </button>
                {calisiyor && (
                  <p className="kucuk" style={{ color: "#a8462a", marginTop: ".4rem" }}>
                    Gönderim sürerken çıkış yapılamaz. Önce durdurun.
                  </p>
                )}
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="btn btn-birincil"
                  disabled={mesgul || durum === "baglaniyor" || durum === "qr"}
                  onClick={() => istek("baglan")}
                >
                  {durum === "kapali"
                    ? `${TARAF_ETIKET[taraf]} numarasına bağlan`
                    : "Bağlanılıyor…"}
                </button>
                {durum === "kapali" && ilerleme?.oturumVar && (
                  <p className="kucuk" style={{ marginTop: ".4rem", color: "#666" }}>
                    Bu taraf için kayıtlı bir oturum var — QR istemeden açılması beklenir.
                  </p>
                )}
                {durum === "qr" && (
                  <p className="kucuk" style={{ marginTop: ".5rem" }}>
                    Telefonunuzda <strong>WhatsApp &gt; Ayarlar &gt; Bağlı cihazlar &gt; Cihaz
                    bağla</strong> ile aşağıdaki kodu okutun.
                  </p>
                )}
              </>
            )}

            {(durum === "qr" || durum === "baglaniyor" || calisiyor) && ekranMs > 0 && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className="wa-ekran"
                src={`${UC}?is=ekran&taraf=${taraf}&t=${ekranMs}`}
                alt="Sunucudaki WhatsApp Web ekranı"
              />
            )}
          </div>

          {/* 2) AYARLAR */}
          <div className="wa-bolum">
            <h4>2. Ayarlar</h4>
            <div className="admin-izgara-2">
              <label className="wa-alan">
                <span>Mod</span>
                <select
                  className="admin-input"
                  value={mod}
                  onChange={(e) => setMod(e.target.value as "onay" | "otomatik")}
                  disabled={calisiyor}
                >
                  <option value="onay">Onaylı — her kişide bana sor</option>
                  <option value="otomatik">Otomatik — durmadan gönder</option>
                </select>
              </label>
              <label className="wa-alan">
                <span>Günlük üst sınır</span>
                <input
                  type="number" min={1} max={300} className="admin-input"
                  value={sinir} disabled={calisiyor}
                  onChange={(e) => setSinir(Number(e.target.value))}
                />
              </label>
              <label className="wa-alan">
                <span>En az bekleme (sn)</span>
                <input
                  type="number" min={5} max={600} className="admin-input"
                  value={enAz} disabled={calisiyor || mod === "onay"}
                  onChange={(e) => setEnAz(Number(e.target.value))}
                />
              </label>
              <label className="wa-alan">
                <span>En çok bekleme (sn)</span>
                <input
                  type="number" min={5} max={900} className="admin-input"
                  value={enCok} disabled={calisiyor || mod === "onay"}
                  onChange={(e) => setEnCok(Number(e.target.value))}
                />
              </label>
            </div>
            <label className="wa-onay">
              <input
                type="checkbox" checked={videoGonder} disabled={calisiyor}
                onChange={(e) => setVideoGonder(e.target.checked)}
              />
              <span>Davetiye videosunu da gönder (kapalıysa yalnızca metin gider)</span>
            </label>
            {belirsiz.length > 0 && (
              <label className="wa-onay">
                <input
                  type="checkbox" checked={belirsizlerDahil} disabled={calisiyor}
                  onChange={(e) => setBelirsizlerDahil(e.target.checked)}
                />
                <span>
                  Tarafı atanmamış {belirsiz.length} davetli de bu numaradan gönderilsin
                </span>
              </label>
            )}
          </div>

          {/* 3) GÖNDERİM */}
          <div className="wa-bolum">
            <h4>3. Gönderim</h4>
            <p className="kucuk" style={{ color: "#666" }}>
              {TARAF_ETIKET[taraf]} · Gönderilecek: <strong>{hedefler.length}</strong> davetli
              {telefonsuz.length > 0 && ` · ${telefonsuz.length} kişinin telefonu yok, atlanacak`}
              {" "}· Zaten gönderilmiş olanlara <strong>tekrar gönderilmez</strong>.
            </p>

            <div className="butonlar" style={{ justifyContent: "flex-start", marginTop: ".6rem" }}>
              <button
                type="button"
                className="btn btn-birincil"
                disabled={mesgul || calisiyor || durum !== "bagli" || hedefler.length === 0}
                onClick={() =>
                  istek("gonder", {
                    mod, videoGonder, belirsizlerDahil,
                    enAzBekleme: enAz, enCokBekleme: enCok, gunlukSinir: sinir,
                  })
                }
              >
                {calisiyor ? "Gönderim sürüyor…" : `Gönderimi başlat (${hedefler.length})`}
              </button>
              {calisiyor && (
                <button type="button" className="btn" disabled={mesgul} onClick={() => istek("dur")}>
                  Durdur
                </button>
              )}
            </div>

            {durum !== "bagli" && (
              <p className="kucuk" style={{ color: "#a8462a", marginTop: ".5rem" }}>
                Önce WhatsApp bağlantısını kurun.
              </p>
            )}
            {hata && <p className="hata kucuk" style={{ marginTop: ".5rem" }}>{hata}</p>}
          </div>

          {/* ONAY KUTUSU */}
          {onayli && (
            <div className="wa-onay-kutu">
              <p>
                <strong>{onayli.ad}</strong> için mesaj hazır. Sunucudaki ekranda kontrol edip
                karar verin.
              </p>
              <div className="butonlar" style={{ justifyContent: "flex-start" }}>
                <button type="button" className="btn btn-birincil" disabled={mesgul}
                        onClick={() => istek("onay", { cevap: "gonder" })}>
                  Gönder
                </button>
                <button type="button" className="btn" disabled={mesgul}
                        onClick={() => istek("onay", { cevap: "atla" })}>
                  Atla
                </button>
                <button type="button" className="btn" disabled={mesgul}
                        onClick={() => istek("onay", { cevap: "dur" })}>
                  Durdur
                </button>
              </div>
            </div>
          )}

          {/* İLERLEME */}
          {ilerleme && ilerleme.toplam > 0 && (
            <div className="wa-bolum">
              <h4>
                İlerleme — {ilerleme.gonderildi}/{ilerleme.toplam}
              </h4>
              <span className="an-bar" role="progressbar"
                    aria-valuenow={ilerleme.gonderildi} aria-valuemin={0} aria-valuemax={ilerleme.toplam}>
                <span
                  className="an-bar-dolu"
                  style={{ width: `${Math.round((ilerleme.gonderildi / ilerleme.toplam) * 100)}%` }}
                />
              </span>

              <ul className="wa-liste">
                {ilerleme.kalemler
                  .filter((k) => k.durum !== "bekliyor")
                  .slice(-40)
                  .map((k) => (
                    <li key={k.id} className={`wa-kalem wa-k-${k.durum}`}>
                      <span>{k.ad}</span>
                      <span className="kucuk">{k.mesaj ?? KALEM_YAZI[k.durum]}</span>
                    </li>
                  ))}
              </ul>

              {ilerleme.gunluk.length > 0 && (
                <pre className="wa-gunluk" ref={gunlukRef}>{ilerleme.gunluk.join("\n")}</pre>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
