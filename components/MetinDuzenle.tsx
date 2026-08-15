"use client";

import { useActionState, useState } from "react";
import { metinleriKaydet } from "@/lib/admin";
import { METIN_ALANLARI } from "@/lib/metin-alanlari";

/** Hangi grup hangi sekmede gorunecek. */
export type MetinSekme = "davetiye" | "metinler" | "genel";

const GRUPLAR: { sekme: MetinSekme; baslik: string; not?: string; anahtarlar: string[] }[] = [
  {
    sekme: "davetiye",
    baslik: "İsimler",
    not: "Davetiyenin en üstünde bu iki ad görünür. Soyisim yazma — aile soyadları aşağıdaki bölümlerde.",
    anahtarlar: ["gelin_ad", "damat_ad"],
  },
  {
    sekme: "davetiye",
    baslik: "Gelinin ailesi — davetiyede SOLDA",
    not: "«Birlikte» seçersen isimler üstte, ortak soyad altta ortalanır. «Ayrı» seçersen her isim kendi soyadıyla ayrı satırda yazılır.",
    anahtarlar: ["gelin_bicim", "gelin_anne_ad", "gelin_anne_soyad", "gelin_baba_ad", "gelin_baba_soyad"],
  },
  {
    sekme: "davetiye",
    baslik: "Damadın ailesi — davetiyede SAĞDA",
    anahtarlar: ["damat_bicim", "damat_anne_ad", "damat_anne_soyad", "damat_baba_ad", "damat_baba_soyad"],
  },
  {
    sekme: "davetiye",
    baslik: "Davetiye kartının görünümü",
    not: "Kartın altındaki fotoğrafın ne kadar görüneceğini buradan ayarlarsın. Değişiklik kaydettikten sonra davetiyede görünür.",
    anahtarlar: ["kart_beyaz", "kart_blur"],
  },

  { sekme: "metinler", baslik: "Davetiye metni", anahtarlar: ["davet_cumlesi", "zarf_toren", "zarf_notu", "kapanis", "foto_notu"] },
  { sekme: "metinler", baslik: "Salon ve iletişim", anahtarlar: ["yemek_notu", "otopark_notu", "iletisim_tel"] },

  {
    sekme: "genel",
    baslik: "Fotoğraf yükleme",
    not: "Misafirlerin çektiği fotoğrafları yükleyebileceği bölüm. Kapalıyken butona basan misafire açılış saati yazısı gösterilir.",
    anahtarlar: ["yukleme_modu"],
  },
  {
    sekme: "genel",
    baslik: "Galeri",
    not: "Galeri açıkken davetiyenin arka yüzünde görünür ve misafirler indirebilir. Kapalıyken yalnızca bu panelde.",
    anahtarlar: ["galeri_acik"],
  },
];

function Kaydirac({
  ad, baslangic, min, max, adim, birim, guvenliAlt, uyari,
}: {
  ad: string; baslangic: number; min: number; max: number; adim: number;
  birim: string; guvenliAlt: number; uyari: string;
}) {
  const [v, setV] = useState(baslangic);
  const riskli = uyari.length > 0 && v < guvenliAlt;
  return (
    <div className="kaydirac">
      <input
        id={ad} name={ad} type="range"
        min={min} max={max} step={adim} value={v}
        onChange={(e) => setV(Number(e.target.value))}
      />
      <output>
        {v}
        {birim}
      </output>
      {riskli && <p className="hata kucuk">{uyari}</p>}
    </div>
  );
}

export default function MetinDuzenle({
  degerler,
  sekme,
  kaydetEtiketi = "Kaydet",
}: {
  degerler: Record<string, string>;
  sekme: MetinSekme;
  kaydetEtiketi?: string;
}) {
  const [state, action, bekliyor] = useActionState(
    metinleriKaydet,
    null as { ok?: boolean; sayi?: number; hata?: string } | null,
  );

  /* Her sekme KENDI formu. Guvenli, cunku metinleriKaydet formda olmayan
     alani atliyor (`v === null` -> continue) — bir sekmeyi kaydetmek
     digerlerinin degerlerini silmez. */
  const gruplar = GRUPLAR.filter((g) => g.sekme === sekme);

  return (
    <form action={action}>
      {gruplar.map((g) => (
        <div key={g.baslik} className="metin-grup">
          <h3>{g.baslik}</h3>
          {g.not && <p className="kucuk">{g.not}</p>}
          {g.anahtarlar.map((k) => {
            const alan = METIN_ALANLARI.find((a) => a.anahtar === k)!;
            return (
              <div key={k}>
                <label htmlFor={k}>{alan.etiket}</label>
                {"sayi" in alan && alan.sayi ? (
                  <Kaydirac
                    ad={k}
                    baslangic={Number(degerler[k]) || alan.sayi.min}
                    min={alan.sayi.min}
                    max={alan.sayi.max}
                    adim={alan.sayi.adim}
                    birim={alan.sayi.birim}
                    guvenliAlt={alan.sayi.guvenliAlt}
                    uyari={alan.sayi.uyari}
                  />
                ) : "secenekler" in alan && alan.secenekler ? (
                  <select id={k} name={k} defaultValue={degerler[k] || alan.secenekler[0].deger}>
                    {alan.secenekler.map((o) => (
                      <option key={o.deger} value={o.deger}>
                        {o.etiket}
                      </option>
                    ))}
                  </select>
                ) : alan.cok_satir ? (
                  <textarea id={k} name={k} rows={2} defaultValue={degerler[k] ?? ""} placeholder={alan.ipucu} />
                ) : (
                  <input id={k} name={k} type="text" defaultValue={degerler[k] ?? ""} placeholder={alan.ipucu} />
                )}
              </div>
            );
          })}
        </div>
      ))}

      <div className="butonlar" style={{ justifyContent: "flex-start", marginTop: "1.2rem" }}>
        <button className="btn btn-birincil" disabled={bekliyor}>
          {bekliyor ? "Kaydediliyor…" : kaydetEtiketi}
        </button>
        {state?.ok && <span className="kucuk">{state.sayi} alan kaydedildi ✓</span>}
        {state?.hata && <span className="hata">{state.hata}</span>}
      </div>
      {sekme !== "genel" && (
        <p className="kucuk" style={{ marginTop: ".6rem" }}>
          Boş bıraktığın alan davetiyede hiç görünmez — yer tutucu da çizilmez.
        </p>
      )}
    </form>
  );
}
