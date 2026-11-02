import { CFG } from "@/lib/config";
import { sahneYolu } from "@/lib/sahneler";
import { metin, ebeveynSatirlari } from "@/lib/metin";
import Zarf from "@/components/Zarf";
import AltinCerceve from "@/components/AltinCerceve";
import IsimUydur from "@/components/IsimUydur";
import KatilimButonu from "@/components/KatilimButonu";
import FotoYukleButonu from "@/components/FotoYukleButonu";
import { yuklemeAcikMi, yuklemeMesaji } from "@/lib/yukleme";
import { galeriAcikMi } from "@/lib/galeri";
import { anlariListele } from "@/lib/anlar";
import GaleriButonu from "@/components/GaleriButonu";
import MuzikCalar from "@/components/MuzikCalar";
import { muzikDurumu } from "@/lib/muzik";
import KapiAcilis from "@/components/KapiAcilis";
import Tema2Dizilim from "@/components/Tema2Dizilim";
import Tema3SacredGarden from "@/components/tema3/Tema3SacredGarden";
import { yayindakiHatiraNotlari } from "@/lib/hatira";
import DavetliGoruntulendiIzleyici from "./DavetliGoruntulendiIzleyici";
import WhatsappPaylasButonu from "./WhatsappPaylasButonu";
import { davetliGetirToken } from "@/lib/davetliler";
import { misafirAdiFormatla, whatsappMesajiUret } from "@/lib/whatsapp";
import { siteUrl, DEFAULT_DAVETIYE_SLUG } from "@/lib/site";
import { adminMi } from "@/lib/admin";
import { dugunMu, sonrasiMi, turu } from "@/lib/asama";
import { asamaCoz, etkinlikOku, gunModuEtkinlik, takvimOlayi } from "@/lib/etkinlik";
import { VARSAYILAN_TESEKKUR } from "@/lib/sonrasi-metin";
import KinaBolumu from "@/components/KinaBolumu";
import SonrasiSayfa from "@/components/SonrasiSayfa";
import AsamaSerit from "@/components/AsamaSerit";
import type { SlaytOge } from "@/components/AnilarSlayt";

export type DavetiyeGosterimiProps = {
  slug?: string;
  token?: string;
  guest?: string;
  temaOzel?: string;
  videoModu?: boolean;
  /** ?asama= ile onizleme (yalnizca gelistirmede ya da yonetici icin gecerli). */
  asamaOzel?: string;
};

/** Bos birakilirsa dugun davet cumlesi. Nisan icin davet_cumlesi aynen kullanilir. */
const DUGUN_DAVET_VARSAYILAN = "Düğünümüzde sizleri de aramızda görmekten mutluluk duyarız.";

