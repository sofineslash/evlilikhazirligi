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

      <div className="tema3-kapanis-baslik">Hope to see you there!</div>
      <div className="tema3-kapanis-isimler">
        {gelinAd} &amp; {damatAd}
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
