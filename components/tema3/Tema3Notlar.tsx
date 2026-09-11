"use client";

import type { EbeveynBlok } from "@/lib/metin";

interface Props {
  kiyafetKodu?: string;
  hediyeNotu?: string;
  yemek?: string;
  otopark?: string;
  gelin?: EbeveynBlok;
  damat?: EbeveynBlok;
}

export default function Tema3Notlar({
  kiyafetKodu,
  hediyeNotu,
  yemek,
  otopark,
  gelin,
  damat,
}: Props) {
  const dressCode =
    kiyafetKodu || "Zarif ve şık kıyafetlerinizle gecemizi onurlandırmanızı rica ederiz.";
  const giftPref =
    hediyeNotu || "En güzel hediye, sizlerin varlığı ve içten dualarıdır.";

  const hasAileler =
    (gelin?.satirlar && gelin.satirlar.length > 0) ||
    (damat?.satirlar && damat.satirlar.length > 0);

  return (
    <section className="tema3-bolum-kapsul">
      <div className="tema3-bilgi-grid">
        <div className="tema3-bilgi-kart">
          <div className="tema3-bilgi-baslik">Dress Code</div>
          <p className="tema3-bilgi-metin">{dressCode}</p>
        </div>

        <div className="tema3-bilgi-kart">
          <div className="tema3-bilgi-baslik">Gift Preference</div>
          <p className="tema3-bilgi-metin">{giftPref}</p>
        </div>

        {yemek && (
          <div className="tema3-bilgi-kart">
            <div className="tema3-bilgi-baslik">İkram Detayları</div>
            <p className="tema3-bilgi-metin">{yemek}</p>
          </div>
        )}

        {otopark && (
          <div className="tema3-bilgi-kart">
            <div className="tema3-bilgi-baslik">Otopark</div>
            <p className="tema3-bilgi-metin">{otopark}</p>
          </div>
        )}

        {hasAileler && (
          <div className="tema3-bilgi-kart">
            <div className="tema3-bilgi-baslik">Aileler</div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", marginTop: "0.4rem" }}>
              {gelin && gelin.satirlar.length > 0 && (
                <div>
                  <div style={{ fontSize: "0.78rem", color: "#a67d2b", textTransform: "uppercase", letterSpacing: "0.1em" }}>Kız Tarafı</div>
                  {gelin.satirlar.map((s, i) => (
                    <div key={i} style={{ fontSize: "0.92rem", fontWeight: 600 }}>{s}</div>
                  ))}
                </div>
              )}
              {damat && damat.satirlar.length > 0 && (
                <div>
                  <div style={{ fontSize: "0.78rem", color: "#a67d2b", textTransform: "uppercase", letterSpacing: "0.1em" }}>Erkek Tarafı</div>
                  {damat.satirlar.map((s, i) => (
                    <div key={i} style={{ fontSize: "0.92rem", fontWeight: 600 }}>{s}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