export default async function DavetiyeGosterimi({
  slug,
  token,
  guest,
  temaOzel,
  videoModu,
  asamaOzel,
}: DavetiyeGosterimiProps) {
  const { asama, onizleme } = await asamaCoz(asamaOzel);
  const etk = etkinlikOku(asama);
  const dugun = dugunMu(asama);
  const harita = etk.harita;
  const yuklemeAcik = yuklemeAcikMi();
  const mod = gunModuEtkinlik(etk);
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
  const zarfSatir = dugun ? "Düğün törenimizde" : metin("zarf_toren");
  const zarfDavet = metin("zarf_notu");
  const davetCumlesi = dugun
    ? metin("dugun_davet_cumlesi") || DUGUN_DAVET_VARSAYILAN
    : metin("davet_cumlesi");
  const yemek = metin("yemek_notu");
  const otopark = metin("otopark_notu");
  const fotoNotu = metin("foto_notu");

  const galeriAcik = galeriAcikMi();
  const anlar = galeriAcik
    ? anlariListele(200).filter((a) => a.gizli === 0).map((a) => ({ id: a.id, yukleyen: a.yukleyen }))
    : [];

  const tema = temaOzel || metin("tema_secimi") || "tema1";
  const muzikAktif = metin("muzik_acik") !== "kapali";
  const muzik = muzikDurumu();

  const hatiraNotlari = yayindakiHatiraNotlari();

  // Tema 3'e ozel alanlar
  const tema3Baslik = metin("tema3_baslik");
  const tema3AskSozu = metin("tema3_ask_sozu");
  const tema3KiyafetKodu = metin("tema3_kiyafet_kodu");
  const tema3HediyeNotu = metin("tema3_hediye_notu");

  // Davetli ve kisiye ozel misafir cozumleme
  let misafirAd = "";
  let izinliKisi: number = CFG.KISI_MAX;
  let oncekiRsvp: { ad: string; durum: string; kisi: number } | undefined = undefined;

  if (token) {
    const davetli = davetliGetirToken(token);
    if (davetli) {
      misafirAd = davetli.ad_soyad;
      if (davetli.rsvp_tarihi) {
        oncekiRsvp = {
          ad: davetli.ad_soyad,
          durum: davetli.durum,
          kisi: davetli.kisi_sayisi,
        };
      }
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
    tarih: etk.tarih?.metin ?? "",
    saat: etk.tarih?.saatMetni ?? "",
    salon: etk.salonAd,
    url: paylasimUrl,
    misafir: misafirAd || undefined,
  });

  /* Onizleme seridi: yalniz ?asama= ile bakilinca. Ziyaretcide render edilmez,
     yani nisan oncesi cikti degismez. */
  const serit = onizleme ? <AsamaSerit asama={asama} eksik={dugun ? etk.eksik : []} /> : null;

  /* ============ SONRASI: Nişanlandık / Evlendik ============
     Davetiyenin yerine geçer: katılım sorulmaz, tarih/salon/geri sayım yok. */
  if (sonrasiMi(asama)) {
    const tur = turu(asama);
    const tesekkur =
      metin(tur === "dugun" ? "dugun_sonra_tesekkur" : "nisan_sonra_tesekkur") ||
      VARSAYILAN_TESEKKUR[tur];

    /* Galeri kapaliyken /api/an/* misafire 404 doner; bu yuzden liste de
       BOS gonderilir (kirik gorsel yerine bolum hic cizilmez). Kronolojik:
       eskiden yeniye — aksam baslangictan sona dogru akar. */
    const ogeler: SlaytOge[] = galeriAcik
      ? anlariListele(500)
          .filter((a) => a.gizli === 0)
          .reverse()
          .map((a) => ({ id: a.id, tur: a.tur, yukleyen: a.yukleyen, g: a.genislik, y: a.yukseklik }))
      : [];
    const yoneticiyim = onizleme || (await adminMi());

    return (
      <>
        {token && <DavetliGoruntulendiIzleyici token={token} />}
        <MuzikCalar aktif={muzikAktif && muzik.var} sesDosyasi={muzik.url || "/api/muzik/ses"} />
        <SonrasiSayfa
          tur={tur}
          gelinAd={gelinAd}
          damatAd={damatAd}
          tarihKisa={etk.tarih?.kisa ?? null}
          ciftYolu={ciftYolu}
          tesekkur={tesekkur}
          misafirAd={misafirAd}
          ogeler={ogeler}
          galeriKapali={!galeriAcik}
          yoneticiyim={yoneticiyim}
          yuklemeAcik={yuklemeAcik}
          yuklemeMesaji={yuklemeMesaji()}
        />
        {serit}
      </>
    );
  }

  return (
    <>
      {/* Gercek kullanici tarayicisinda goruntulenme takibi */}
      {token && <DavetliGoruntulendiIzleyici token={token} />}

      {/* FON MÜZİĞİ — Tema 1 ve Tema 2'de çalar (Tema 3 kendi video/audio sekansıyla entegre oynatır) */}
      {tema !== "tema3" && (
        <MuzikCalar
          aktif={muzikAktif && muzik.var}
          sesDosyasi={muzik.url || "/api/muzik/ses"}
        />
      )}

      {tema === "tema3" ? (
        /* ================= TEMA 3 — THE SACRED GARDEN (LÜKS VİDEO AÇILIŞ & KUĞU BAHÇESİ) ================= */
        <Tema3SacredGarden
          gelinAd={gelinAd}
          damatAd={damatAd}
          davetCumlesi={davetCumlesi}
          tepeBaslik={tema3Baslik || (dugun ? etk.kicker : "")}
          askSozu={tema3AskSozu}
          kiyafetKodu={tema3KiyafetKodu}
          hediyeNotu={tema3HediyeNotu}
          gelin={gelin}
          damat={damat}
          tel={tel}
          yemek={yemek}
          otopark={otopark}
          fotoNotu={fotoNotu}
          yuklemeAcik={yuklemeAcik}
          yuklemeMesaji={yuklemeMesaji()}
          galeriAcik={galeriAcik}
          ciftYolu={ciftYolu}
          anlar={anlar}
          misafirAd={misafirAd}
          token={token}
          izinliKisi={izinliKisi}
          oncekiRsvp={oncekiRsvp}
          paylasimUrl={paylasimUrl}
          whatsappMesaj={whatsappMesaj}
          muzikUrl={muzikAktif && muzik.url ? muzik.url : "/tema3/muzik.mp3"}
          {...(dugun
            ? {
                salonAd: etk.salonAd,
                salonAdres: etk.salonAdres,
                harita: etk.harita,
                hedefTarih: etk.tarih?.iso,
                geriSayimGoster: !!etk.tarih,
                programGoster: false,
              }
            : {})}
        />
      ) : tema === "tema2" ? (
        /* ================= TEMA 2 — SARAY KAPISI AÇILIŞI & ÖZEL DİZİLİM ================= */
        <KapiAcilis
          gelinAd={gelinAd}
          damatAd={damatAd}
          solHarf={basHarf(gelinAd)}
          sagHarf={basHarf(damatAd)}
          misafirAd={misafirAd}
          videoModu={videoModu}
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
            oncekiRsvp={oncekiRsvp}
            paylasimUrl={paylasimUrl}
            whatsappMesaj={whatsappMesaj}
            etk={etk}
            takvimOlay={takvimOlayi(etk, gelinAd, damatAd)}
            icsYol={onizleme ? `/takvim.ics?asama=${asama}` : "/takvim.ics"}
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
                        {gelin.parcali.map((p, i) => (
                          <span key={i}>
                            {p.ad}
                            {p.ad && p.soyad ? " " : ""}
                            {p.soyad && <span className="aile-soyad">{p.soyad}</span>}
                          </span>
                        ))}
                      </div>
                    )}
                    {damat.satirlar.length > 0 && (
                      <div className="aile-sutun">
                        {damat.parcali.map((p, i) => (
                          <span key={i}>
                            {p.ad}
                            {p.ad && p.soyad ? " " : ""}
                            {p.soyad && <span className="aile-soyad">{p.soyad}</span>}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {etk.tarih && (
                  <p className="tarih bel bel-3">
                    {mod === "gun" ? <strong>Bugün!</strong> : etk.tarih.metin} ·{" "}
                    <span className="saat">{etk.tarih.saatMetni}</span>
                  </p>
                )}
                {etk.salonAd && <p className="salon bel bel-3">{etk.salonAd}</p>}
                {etk.salonAdres && <p className="salon-adres bel bel-3">{etk.salonAdres}</p>}
                {etk.kina && <KinaBolumu kina={etk.kina} />}

                {/* Tek sutun: haritalar yan yana, altinda tek tek digerleri */}
                <div className="eylemler bel bel-4">
                  {harita && (
                    <div className="harita-ikili">
                      <a className="btn" href={harita.google} target="_blank" rel="noreferrer">
                        Google Haritalar
                      </a>
                      <a className="btn" href={harita.apple} target="_blank" rel="noreferrer">
                        Apple Haritalar
                      </a>
                    </div>
                  )}
                  <a className="btn btn-birincil" href={onizleme ? `/api/ics?asama=${asama}` : "/api/ics"}>
                    Takvime ekle
                  </a>
                  <KatilimButonu
                    tel={tel}
                    varsayilanAd={misafirAd}
                    token={token}
                    izinliKisi={izinliKisi}
                    oncekiRsvp={oncekiRsvp}
                  />
                  <WhatsappPaylasButonu url={paylasimUrl} mesaj={whatsappMesaj} />
                  <FotoYukleButonu acik={yuklemeAcik} mesaj={yuklemeMesaji()} />
                  {galeriAcik && <GaleriButonu anlar={anlar} />}
                  {fotoNotu && <p className="foto-notu">{fotoNotu}</p>}
                </div>
              </header>
            </AltinCerceve>
          </div>
        </Zarf>
      )}
      {serit}
    </>
  );
}
