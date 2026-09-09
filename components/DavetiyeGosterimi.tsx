import { CFG, TARIH_METNI, SAAT_METNI, haritaLinkleri, gunModu } from "@/lib/config";
import { sahneYolu } from "@/lib/sahneler";
import { metin, ebeveynSatirlari } from "@/lib/metin";
import Zarf from "@/components/Zarf";
import AltinCerceve from "@/components/AltinCerceve";
import IsimUydur from "@/components/IsimUydur";
import KatilimButonu from "@/components/KatilimButonu";
import FotoYukleButonu from "@/components/FotoYukleButonu";
import { yuklemeAcikMi, YUKLEME_MESAJI } from "@/lib/yukleme";
import { galeriAcikMi } from "@/lib/galeri";
import { anlariListele } from "@/lib/anlar";
import GaleriButonu from "@/components/GaleriButonu";
import MuzikCalar from "@/components/MuzikCalar";
import { muzikDurumu } from "@/lib/muzik";
import KapiAcilis from "@/components/KapiAcilis";
import Tema2Dizilim from "@/components/Tema2Dizilim";
import { yayindakiHatiraNotlari } from "@/lib/hatira";
import DavetliGoruntulendiIzleyici from "./DavetliGoruntulendiIzleyici";
import WhatsappPaylasButonu from "./WhatsappPaylasButonu";
import { davetliGetirToken } from "@/lib/davetliler";
import { misafirAdiFormatla, whatsappMesajiUret } from "@/lib/whatsapp";
import { siteUrl, DEFAULT_DAVETIYE_SLUG } from "@/lib/site";

export type DavetiyeGosterimiProps = {
  slug?: string;
  token?: string;
  guest?: string;
};

