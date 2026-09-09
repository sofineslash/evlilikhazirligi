import Link from "next/link";
import { CFG } from "@/lib/config";
import { metin } from "@/lib/metin";
import { yuklemeAcikMi, YUKLEME_MESAJI } from "@/lib/yukleme";
import { sahneYolu } from "@/lib/sahneler";
import AnYukle from "@/components/AnYukle";

export const dynamic = "force-dynamic";

export default function Yukle() {
  const acik = yuklemeAcikMi();
  const gelin = metin("gelin_ad") || CFG.GELIN;
  const damat = metin("damat_ad") || CFG.DAMAT;
  const ciftYolu = sahneYolu("02-cift");

  return (
    <main className="an-sayfa-kapsayici">
      {/* SİNEMATİK DERİN SAYFA ARKA PLANI */}
      {ciftYolu && (
        <div className="tema2-derin-fon" aria-hidden="true">
          <img className="tema2-derin-gorsel" src={ciftYolu} alt="" />
          <div className="tema2-derin-perde" />
        </div>
      )}

      {/* KRALİYET KARTI VE ÇERÇEVESİ */}
      <div className="tema2-kraliyet-kart an-kraliyet-kart">
        <div className="tema2-kart-cerceve an-kart-cerceve">
          {/* ÜST MOTİF VE KICKER */}
          <div className="tema2-kraliyet-tepe-sus" aria-hidden="true">
            <span className="tema2-sus-cizgi" />
            <span className="tema2-sus-simge">❖</span>
            <span className="tema2-sus-cizgi" />
          </div>

          <div className="tema2-kicker">ANI ALBÜMÜ &amp; PAYLAŞIM</div>

          {/* GELİN & DAMAT İSİMLERİ (Kaligrafi) */}
          <h1 className="isimler isimler-script an-isimler">
            {gelin} <span className="ve">&amp;</span> {damat}
          </h1>

          <div className="an-ayrac-cizgi" aria-hidden="true" />

          {acik ? (
            <div className="an-icerik-alan">
              <h2 className="an-sayfa-baslik">Fotoğraf &amp; Video Yükle</h2>
              <p className="an-sayfa-aciklama">
                {metin("foto_notu") ||
                  "Nişan günü çekeceğiniz fotoğrafları albümümüzde paylaşabilir, bu mutlu anımıza farklı bakış açıları kazandırabilirsiniz."}
              </p>

              <AnYukle />

              <div className="an-guvenlik-kutu">
                <span className="an-guvenlik-ikon" aria-hidden="true">🔒</span>
                <p className="an-guvenlik-metin">
                  Fotoğraflarınız yalnızca çiftimizle ve anı albümümüzde paylaşılır. Yükleme sırasında otomatik optimize edilir ve konum bilgileri silinir.
                </p>
              </div>
            </div>
          ) : (
            <div className="an-kapali-kutu">
              <span className="an-kapali-ikon" aria-hidden="true">✨</span>
              <h2 className="an-sayfa-baslik">Yüklemeler Henüz Açılmadı</h2>
              <p className="an-sayfa-aciklama">{YUKLEME_MESAJI}</p>
              <p className="an-kapali-not">
                Tören günü masalarda yer alan karekodu okutarak doğrudan bu sayfadan fotoğraflarınızı kolayca yükleyebilirsiniz.
              </p>
            </div>
          )}

          {/* GERİ DÖNÜŞ BUTONU */}
          <div className="an-donus-satiri">
            <Link href="/" className="btn btn-eylem an-donus-btn">
              <span className="an-donus-ok">←</span> Davetiyeye Dön
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
