import type { Metadata } from "next";
import { metin } from "@/lib/metin";
import { CFG } from "@/lib/config";
import { asamaCoz, etkinlikOku, metaMetinleri } from "@/lib/etkinlik";
import { sahneYolu } from "@/lib/sahneler";
import { davetliGetirToken } from "@/lib/davetliler";
import { misafirAdiFormatla } from "@/lib/whatsapp";
import { siteUrl, slugSanitize, DEFAULT_DAVETIYE_SLUG } from "@/lib/site";
import DavetiyeGosterimi from "@/components/DavetiyeGosterimi";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ guest?: string; misafir?: string; g?: string; tema?: string; video?: string; asama?: string }>;
};

/**
 * WhatsApp, Facebook, Telegram vb. crawler'lar icin server-side Open Graph
 * ve Twitter Card meta taglarini uretir.
 *
 * ONEMLI: SALT OKUMADIR!
 * Asla goruntulenme sayaci veya veritabani state'i degistirmez.
 */
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { guest, misafir, g: token, asama: asamaParam } = await searchParams;

  const temizSlug = slugSanitize(slug);
  const guestQuery = guest || misafir;

  // Misafir adi cozumleme: once token (varsa), sonra query
  let misafirAd = "";
  if (token) {
    const davetli = davetliGetirToken(token);
    if (davetli?.ad_soyad) misafirAd = davetli.ad_soyad;
  }
  if (!misafirAd && guestQuery) {
    misafirAd = misafirAdiFormatla(guestQuery);
  }

  const gelin = metin("gelin_ad") || CFG.GELIN;
  const damat = metin("damat_ad") || CFG.DAMAT;
  const ciftBaslik = `${gelin} ❤️ ${damat}`;

  // Başlık/açıklama aşamaya göre; nişan öncesinde önceki metinlerle birebir aynı.
  const { asama } = await asamaCoz(asamaParam);
  const etk = etkinlikOku(asama);
  const meta = metaMetinleri({ asama, etk, ciftBaslik, misafirAd });
  const { baslik, aciklama } = meta;

  const paylasimParam = token
    ? `?g=${encodeURIComponent(token)}`
    : guestQuery
    ? `?guest=${encodeURIComponent(guestQuery)}`
    : "";

  const tamUrl = siteUrl(`/davet/${temizSlug}${paylasimParam}`);
  const canonicalUrl = siteUrl(`/davet/${temizSlug}`);

  // OG Gorseli secimi
  const ogTur = metin("whatsapp_og_tur") || "dinamik";
  const kapak = sahneYolu("01-kapak");
  const ogGorselUrl =
    ogTur === "kapak" && kapak
      ? siteUrl(kapak)
      : siteUrl(`/api/og${paylasimParam}`);

  return {
    metadataBase: new URL(siteUrl()),
    title: baslik,
    description: aciklama,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: baslik,
      description: aciklama,
      url: tamUrl,
      siteName: meta.siteAdi,
      locale: "tr_TR",
      type: "website",
      images: [
        {
          url: ogGorselUrl,
          width: 1200,
          height: 630,
          alt: meta.ogAlt,
          type: "image/png",
        },
      ],
      // Davet videosu yalniz davet asamalarinda; "sonrasi"nda davet videosu yaniltici.
      ...(meta.video
        ? {
            videos: [
              {
                url: siteUrl("/davetiye-video.mp4"),
                secureUrl: siteUrl("/davetiye-video.mp4"),
                type: "video/mp4",
                width: 720,
                height: 1280,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: baslik,
      description: aciklama,
      images: [ogGorselUrl],
    },
    robots: { index: false, follow: false },
  };
}

export default async function DavetDetaySayfasi({ params, searchParams }: Props) {
  const { slug } = await params;
  const { guest, misafir, g: token, tema, video, asama } = await searchParams;

  const temizSlug = slugSanitize(slug);
  const guestQuery = guest || misafir;

  return (
    <DavetiyeGosterimi
      slug={temizSlug}
      token={token}
      guest={guestQuery}
      temaOzel={tema}
      videoModu={video === "1"}
      asamaOzel={asama}
    />
  );
}
