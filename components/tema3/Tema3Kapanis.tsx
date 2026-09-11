import WhatsappPaylasButonu from "@/components/WhatsappPaylasButonu";
import FotoYukleButonu from "@/components/FotoYukleButonu";
import GaleriButonu, { type AnKart } from "@/components/GaleriButonu";

interface Props {
  gelinAd: string;
  damatAd: string;
  ciftYolu?: string | null;
  paylasimUrl?: string;
  whatsappMesaj?: string;
  yuklemeAcik?: boolean;
  yuklemeMesaji?: string;
  galeriAcik?: boolean;
  anlar?: AnKart[];
}

export default function Tema3Kapanis({
  gelinAd,
  damatAd,
  ciftYolu,
  paylasimUrl,
  whatsappMesaj,
  yuklemeAcik,
  yuklemeMesaji,
  galeriAcik,
  anlar = [],
}: Props) {
  const fotoSrc = ciftYolu || "/tema3/cift-kapanis.jpg";

  return (
    <section className="tema3-kapanis-kapsayici">
      <div className="tema3-cift-foto-kutu">
        <img
          src={fotoSrc}
          alt={`${gelinAd} & ${damatAd}`}
          className="tema3-cift-foto"
        />
      </div>

      <div className="tema3-kapanis-baslik">Sizleri de Aramızda Görmekten Mutluluk Duyarız</div>
      <div className="tema3-kapanis-isimler tema3-isimler-el-yazisi">
        <span>{gelinAd}</span>
        <span className="tema3-isim-kalp" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </span>
        <span>{damatAd}</span>
      </div>

      {/* PAYLAŞIM VE ETKİLEŞİM BUTONLARI */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem", width: "100%", maxWidth: "340px" }}>
        {paylasimUrl && whatsappMesaj && (
          <WhatsappPaylasButonu url={paylasimUrl} mesaj={whatsappMesaj} />
        )}
        <FotoYukleButonu acik={yuklemeAcik ?? true} mesaj={yuklemeMesaji ?? ""} />
        {(galeriAcik ?? true) && <GaleriButonu anlar={anlar} />}
      </div>
    </section>
  );
}
