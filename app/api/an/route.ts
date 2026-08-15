import { NextResponse } from "next/server";
import crypto from "node:crypto";
import fsp from "node:fs/promises";
import path from "node:path";
import { CFG } from "@/lib/config";
import { anIsle } from "@/lib/gorsel";
import { anKaydet, anlarKlasoru, kullanilanBayt } from "@/lib/anlar";
import { yuklemeAcikMi } from "@/lib/yukleme";
import { hizKontrol, istemciAnahtari } from "@/lib/ratelimit";
import { cihazJetonuDogrula } from "@/lib/session";

export const dynamic = "force-dynamic";

/** Ham dosya tavani. Islenmis hali cok daha kucuk olur. */
const MAX_BAYT = 25 * 1024 * 1024;

/**
 * Sihirli baytlardan gercek turu cikarir — istemcinin dedigi MIME'a GUVENILMEZ.
 * SVG bilerek DISARIDA: icinde script tasiyabilir.
 */
function goruntuMu(b: Buffer): boolean {
  if (b.length < 12) return false;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return true;                    // JPEG
  if (b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return true; // PNG
  if (b.subarray(0, 4).toString("ascii") === "RIFF" &&
      b.subarray(8, 12).toString("ascii") === "WEBP") return true;                     // WebP
  const ftyp = b.subarray(4, 8).toString("ascii") === "ftyp";
  if (ftyp && b.subarray(8, 12).toString("ascii").startsWith("avif")) return true;     // AVIF
  if (ftyp && /heic|heif|mif1|msf1/.test(b.subarray(8, 12).toString("ascii"))) return true; // HEIC
  return false;
}

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
  if (uzunluk > MAX_BAYT) {
    return NextResponse.json({ mesaj: "Dosya çok büyük (en fazla 25 MB)." }, { status: 413 });
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
  if (buf.length > MAX_BAYT) {
    return NextResponse.json({ mesaj: "Dosya çok büyük (en fazla 25 MB)." }, { status: 413 });
  }
  if (!goruntuMu(buf)) {
    return NextResponse.json(
      { mesaj: "Sadece fotoğraf gönderebilirsiniz (JPG, PNG, WebP)." },
      { status: 415 },
    );
  }

  // SUNUCUDA ISLE: 2048px'e kucult, WebP'ye cevir, EXIF/GPS dusur.
  // Ham baytlar diske HIC yazilmaz — yalnizca turev yazilir.
  const islem = await anIsle(buf);
  if (!islem.ok) return NextResponse.json({ mesaj: islem.mesaj }, { status: 415 });

  const id = crypto.randomUUID();
  const dosya = `${id}.webp`;
  const klasor = anlarKlasoru();

  // Once gecici ada yaz, sonra rename: yarim dosya asla gorunmez.
  const gecici = path.join(klasor, `.${dosya}.tmp`);
  try {
    await fsp.writeFile(gecici, new Uint8Array(islem.veri));
    await fsp.rename(gecici, path.join(klasor, dosya));
  } catch (e) {
    await fsp.rm(gecici, { force: true }).catch(() => {});
    console.error("an yazma hatasi", e);
    return NextResponse.json({ mesaj: "Kaydedilemedi. Tekrar deneyin." }, { status: 500 });
  }

  /* HTTP basliklari latin-1: "ğ ş İ ı" ham gonderilirse baslik bozulur.
     Istemci encodeURIComponent ile gonderiyor, burada cozuyoruz. */
  let yukleyen: string | null = null;
  try {
    yukleyen = decodeURIComponent(req.headers.get("x-yukleyen") ?? "").trim().slice(0, 60) || null;
  } catch { yukleyen = null; }
  try {
    anKaydet({
      id, dosya, yukleyen,
      bayt: islem.bayt, genislik: islem.genislik, yukseklik: islem.yukseklik,
    });
  } catch (e) {
    // DB kaydi olmayan dosya oksuz kalir — geri al.
    await fsp.rm(path.join(klasor, dosya), { force: true }).catch(() => {});
    console.error("an kaydi hatasi", e);
    return NextResponse.json({ mesaj: "Kaydedilemedi. Tekrar deneyin." }, { status: 500 });
  }

  return NextResponse.json({
    ok: true, id,
    bayt: islem.bayt,
    oncekiBayt: islem.oncekiBayt,
    kazanc: Math.round((1 - islem.bayt / islem.oncekiBayt) * 100),
  });
}
