import { NextResponse } from "next/server";
import { adminMi } from "@/lib/admin";
import {
  baglan, durum, ekranGoruntusu, ilerleme, gonderimBaslat, durdur, onayla, kapat,
  type GonderSecenek,
} from "@/lib/wa-gonderici";

export const dynamic = "force-dynamic";

/**
 * WhatsApp toplu gonderim ucu.
 *
 * Tek dosyada toplandi: islem `?is=` ile secilir. Her biri ayri klasor
 * olsaydi alti route dosyasi ve alti kez ayni yetki kontrolu olurdu.
 *
 * YETKI: hepsi admin oturumu ister. Bu uclar kullanicinin WhatsApp
 * hesabini kullaniyor — yetkisiz birine acilmasi, onun adina mesaj
 * gonderilmesi demek.
 */
async function yetki(): Promise<NextResponse | null> {
  if (!(await adminMi())) {
    return NextResponse.json({ mesaj: "Yetkisiz." }, { status: 401 });
  }
  return null;
}

export async function GET(req: Request) {
  const red = await yetki();
  if (red) return red;

  const is = new URL(req.url).searchParams.get("is");

  if (is === "ekran") {
    const g = await ekranGoruntusu();
    if (!g) return NextResponse.json({ mesaj: "Tarayıcı kapalı." }, { status: 409 });
    return new NextResponse(new Uint8Array(g), {
      headers: { "content-type": "image/jpeg", "cache-control": "no-store" },
    });
  }

  // Varsayilan: durum + ilerleme birlikte (istemci tek istekle izlesin)
  const d = await durum();
  return NextResponse.json({ ok: true, ...ilerleme(), durum: d }, {
    headers: { "cache-control": "no-store" },
  });
}

export async function POST(req: Request) {
  const red = await yetki();
  if (red) return red;

  const is = new URL(req.url).searchParams.get("is");

  try {
    if (is === "baglan") {
      // Arka planda yurur; istemci durumu yoklayarak QR'i gorur.
      void baglan().catch(() => {});
      return NextResponse.json({ ok: true });
    }

    if (is === "gonder") {
      const g = await req.json().catch(() => ({}));
      const sayi = (v: unknown, varsayilan: number, alt: number, ust: number) => {
        const n = Number(v);
        return Number.isFinite(n) ? Math.min(ust, Math.max(alt, Math.round(n))) : varsayilan;
      };
      const sec: GonderSecenek = {
        mod: g.mod === "otomatik" ? "otomatik" : "onay",   // varsayilan GUVENLI taraf
        enAzBekleme: sayi(g.enAzBekleme, 25, 5, 600),
        enCokBekleme: sayi(g.enCokBekleme, 60, 5, 900),
        gunlukSinir: sayi(g.gunlukSinir, 60, 1, 300),
        videoGonder: g.videoGonder !== false,
        idler: Array.isArray(g.idler) ? g.idler.map(String).slice(0, 500) : undefined,
      };
      if (sec.enCokBekleme < sec.enAzBekleme) sec.enCokBekleme = sec.enAzBekleme;
      await gonderimBaslat(sec);
      return NextResponse.json({ ok: true });
    }

    if (is === "onay") {
      const g = await req.json().catch(() => ({}));
      const c = g.cevap === "atla" ? "atla" : g.cevap === "dur" ? "dur" : "gonder";
      onayla(c);
      return NextResponse.json({ ok: true });
    }

    if (is === "dur") {
      durdur();
      return NextResponse.json({ ok: true });
    }

    if (is === "kapat") {
      await kapat();
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ mesaj: "Bilinmeyen işlem." }, { status: 400 });
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ mesaj: m }, { status: 400 });
  }
}
