import Link from "next/link";
import { CFG } from "@/lib/config";
import { metin } from "@/lib/metin";
import { yuklemeAcikMi, YUKLEME_MESAJI } from "@/lib/yukleme";
import AnYukle from "@/components/AnYukle";

export const dynamic = "force-dynamic";

export default function Yukle() {
  const acik = yuklemeAcikMi();
  const gelin = metin("gelin_ad") || CFG.GELIN;
  const damat = metin("damat_ad") || CFG.DAMAT;

  return (
    <main className="an-sayfa">
      <div className="kart">
        <h1 className="an-baslik">
          {gelin} &amp; {damat}
        </h1>

        {acik ? (
          <>
            <h2>Fotoğraf yükle</h2>
            <p>{metin("foto_notu") || "Çektiğiniz fotoğrafları buradan bize gönderebilirsiniz."}</p>
            <AnYukle />
            <p className="kucuk" style={{ marginTop: "1rem" }}>
              Fotoğraflar yalnızca bizde görünür. Gönderirken otomatik
              küçültülür, konum bilgisi silinir.
            </p>
          </>
        ) : (
          <>
            <h2>Yüklemeler henüz açılmadı</h2>
            <p>
              {YUKLEME_MESAJI} O gün masalardaki karekodu okutarak buraya
              ulaşabilirsiniz.
            </p>
          </>
        )}

        <p style={{ marginTop: "1.5rem" }}>
          <Link href="/">← Davetiyeye dön</Link>
        </p>
      </div>
    </main>
  );
}
