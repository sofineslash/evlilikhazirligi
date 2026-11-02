import type { Metadata } from "next";
import { CFG } from "@/lib/config";
import { kayitliAsama, etkinlikOku } from "@/lib/etkinlik";
import { sonrasiMi } from "@/lib/asama";
import { metin } from "@/lib/metin";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const gelin = metin("gelin_ad") || CFG.GELIN;
  const damat = metin("damat_ad") || CFG.DAMAT;
  // Kayıtlı aşamaya göre. Nişan öncesinde önceki metinlerle birebir aynı.
  const asama = kayitliAsama();
  const etk = etkinlikOku(asama);
  const sonra = sonrasiMi(asama);
  const baslik = sonra
    ? `${gelin} & ${damat} — ${etk.tur === "dugun" ? "Evlendik" : "Nişanlandık"}`
    : `${gelin} & ${damat} — ${etk.adi}`;
  const zaman = etk.tarih ? `${etk.tarih.metin}, ${etk.tarih.saatMetni}` : "";
  const aciklama = sonra
    ? "Bu özel günümüzde yanımızda olduğunuz için teşekkür ederiz."
    : [zaman, etk.salonAd].filter(Boolean).join(" — ");
  const ogAciklama = sonra
    ? aciklama
    : etk.tur === "nisan"
      ? `${zaman} — Pendik/İstanbul`
      : aciklama;
  return {
    metadataBase: new URL("https://kubranur.omuroz.com.tr"),
    title: baslik,
    description: aciklama,
    openGraph: {
      title: baslik,
      description: ogAciklama,
      locale: "tr_TR",
      type: "website",
    },
    robots: { index: false, follow: false },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
