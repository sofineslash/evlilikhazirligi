import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { adminMi, cikisYap, dilekYayinla, kayitSil } from "@/lib/admin";
import { sahneDurumu } from "@/lib/sahneler";
import { tumMetinler } from "@/lib/metin";
import { yuklemeAcikMi, yuklemeModu } from "@/lib/yukleme";
import MetinDuzenle from "@/components/MetinDuzenle";
import SahneYukle from "@/components/SahneYukle";
import AdminSekmeler from "@/components/AdminSekmeler";
import GaleriYonet from "@/components/GaleriYonet";
import KullaniciYonet from "@/components/KullaniciYonet";
import { kullanicilariListele } from "@/lib/kullanicilar";
import { anlariListele, anSayisi } from "@/lib/anlar";
import { galeriAcikMi } from "@/lib/galeri";

export const dynamic = "force-dynamic";

type Kayit = {
  id: string; ad_soyad: string; geliyor: number; kisi_sayisi: number;
  dilek: string | null; dilek_yayinda: number; cift_isaretli: number;
  tek_kelime: number; olusturuldu: string;
};

const kucukBtn = { minHeight: 32, padding: ".2rem .5rem", fontSize: ".8rem" } as const;

export default async function Admin() {
  if (!(await adminMi())) redirect("/admin/giris");

  const kayitlar = db()
    .prepare("SELECT * FROM katilimlar ORDER BY cift_isaretli DESC, olusturuldu DESC")
    .all() as Kayit[];

  const gelen = kayitlar.filter((k) => k.geliyor === 1);
  const toplamKisi = gelen.reduce((t, k) => t + k.kisi_sayisi, 0);
  const gelemeyen = kayitlar.filter((k) => k.geliyor === 0);

  const sahneler = sahneDurumu();
  const hazir = sahneler.filter((s) => s.yol).length;
  const metinler = tumMetinler();
  const bosMetin = Object.values(metinler).filter((v) => !v.trim()).length;

  const anlar = anlariListele(500);
  const anOzet = anSayisi();
  const galeriAcik = galeriAcikMi();
  const kullanicilar = kullanicilariListele();
  const sahip = process.env.ADMIN_KULLANICI ?? "—";
  const modu = yuklemeModu();
  const acik = yuklemeAcikMi();

  return (
    <main style={{ maxWidth: "52rem" }}>
      <h1 className="isimler" style={{ fontSize: "1.75rem" }}>Yönetim</h1>

      {/* Ozet her sekmede gorunur — panele bakmadan da rakam ortada olsun */}
      <p className="admin-ozet">
        <strong>{toplamKisi} kişi</strong> geliyor ({gelen.length} kayıt) ·{" "}
        {gelemeyen.length} kayıt gelemiyor
      </p>

      <AdminSekmeler
        sekmeler={[
          {
            id: "kayitlar",
            etiket: "Kayıtlar",
            rozet: kayitlar.length ? String(kayitlar.length) : undefined,
            icerik: (
              <table>
                <thead>
                  <tr><th>Ad soyad</th><th>Durum</th><th>Kişi</th><th>Dilek</th><th></th></tr>
                </thead>
                <tbody>
                  {kayitlar.map((k) => (
                    <tr key={k.id}>
                      <td>
                        {k.ad_soyad}{" "}
                        {k.cift_isaretli === 1 && <span className="rozet">çift?</span>}{" "}
                        {k.tek_kelime === 1 && <span className="rozet">tek kelime</span>}
                      </td>
                      <td>{k.geliyor === 1 ? "Geliyor" : "Gelemiyor"}</td>
                      <td>{k.kisi_sayisi || "—"}</td>
                      <td>
                        {k.dilek ? (
                          <>
                            <div>{k.dilek}</div>
                            <form action={async () => { "use server"; await dilekYayinla(k.id, k.dilek_yayinda === 0); }}>
                              <button className="btn" style={kucukBtn}>
                                {k.dilek_yayinda === 1 ? "Yayından kaldır" : "Yayınla"}
                              </button>
                            </form>
                          </>
                        ) : "—"}
                      </td>
                      <td>
                        <form action={async () => { "use server"; await kayitSil(k.id); }}>
                          <button className="btn" style={kucukBtn}>Sil</button>
                        </form>
                      </td>
                    </tr>
                  ))}
                  {kayitlar.length === 0 && (
                    <tr><td colSpan={5} className="kucuk">Henüz kayıt yok.</td></tr>
                  )}
                </tbody>
              </table>
            ),
          },

          {
            id: "fotograflar",
            etiket: "Fotoğraflar",
            rozet: `${hazir}/${sahneler.length}`,
            icerik: (
              <>
                <p className="kucuk" style={{ marginTop: 0 }}>
                  4:5 dikey (1080×1350), en fazla 4 MB. JPG, PNG, WebP veya AVIF.
                </p>
                {sahneler.map((s) => (
                  <SahneYukle
                    key={s.ad}
                    ad={s.ad}
                    aciklama={s.aciklama}
                    yol={s.yol}
                    repoda={s.repoda}
                    yuklenmis={s.yuklenmis}
                  />
                ))}
              </>
            ),
          },

          {
            id: "galeri",
            etiket: "Galeri",
            rozet: anOzet.adet ? String(anOzet.adet) : undefined,
            icerik: (
              <>
                <p className="kucuk" style={{ marginTop: 0 }}>
                  Misafirlerin gönderdiği {anOzet.adet} fotoğraf ·{" "}
                  {(anOzet.bayt / 1024 / 1024).toFixed(1)} MB ·{" "}
                  <strong>
                    {galeriAcik
                      ? "Galeri AÇIK — davetiyenin arkasında herkes görüyor"
                      : "Galeri KAPALI — sadece burada görünüyor"}
                  </strong>
                </p>
                <GaleriYonet
                  anlar={anlar.map((a) => ({
                    id: a.id, yukleyen: a.yukleyen, bayt: a.bayt, olusturuldu: a.olusturuldu,
                  }))}
                />
              </>
            ),
          },

          {
            id: "davetiye",
            etiket: "Davetiye",
            icerik: (
              <MetinDuzenle degerler={metinler} sekme="davetiye" kaydetEtiketi="Davetiyeyi kaydet" />
            ),
          },

          {
            id: "metinler",
            etiket: "Metinler",
            rozet: bosMetin > 0 ? `${bosMetin} boş` : undefined,
            icerik: (
              <>
                <p className="kucuk" style={{ marginTop: 0 }}>
                  {bosMetin > 0
                    ? `${bosMetin} alan hâlâ boş. Boş alanlar davetiyede görünmez.`
                    : "Tüm alanlar dolu."}
                </p>
                <MetinDuzenle degerler={metinler} sekme="metinler" kaydetEtiketi="Metinleri kaydet" />
              </>
            ),
          },

          {
            id: "genel",
            etiket: "Genel Ayarlar",
            icerik: (
              <>
                <h3 style={{ marginTop: 0 }}>Kullanıcılar</h3>
                <p className="kucuk">
                  Kendi bilgilerini paylaşmadan başkasına panel erişimi ver.
                  Eklenen kullanıcılar seninle aynı yetkiye sahiptir.
                </p>
                <KullaniciYonet kullanicilar={kullanicilar} sahip={sahip} />

                <h3 style={{ marginTop: "2rem" }}>Fotoğraf ve galeri</h3>
                <p className="kucuk" style={{ marginTop: 0 }}>
                  Fotoğraf yükleme şu an{" "}
                  <strong>{acik ? "AÇIK" : "KAPALI"}</strong>
                  {modu === "otomatik" && ` (otomatik — nişan saatinde açılır)`}.
                </p>
                <MetinDuzenle degerler={metinler} sekme="genel" kaydetEtiketi="Ayarları kaydet" />
              </>
            ),
          },
        ]}
      />

      <form action={cikisYap} style={{ marginTop: "2rem" }}>
        <button className="btn">Çıkış</button>
      </form>
    </main>
  );
}
