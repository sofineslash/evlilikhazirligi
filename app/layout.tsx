import type { Metadata } from "next";
import { CFG, TARIH_METNI, SAAT_METNI } from "@/lib/config";
import { metin } from "@/lib/metin";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const gelin = metin("gelin_ad") || CFG.GELIN;
  const damat = metin("damat_ad") || CFG.DAMAT;
  const baslik = `${gelin} & ${damat} — Nişan`;
  return {
    metadataBase: new URL("https://kubranur.omuroz.com.tr"),
    title: baslik,
    description: `${TARIH_METNI}, ${SAAT_METNI} — ${CFG.SALON_AD}`,
    openGraph: {
      title: baslik,
      description: `${TARIH_METNI}, ${SAAT_METNI} — Pendik/İstanbul`,
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
