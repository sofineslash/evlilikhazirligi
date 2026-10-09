import { NextResponse } from "next/server";
import { adminMi } from "@/lib/admin";
import {
  baglan, durum, ekranGoruntusu, ilerleme, gonderimBaslat, durdur, onayla, kapat, cikisYap,
  type GonderSecenek,
} from "@/lib/wa-gonderici";
import { tarafDogrula, type DavetliTaraf } from "@/lib/davetliler";

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
/* Taraf ZORUNLU ve dogrulanir: gecersiz bir deger sessizce "gelin"e
   dusseydi, erkek tarafinin numarasindan kiz tarafina mesaj gidebilirdi. */
function taraf(req: Request): DavetliTaraf | null {
  return tarafDogrula(new URL(req.url).searchParams.get("taraf"));
}

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
  const t = taraf(req);
  if (!t) return NextResponse.json({ mesaj: "Taraf belirtilmedi." }, { status: 400 });

  if (is === "ekran") {
    const g = await ekranGoruntusu(t);
    if (!g) return NextResponse.json({ mesaj: "Tarayıcı kapalı." }, { status: 409 });
    return new NextResponse(new Uint8Array(g), {
      headers: { "content-type": "image/jpeg", "cache-control": "no-store" },
    });
  }

  // Varsayilan: durum + ilerleme birlikte (istemci tek istekle izlesin)
  const d = await durum(t);
  return NextResponse.json({ ok: true, ...ilerleme(t), durum: d, taraf: t }, {
    headers: { "cache-control": "no-store" },
  });
}

export async function POST(req: Request) {
  const red = await yetki();
  if (red) return red;

  const is = new URL(req.url).searchParams.get("is");
  const t = taraf(req);
  if (!t) return NextResponse.json({ mesaj: "Taraf belirtilmedi." }, { status: 400 });

  try {
    if (is === "baglan") {
      // Arka planda yurur; istemci durumu yoklayarak QR'i gorur.
      void baglan(t).catch(() => {});
      return NextResponse.json({ ok: true });
    }

    if (is === "gonder") {
      const g = await req.json().catch(() => ({}));
      const sayi = (v: unknown, varsayilan: number, alt: number, ust: number) => {
        const n = Number(v);
        return Number.isFinite(n) ? Math.min(ust, Math.max(alt, Math.round(n))) : varsayilan;
      };
      const sec: GonderSecenek = {
        taraf: t,
        belirsizlerDahil: g.belirsizlerDahil === true,     // varsayilan KAPALI
        /* Varsayilan OTOMATIK — kullanicinin istegi. Koruma onayda degil,
           kisiler arasi rastgele beklemede ve gunluk ust sinirda. */
        mod: g.mod === "onay" ? "onay" : "otomatik",
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
      onayla(t, c);
      return NextResponse.json({ ok: true });
    }

    if (is === "dur") {
      durdur(t);
      return NextResponse.json({ ok: true });
    }

    if (is === "kapat") {
      await kapat(t);
      return NextResponse.json({ ok: true });
    }

    /* Oturumu silip QR'i yeniden istetir — baska bir numara baglanabilsin. */
    if (is === "cikis") {
      await cikisYap(t);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ mesaj: "Bilinmeyen işlem." }, { status: 400 });
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ mesaj: m }, { status: 400 });
  }
}
