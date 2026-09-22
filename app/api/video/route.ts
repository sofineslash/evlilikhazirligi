import { NextRequest, NextResponse } from "next/server";
import { davetiyeVideosuVarMi, davetiyeVideosuUret, VARSAYILAN_VIDEO_URL } from "@/lib/video-uretici";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const durumIste = searchParams.get("durum") === "1";

  const durum = davetiyeVideosuVarMi();

  if (durumIste) {
    return NextResponse.json(
      {
        ok: true,
        ...durum,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      },
    );
  }

  // Doğrudan videoya yönlendir (cache-bust ekle)
  const hedefUrl = `${VARSAYILAN_VIDEO_URL}?v=${durum.sonGuncellemeMs || Date.now()}`;
  const res = NextResponse.redirect(new URL(hedefUrl, req.url));
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  return res;
}

export async function POST(req: NextRequest) {
  try {
    let misafirAd = "";
    let guncelle = true;

    try {
      const body = await req.json();
      if (body.misafirAd) misafirAd = String(body.misafirAd);
      if (body.guncelle !== undefined) guncelle = Boolean(body.guncelle);
    } catch {}

    const sonuc = await davetiyeVideosuUret({ misafirAd, guncelle });

    if (!sonuc.ok) {
      return NextResponse.json(
        { ok: false, hata: sonuc.hata || "Video üretilemedi." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      url: sonuc.url,
      dosyaBoyutu: sonuc.dosyaBoyutu,
    });
  } catch (err) {
    const mesaj = err instanceof Error ? err.message : "Beklenmeyen hata";
    return NextResponse.json({ ok: false, hata: mesaj }, { status: 500 });
  }
}
