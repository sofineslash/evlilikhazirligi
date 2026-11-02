import AnilarSlayt, { type SlaytOge } from "@/components/AnilarSlayt";
import FotoYukleButonu from "@/components/FotoYukleButonu";
import type { EtkinlikTur } from "@/lib/asama";
import { SONRA_BASLIK, paragraflar } from "@/lib/sonrasi-metin";

/**
 * «Sonrası» sayfası — nişanlandık / evlendik.
 *
 * Misafirlere teşekkür, fotoğraf slaytı ve mozaik. Davetiyenin yerine geçer:
 * artık katılım sorulmaz, tarih/salon/geri sayım yoktur.
 *
 * SUNUCU bileşeni: veriyi hazır alır, yalnızca slayt etkileşimi istemcide.
 */
export default function SonrasiSayfa({
  tur,
  gelinAd,
  damatAd,
  tarihKisa,
  ciftYolu,
  tesekkur,
  misafirAd,
  ogeler,
  galeriKapali,
  yoneticiyim,
  yuklemeAcik,
  yuklemeMesaji,
}: {
  tur: EtkinlikTur;
  gelinAd: string;
  damatAd: string;
  tarihKisa: string | null;
  ciftYolu: string | null;
  tesekkur: string;
  misafirAd: string;
  ogeler: SlaytOge[];
  /** Galeri misafire kapalı — fotoğraflar sunucudan zaten verilmiyor. */
  galeriKapali: boolean;
  /** Yalnızca yönetici/önizleme: kapalı galeri ipucunu gösterir. */
  yoneticiyim: boolean;
  yuklemeAcik: boolean;
  yuklemeMesaji: string;
}) {
  const baslik = SONRA_BASLIK[tur];
  const paragraf = paragraflar(tesekkur);
  const isimler = `${gelinAd} & ${damatAd}`.toLocaleUpperCase("tr");

  return (
    <main className="sn" data-tur={tur}>
      {/* ------------------------------------------------ KAHRAMAN */}
      <header className="sn-hero">
        {ciftYolu && <div className="sn-hero-zemin" aria-hidden="true" style={{ backgroundImage: `url(${ciftYolu})` }} />}
        <div className="sn-hero-perde" aria-hidden="true" />
        <div className="sn-parilti" aria-hidden="true">
          {Array.from({ length: 9 }).map((_, i) => <i key={i} style={{ ["--i" as string]: i } as React.CSSProperties} />)}
        </div>

        <div className="sn-hero-ic">
          {ciftYolu && (
            <div className="sn-kemer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ciftYolu} alt={`${gelinAd} ve ${damatAd}`} />
            </div>
          )}

          <div className="sn-hero-yazi">
            <div className="sn-orn" aria-hidden="true"><i /><b>❖</b><i /></div>
            {tarihKisa && <p className="sn-tarih">{tarihKisa.toLocaleUpperCase("tr")}</p>}
            <h1 className="sn-baslik">{baslik}</h1>
            <p className="sn-isimler">{isimler}</p>
            <a className="sn-kaydir" href="#tesekkur">
              Teşekkür ederiz <span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------ TEŞEKKÜR */}
      <section className="sn-bolum" id="tesekkur" aria-labelledby="sn-tesekkur-b">
        <div className="sn-tesekkur-kart">
          <div className="sn-orn sn-orn-koyu" aria-hidden="true"><i /><b>❖</b><i /></div>
          <h2 id="sn-tesekkur-b" className="sn-bolum-baslik">Teşekkür Ederiz</h2>
          {misafirAd && <p className="sn-selam">Sayın <strong>{misafirAd}</strong>,</p>}
          {paragraf.map((p, i) => <p key={i} className="sn-metin">{p}</p>)}
          <p className="sn-imza">
            <span>Sevgiyle,</span>
            <em>{gelinAd} &amp; {damatAd}</em>
          </p>
        </div>
      </section>

      {/* ------------------------------------------------ ANILAR */}
      {ogeler.length > 0 && (
        <section className="sn-bolum sn-anilar" id="anilar" aria-labelledby="sn-anilar-b">
          <h2 id="sn-anilar-b" className="sn-bolum-baslik sn-acik">Anılarımız</h2>
          <p className="sn-bolum-alt">Bu özel günde bizimle paylaştığınız kareler.</p>
          <AnilarSlayt ogeler={ogeler} />
        </section>
      )}

      {/* Galeri kapalıyken fotoğraflar sunucudan hiç verilmez; yönetici bunu
          boş bir sayfa sanıp "bozuk" demesin diye yalnızca ona söylüyoruz. */}
      {ogeler.length === 0 && galeriKapali && yoneticiyim && (
        <section className="sn-bolum">
          <p className="sn-yonetici" role="note">
            🔒 <strong>Yalnızca yönetici görür:</strong> Galeri misafirlere kapalı olduğu için fotoğraf slaytı
            burada gösterilmiyor. Açmak için <em>Genel Ayarlar → Galeri → Açık</em> seç.
          </p>
        </section>
      )}

      {yuklemeAcik && (
        <section className="sn-bolum sn-paylas">
          <p className="sn-bolum-alt">Siz de çektiğiniz kareleri bizimle paylaşın.</p>
          <FotoYukleButonu acik={yuklemeAcik} mesaj={yuklemeMesaji} />
        </section>
      )}

      <footer className="sn-ayak">
        <div className="sn-orn" aria-hidden="true"><i /><b>❖</b><i /></div>
        <p>{gelinAd} &amp; {damatAd}{tarihKisa ? ` · ${tarihKisa}` : ""}</p>
      </footer>
    </main>
  );
}
