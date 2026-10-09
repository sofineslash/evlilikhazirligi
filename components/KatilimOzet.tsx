import type { Davetli } from "@/lib/davetliler";

type Kayit = { geliyor: number; kisi_sayisi: number };

/**
 * Davetli ve katilim ozeti.
 *
 * Iki ayri kaynak var ve karistirilmamali:
 *  - davetliler : kisiye ozel link gonderilen liste (RSVP buradan gelir)
 *  - katilimlar : davetiyedeki genel "Katılmak istiyorum" formu
 * Ikisini tek sayida toplamak ayni kisiyi iki kez saydirabilir, bu yuzden
 * ayri bloklarda gosteriliyor.
 */
export default function KatilimOzet({
  davetliler,
  kayitlar,
}: {
  davetliler: Davetli[];
  kayitlar: Kayit[];
}) {
  const say = (f: (d: Davetli) => boolean) => davetliler.filter(f).length;
  const kisi = (f: (d: Davetli) => boolean) =>
    davetliler.filter(f).reduce((t, d) => t + (d.kisi_sayisi || 1), 0);

  const toplam = davetliler.length;
  const gonderildi = say((d) => d.gonderildi_mi === 1);
  /* Yalnizca HENUZ GONDERILMEMIS olanlar sayilir: gonderilmis birinin
     telefonunun olmamasi (orn. yonlendirmeyle eklenenler) bir engel
     degil, uyari olarak gostermek yanlis alarm olurdu. */
  const telefonsuz = say((d) => !d.telefon && d.gonderildi_mi !== 1);
  const acan = say((d) => d.acilma_sayisi > 0);
  const geliyor = say((d) => d.durum === "geliyor");
  const gelemiyor = say((d) => d.durum === "gelemiyor");
  const belirsiz = say((d) => d.durum === "belirsiz");
  const bekliyor = say((d) => d.durum === "bekliyor");
  const gelenKisi = kisi((d) => d.durum === "geliyor");

  const formGeliyor = kayitlar.filter((k) => k.geliyor === 1);
  const formKisi = formGeliyor.reduce((t, k) => t + (k.kisi_sayisi || 1), 0);

  /* Yuzde, PAYDA SIFIRKEN NaN verir; 0 davetliyle panel "NaN%" gosterirdi. */
  const yuzde = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0);

  const Kutu = ({
    etiket, deger, alt, vurgu,
  }: { etiket: string; deger: string | number; alt?: string; vurgu?: "iyi" | "kotu" | "ara" }) => (
    <div className={`ozet-kutu${vurgu ? " ozet-" + vurgu : ""}`}>
      <span className="ozet-deger">{deger}</span>
      <span className="ozet-etiket">{etiket}</span>
      {alt && <span className="ozet-alt">{alt}</span>}
    </div>
  );

  return (
    <div className="admin-whatsapp-bolum">
      <section className="admin-kart">
        <h3 style={{ marginTop: 0 }}>📨 Davet gönderimi</h3>
        <div className="ozet-izgara">
          <Kutu etiket="Davetli" deger={toplam} />
          <Kutu etiket="Gönderildi" deger={gonderildi} alt={`%${yuzde(gonderildi, toplam)}`} vurgu="iyi" />
          <Kutu etiket="Bekleyen" deger={toplam - gonderildi} vurgu={toplam - gonderildi > 0 ? "ara" : undefined} />
          <Kutu etiket="Davetiyeyi açan" deger={acan} alt={`gönderilenin %${yuzde(acan, gonderildi)}'i`} />
        </div>
        {telefonsuz > 0 && (
          <p className="kucuk" style={{ marginTop: ".6rem", color: "#a8462a" }}>
            ⚠ {telefonsuz} davetlinin telefonu yok — toplu gönderime dâhil edilemez.
          </p>
        )}
      </section>

      <section className="admin-kart">
        <h3 style={{ marginTop: 0 }}>✅ Katılım durumu (kişiye özel linkler)</h3>
        <div className="ozet-izgara">
          <Kutu etiket="Katılacak" deger={geliyor} alt={`${gelenKisi} kişi`} vurgu="iyi" />
          <Kutu etiket="Katılamayacak" deger={gelemiyor} vurgu="kotu" />
          <Kutu etiket="Net değil" deger={belirsiz} vurgu="ara" />
          <Kutu etiket="Yanıt yok" deger={bekliyor} />
        </div>
        <p className="kucuk" style={{ marginTop: ".6rem", color: "#666" }}>
          Yanıt oranı: %{yuzde(geliyor + gelemiyor + belirsiz, toplam)} ·
          {" "}Beklenen misafir sayısı: <strong>{gelenKisi}</strong>
        </p>
      </section>

      {kayitlar.length > 0 && (
        <section className="admin-kart">
          <h3 style={{ marginTop: 0 }}>📝 Genel formdan gelenler</h3>
          <div className="ozet-izgara">
            <Kutu etiket="Kayıt" deger={kayitlar.length} />
            <Kutu etiket="Katılacak" deger={formGeliyor.length} alt={`${formKisi} kişi`} vurgu="iyi" />
            <Kutu etiket="Katılamayacak" deger={kayitlar.filter((k) => k.geliyor === 0).length} vurgu="kotu" />
          </div>
          <p className="kucuk" style={{ marginTop: ".6rem", color: "#666" }}>
            Bunlar davetiyedeki genel &quot;Katılmak istiyorum&quot; formundan geliyor; kişiye özel
            linki olmayan misafirler burada görünür. Aynı kişi iki listede de olabilir, bu yüzden
            sayılar toplanmıyor.
          </p>
        </section>
      )}
    </div>
  );
}