export default function DavetiyeGosterimi({
  slug,
  token,
  guest,
}: DavetiyeGosterimiProps) {
  const harita = haritaLinkleri();
  const yuklemeAcik = yuklemeAcikMi();
  const mod = gunModu();
  const kapakYolu = sahneYolu("01-kapak");
  const ciftYolu = sahneYolu("02-cift");
  const gelinPng = sahneYolu("06-gelin");
  const damatPng = sahneYolu("07-damat");

  const sayi = (a: Parameters<typeof metin>[0], vars: number, alt: number, ust: number) => {
    const n = Number(metin(a));
    return Number.isFinite(n) ? Math.min(ust, Math.max(alt, n)) : vars;
  };
  const kartBeyaz = sayi("kart_beyaz", 62, 40, 100);
  const kartBlur = sayi("kart_blur", 16, 0, 30);

  const damat = ebeveynSatirlari(
    metin("damat_anne_ad"), metin("damat_anne_soyad"),
    metin("damat_baba_ad"), metin("damat_baba_soyad"),
    (metin("damat_bicim") || "birlikte") as "birlikte" | "ayri",
  );
  const gelin = ebeveynSatirlari(
    metin("gelin_anne_ad"), metin("gelin_anne_soyad"),
    metin("gelin_baba_ad"), metin("gelin_baba_soyad"),
    (metin("gelin_bicim") || "birlikte") as "birlikte" | "ayri",
  );
  const gelinAd = metin("gelin_ad") || CFG.GELIN;
  const damatAd = metin("damat_ad") || CFG.DAMAT;
  const tel = metin("iletisim_tel");

  const basHarf = (ad: string) => (ad.trim()[0] ?? "").toLocaleUpperCase("tr");
  const zarfSatir = metin("zarf_toren");
  const zarfDavet = metin("zarf_notu");
  const davetCumlesi = metin("davet_cumlesi");
  const yemek = metin("yemek_notu");
  const otopark = metin("otopark_notu");
  const fotoNotu = metin("foto_notu");

  const galeriAcik = galeriAcikMi();
  const anlar = galeriAcik
    ? anlariListele(200).filter((a) => a.gizli === 0).map((a) => ({ id: a.id, yukleyen: a.yukleyen }))
    : [];

  const tema = metin("tema_secimi") || "tema1";
  const muzikAktif = metin("muzik_acik") !== "kapali";
  const muzik = muzikDurumu();

  const hatiraNotlari = yayindakiHatiraNotlari();

  // Davetli ve kisiye ozel misafir cozumleme
  let misafirAd = "";
  let izinliKisi: number = CFG.KISI_MAX;

  if (token) {
    const davetli = davetliGetirToken(token);
    if (davetli) {
      misafirAd = davetli.ad_soyad;
      izinliKisi = davetli.izinli_kisi_sayisi || 1;
    }
  }

  if (!misafirAd && guest) {
    misafirAd = misafirAdiFormatla(guest);
  }

  // Paylasim URL'si ve WhatsApp mesaji uretimi
  const aktifSlug = slug || metin("davetiye_slug") || DEFAULT_DAVETIYE_SLUG;
  let paylasimQuery = "";
  if (token) {
    paylasimQuery = `?g=${encodeURIComponent(token)}`;
  } else if (guest) {
    paylasimQuery = `?guest=${encodeURIComponent(guest)}`;
  }
  const paylasimUrl = siteUrl(`/davet/${aktifSlug}${paylasimQuery}`);

  const ozelSablon = metin("whatsapp_mesaj");
  const whatsappMesaj = whatsappMesajiUret({
    sablon: ozelSablon,
    gelin: gelinAd,
    damat: damatAd,
    tarih: TARIH_METNI,
    saat: SAAT_METNI,
    salon: CFG.SALON_AD,
    url: paylasimUrl,
    misafir: misafirAd || undefined,
  });

  return (
    <>
      {/* Gercek kullanici tarayicisinda goruntulenme takibi */}
      {token && <DavetliGoruntulendiIzleyici token={token} />}

      {/* FON MÜZİĞİ — İki temada da çalar */}
      <MuzikCalar
        aktif={muzikAktif && muzik.var}
        sesDosyasi={muzik.url || "/api/muzik/ses"}
      />

      {tema === "tema2" ? (
        /* ================= TEMA 2 — SARAY KAPISI AÇILIŞI & ÖZEL DİZİLİM ================= */
        <KapiAcilis
          gelinAd={gelinAd}
          damatAd={damatAd}
          solHarf={basHarf(gelinAd)}
          sagHarf={basHarf(damatAd)}
        >
          <Tema2Dizilim
            gelinAd={gelinAd}
            damatAd={damatAd}
            davetCumlesi={davetCumlesi}
            gelin={gelin}
            damat={damat}
            tel={tel}
            yemek={yemek}
            otopark={otopark}
            fotoNotu={fotoNotu}
            yuklemeAcik={yuklemeAcik}
            galeriAcik={galeriAcik}
            ciftYolu={ciftYolu}
            gelinPng={gelinPng}
            damatPng={damatPng}
            kartBeyaz={kartBeyaz}
            kartBlur={kartBlur}
            anlar={anlar}
            hatiraNotlari={hatiraNotlari}
            misafirAd={misafirAd}
            token={token}
            izinliKisi={izinliKisi}
            paylasimUrl={paylasimUrl}
            whatsappMesaj={whatsappMesaj}
          />
        </KapiAcilis>
      ) : (
        /* ================= TEMA 1 — MEVCUT 3B ZARF (DOKUNULMAMIŞ) ================= */
        <Zarf
          solHarf={basHarf(gelinAd)}
          sagHarf={basHarf(damatAd)}
          satir={zarfSatir}
          davet={zarfDavet}
          fon={kapakYolu}
        >
          <div
            className="kapak-dis"
            style={{ "--kart-beyaz": kartBeyaz, "--kart-blur": kartBlur } as React.CSSProperties}
          >
            <AltinCerceve className="kapak" fon={ciftYolu}>
              <header>
                {misafirAd && (
                  <div className="tema2-misafir-karsilama" style={{ marginBottom: "1rem" }}>
                    <span className="tema2-misafir-ikon" aria-hidden="true">💌</span>
                    <div className="tema2-misafir-metinler">
                      <span className="tema2-misafir-hitap">Sayın {misafirAd},</span>
                      <span className="tema2-misafir-cumle">Özel günümüzde sizleri de aramızda görmekten onur duyarız.</span>
                    </div>
                  </div>
                )}

                <div className="isim-alani">
                  {(gelinPng || damatPng) && (
                    <div className="isim-arkasi" aria-hidden="true">
                      {gelinPng && <img className="kose-png kose-sol" src={gelinPng} alt="" />}
                      {damatPng && <img className="kose-png kose-sag" src={damatPng} alt="" />}
                    </div>
                  )}
                  <h1 className="isimler isimler-script bel bel-1">
                    {gelinAd} <span className="ve">&amp;</span> {damatAd}
                  </h1>
                </div>
                <IsimUydur />

                {davetCumlesi && <p className="davet-cumlesi bel bel-2">{davetCumlesi}</p>}

                {/* Aileler: SOLDA kiz tarafi (gelin), SAGDA erkek tarafi (damat) */}
                {(gelin.satirlar.length > 0 || damat.satirlar.length > 0) && (
                  <div className="aileler bel bel-2">
                    {gelin.satirlar.length > 0 && (
                      <div className="aile-sutun">
                        {gelin.satirlar.map((satir, i) => (
                          <span key={i} className={gelin.ortakSoyad && i === 1 ? "aile-soyad" : ""}>
                            {satir}
                          </span>
                        ))}
                      </div>
                    )}
                    {damat.satirlar.length > 0 && (
                      <div className="aile-sutun">
                        {damat.satirlar.map((satir, i) => (
                          <span key={i} className={damat.ortakSoyad && i === 1 ? "aile-soyad" : ""}>
                            {satir}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <p className="tarih bel bel-3">
                  {mod === "gun" ? <strong>Bugün!</strong> : TARIH_METNI} ·{" "}
                  <span className="saat">{SAAT_METNI}</span>
                </p>
                <p className="salon bel bel-3">{CFG.SALON_AD}</p>
                <p className="salon-adres bel bel-3">{CFG.SALON_ADRES}</p>

                {/* Tek sutun: haritalar yan yana, altinda tek tek digerleri */}
                <div className="eylemler bel bel-4">
                  <div className="harita-ikili">
                    <a className="btn" href={harita.google} target="_blank" rel="noreferrer">
                      Google Haritalar
                    </a>
                    <a className="btn" href={harita.apple} target="_blank" rel="noreferrer">
                      Apple Haritalar
                    </a>
                  </div>
                  <a className="btn btn-birincil" href="/api/ics">
                    Takvime ekle
                  </a>
                  <KatilimButonu
                    tel={tel}
                    varsayilanAd={misafirAd}
                    token={token}
                    izinliKisi={izinliKisi}
                  />
                  <WhatsappPaylasButonu url={paylasimUrl} mesaj={whatsappMesaj} />
                  <FotoYukleButonu acik={yuklemeAcik} mesaj={YUKLEME_MESAJI} />
                  {galeriAcik && <GaleriButonu anlar={anlar} />}
                  {fotoNotu && <p className="foto-notu">{fotoNotu}</p>}
                </div>
              </header>
            </AltinCerceve>
          </div>
        </Zarf>
      )}
    </>
  );
}
