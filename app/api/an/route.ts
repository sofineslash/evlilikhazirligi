import { NextResponse } from "next/server";
import { CFG } from "@/lib/config";
import { kullanilanBayt } from "@/lib/anlar";
import { yuklemeAcikMi } from "@/lib/yukleme";
import { hizKontrol, istemciAnahtari } from "@/lib/ratelimit";
import { cihazJetonuDogrula } from "@/lib/session";
import { anKaydetVeIsle, VIDEO_MAX_BAYT } from "@/lib/yukleme-isle";

export const dynamic = "force-dynamic";

/**
 * TEK ISTEKLI yukleme — kucuk dosyalar icin.
 *
 * Buyuk dosyalar /api/an/parca'ya gidiyor: 400 MB'lik bir video tek
 * istekte gonderilince mobil baglantida kopuyor ve BASTAN basliyordu.
 * Tur tespiti, kucultme ve kayit mantigi ortak (lib/yukleme-isle.ts) —
 * iki uc ayni boru hattini kullaniyor.
 */
export async function POST(req: Request) {
  // CSRF: route handler, Server Action'in origin kontrolunu almaz.
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (origin && host && new URL(origin).host !== host) {
    return NextResponse.json({ mesaj: "Geçersiz istek." }, { status: 403 });
  }

  if (!yuklemeAcikMi()) {
    return NextResponse.json({ mesaj: "Fotoğraf yükleme şu an kapalı." }, { status: 403 });
  }

  // Cihaz jetonu: ONCE header (proxy enjekte eder), SONRA cerez —
  // jetonu yaratan istekte cerez henuz yok.
  const cerez = req.headers.get("cookie")?.split(";").map((c) => c.trim())
    .find((c) => c.startsWith("nisan_cihaz="))?.slice("nisan_cihaz=".length);
  const cihaz =
    (await cihazJetonuDogrula(req.headers.get("x-cihaz"))) ??
    (await cihazJetonuDogrula(cerez));

  // Hiz siniri ASLA socket adresine anahtarlanmaz — tunel arkasinda
  // butun davetliler tek kovaya duser ve hepsi 429 yer.
  const hiz = hizKontrol(istemciAnahtari(req, cihaz), { adet: 60, pencere_dk: 10 });
  if (!hiz.ok) return NextResponse.json({ mesaj: hiz.mesaj }, { status: 429 });

  const uzunluk = Number(req.headers.get("content-length") ?? 0);
  if (uzunluk > VIDEO_MAX_BAYT) {
    return NextResponse.json({ mesaj: "Dosya çok büyük (en fazla 600 MB)." }, { status: 413 });
  }

  // Kota: diski doldurup sunucuyu kilitlemeyelim.
  if (kullanilanBayt() >= CFG.MEDYA_KOTA_BAYT) {
    return NextResponse.json(
      { mesaj: "Depolama alanı doldu. Lütfen bize haber verin." },
      { status: 507 },
    );
  }

  const buf = Buffer.from(await req.arrayBuffer());
  if (buf.length === 0) return NextResponse.json({ mesaj: "Boş dosya." }, { status: 400 });

  /* HTTP basliklari latin-1: "ğ ş İ ı" ham gonderilirse baslik bozulur.
     Istemci encodeURIComponent ile gonderiyor, burada cozuyoruz. */
  let yukleyen: string | null = null;
  try {
    yukleyen = decodeURIComponent(req.headers.get("x-yukleyen") ?? "").trim().slice(0, 60) || null;
  } catch { yukleyen = null; }

  const sonuc = await anKaydetVeIsle(buf, yukleyen);
  if (!sonuc.ok) return NextResponse.json({ mesaj: sonuc.mesaj }, { status: 415 });
  return NextResponse.json(sonuc);
}
