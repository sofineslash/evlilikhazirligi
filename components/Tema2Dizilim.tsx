import IsimUydur from "./IsimUydur";
import TakvimeEkle from "./TakvimeEkle";
import KatilimButonu from "./KatilimButonu";
import FotoYukleButonu from "./FotoYukleButonu";
import GaleriButonu from "./GaleriButonu";
import GeriSayim from "./GeriSayim";
import { CFG, haritaLinkleri } from "@/lib/config";
import type { EbeveynBlok } from "@/lib/metin";
import { YUKLEME_MESAJI } from "@/lib/yukleme";

export default function Tema2Dizilim({
  gelinAd,
  damatAd,
  davetCumlesi,
  gelin,
  damat,
  tel,
  yemek,
  otopark,
  fotoNotu,
  yuklemeAcik,
  galeriAcik,
  ciftYolu,
  gelinPng,
  damatPng,
  kartBeyaz,
  kartBlur,
  anlar,
}: {
  gelinAd: string;
  damatAd: string;
  davetCumlesi: string;
  gelin: EbeveynBlok;
  damat: EbeveynBlok;
  tel?: string;
  yemek?: string;
  otopark?: string;
  fotoNotu?: string;
  yuklemeAcik: boolean;
  galeriAcik?: boolean;
  ciftYolu?: string | null;
  gelinPng?: string | null;
  damatPng?: string | null;
  kartBeyaz?: number;
  kartBlur?: number;
  anlar: { id: string; yukleyen: string | null }[];
}) {
  const harita = haritaLinkleri();

  return (
    <div className="tema2-sahne-merkez">
      {/* SİNEMATİK DERİN SAYFA ARKA PLANI (Çift Fotoğrafı Vurgusu) */}
      {ciftYolu && (
        <div className="tema2-derin-fon" aria-hidden="true">
          <img className="tema2-derin-gorsel" src={ciftYolu} alt="" />
          <div className="tema2-derin-perde" />
        </div>
      )}

      {/* KRALİYET DÜĞÜN KARTI (Yumuşatılmış Buğulu Fildişi & Şampanya) */}
      <div
        className="tema2-kraliyet-kart"
        style={{
          "--kart-beyaz": kartBeyaz ?? 53,
          "--kart-blur": kartBlur ?? 16,
        } as React.CSSProperties}
      >
        <div className="tema2-kart-cerceve">
          {/* ÜST MOTİF VE BAŞLIK */}
          <div className="tema2-hero-alan">
            <div className="tema2-kraliyet-tepe-sus" aria-hidden="true">
              <span className="tema2-sus-cizgi" />
              <span className="tema2-sus-simge">❖</span>
              <span className="tema2-sus-cizgi" />
            </div>

            <div className="tema2-kicker">NİŞANLANIYORUZ</div>

            {/* İSİMLER VE KÜBRANUR & ÖMÜR FİGÜRLERİ */}
            <div className="isim-alani tema2-isim-kapsayici">
              {(gelinPng || damatPng) && (
                <div className="tema2-isim-arkasi" aria-hidden="true">
                  {gelinPng && (
                    <img
                      className="tema2-figur tema2-figur-gelin"
                      src={gelinPng}
                      alt=""
                    />
                  )}
                  {damatPng && (
                    <img
                      className="tema2-figur tema2-figur-damat"
                      src={damatPng}
                      alt=""
                    />
                  )}
                </div>
              )}
              <h1 className="isimler isimler-script tema2-isimler">
                {gelinAd} <span className="ve">&amp;</span> {damatAd}
              </h1>
            </div>
            <IsimUydur />
          </div>

          {/* SÜTUNLU ŞIK TARİH BLOĞU */}
          <div className="tema2-tarih-kutusu">
            <div className="tema2-tarih-kolon">
              <span className="tema2-tarih-ay">EKİM</span>
              <span className="tema2-tarih-yil">2026</span>
            </div>

            <div className="tema2-tarih-ayrac" />

            <div className="tema2-tarih-kolon tema2-tarih-orta">
              <span className="tema2-tarih-buyuk-gun">29</span>
            </div>

            <div className="tema2-tarih-ayrac" />

            <div className="tema2-tarih-kolon">
              <span className="tema2-tarih-gun-ad">PERŞEMBE</span>
              <span className="tema2-tarih-saat">19:00</span>
            </div>
          </div>

          {/* AŞAĞI KAYDIR GÖSTERGESİ */}
          <div className="tema2-kaydir-ipucu" aria-hidden="true">
            <span className="tema2-kaydir-cizgi" />
            <svg
              className="tema2-kaydir-ok"
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
            <span className="tema2-kaydir-cizgi" />
          </div>

          {/* DAVET CÜMLESİ */}
          {davetCumlesi && (
            <p className="davet-cumlesi tema2-davet-cumlesi">{davetCumlesi}</p>
          )}

          {/* AİLELER (Yan Yana Şık Sütunlar) */}
          {(gelin.satirlar.length > 0 || damat.satirlar.length > 0) && (
            <div className="aileler tema2-aileler">
              {gelin.satirlar.length > 0 && (
                <div className="aile-sutun tema2-aile-sutun">
                  {gelin.satirlar.map((satir, i) => (
                    <span
                      key={i}
                      className={gelin.ortakSoyad && i === 1 ? "aile-soyad" : ""}
                    >
                      {satir}
                    </span>
                  ))}
                </div>
              )}
              {damat.satirlar.length > 0 && (
                <div className="aile-sutun tema2-aile-sutun">
                  {damat.satirlar.map((satir, i) => (
                    <span
                      key={i}
                      className={damat.ortakSoyad && i === 1 ? "aile-soyad" : ""}
                    >
                      {satir}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TÖREN VE SALON BÖLÜMÜ */}
          <div className="tema2-salon-bolum">
            <h2 className="salon tema2-salon">{CFG.SALON_AD}</h2>
            <p className="salon-adres tema2-salon-adres">{CFG.SALON_ADRES}</p>

            {/* HARİTALAR (İki Buton Yan Yana) */}
            <div className="harita-ikili">
              <a
                href={harita.google}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-eylem tema2-harita-btn"
              >
                <span className="tema2-btn-ikon">📍</span> Google Haritalar
              </a>
              <a
                href={harita.apple}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-eylem tema2-harita-btn"
              >
                <span className="tema2-btn-ikon">🧭</span> Apple Haritalar
              </a>
            </div>

            {(yemek || otopark) && (
              <div className="tema2-notlar">
                {yemek && <p className="tema2-not">{yemek}</p>}
                {otopark && <p className="tema2-not">{otopark}</p>}
              </div>
            )}
          </div>

          {/* EYLEMLER (Katılım, Fotoğraf Yükle, Galeri) */}
          <div className="eylemler tema2-eylemler">
            <KatilimButonu tel={tel} />
            <FotoYukleButonu acik={yuklemeAcik} mesaj={YUKLEME_MESAJI} />
            {(galeriAcik ?? true) && <GaleriButonu anlar={anlar} />}
            {fotoNotu && <p className="foto-notu tema2-foto-notu">{fotoNotu}</p>}
          </div>

          {/* GERİ SAYIM — BÜYÜK GÜNE KADAR CANLI GERİ SAYIM */}
          <GeriSayim />

          {/* TAKVİME EKLE BUTONU */}
          <div className="tema2-takvim-satiri">
            <TakvimeEkle />
          </div>
        </div>
      </div>
    </div>
  );
}
