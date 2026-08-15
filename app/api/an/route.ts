import { NextResponse } from "next/server";
import crypto from "node:crypto";
import fsp from "node:fs/promises";
import path from "node:path";
import { CFG } from "@/lib/config";
import { anIsle } from "@/lib/gorsel";
import { anKaydet, anlarKlasoru, kullanilanBayt } from "@/lib/anlar";
import { videoIsle } from "@/lib/video";
import { yuklemeAcikMi } from "@/lib/yukleme";
import { hizKontrol, istemciAnahtari } from "@/lib/ratelimit";
import { cihazJetonuDogrula } from "@/lib/session";

export const dynamic = "force-dynamic";

/* Ham dosya tavanlari. Islenmis hali her ikisinde de cok daha kucuk olur.
   Video icin ayri ve yuksek bir tavan gerekiyor: 1 dakikalik 4K kayit
   telefonda rahat 300 MB ediyor ve fotograf tavanina takilirsa misafir
   "neden yuklenmiyor" diye kaliyor. */
const FOTO_MAX_BAYT = 25 * 1024 * 1024;
const VIDEO_MAX_BAYT = 600 * 1024 * 1024;

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

/**
 * Video mu? Yine SIHIRLI BAYT — istemcinin dedigi MIME'a guvenilmez.
 *
 * ftyp markalari: isom/mp4x/M4V (MP4), qt (MOV, iPhone), 3gp (eski Android).
 * WebM/MKV EBML imzasiyla baslar.
 * HEIC de ftyp tasiyor ama GORUNTU — goruntuMu() once cagrilir, oraya duser.
 */
function videoMu(b: Buffer): boolean {
  if (b.length < 12) return false;
  const ftyp = b.subarray(4, 8).toString("ascii") === "ftyp";
  if (ftyp) {
    const marka = b.subarray(8, 12).toString("ascii");
    if (/isom|iso2|mp4|avc1|M4V|mmp4|dash/i.test(marka)) return true;
    if (marka.startsWith("qt")) return true;                    // MOV
    if (/^3g/i.test(marka)) return true;                        // 3GP
  }
  if (b.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))) return true; // WebM/MKV
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

  const foto = goruntuMu(buf);
  const video = !foto && videoMu(buf);
  if (!foto && !video) {
    return NextResponse.json(
      { mesaj: "Sadece fotoğraf veya video gönderebilirsiniz." },
      { status: 415 },
    );
  }
  if (foto && buf.length > FOTO_MAX_BAYT) {
    return NextResponse.json({ mesaj: "Fotoğraf çok büyük (en fazla 25 MB)." }, { status: 413 });
  }
  if (video && buf.length > VIDEO_MAX_BAYT) {
    return NextResponse.json({ mesaj: "Video çok büyük (en fazla 600 MB)." }, { status: 413 });
  }

  /* SUNUCUDA ISLE. Ham baytlar diske HIC yazilmaz — yalnizca turev.
     Fotograf: 2048px, WebP, EXIF/GPS dusuk.
     Video   : 1080p, H.264/AAC, faststart, metadata dusuk + kapak karesi. */
  const islem = video ? await videoIsle(buf) : await anIsle(buf);
  if (!islem.ok) return NextResponse.json({ mesaj: islem.mesaj }, { status: 415 });

  /* Video ve fotograf sonuclari AYRI tipler; `as` ile zorlamak ileride
     biri alan adini degistirdiginde derleyiciyi susturur ve hata ancak
     calisma aninda ortaya cikardi. Acik dallanma her iki yolu da
     derleyiciye dogrulattiriyor. */
  const kapakVeri: Buffer | null = islem.tur === "video" ? islem.kapak : null;
  const sureVeri: number | null = islem.tur === "video" ? islem.sure : null;

  const id = crypto.randomUUID();
  const dosya = video ? `${id}.mp4` : `${id}.webp`;
  const kapakAd = video ? `${id}-kapak.jpg` : null;
  const klasor = anlarKlasoru();

  // Once gecici ada yaz, sonra rename: yarim dosya asla gorunmez.
  const yazilanlar: string[] = [];
  const yaz = async (ad: string, veri: Buffer) => {
    const gecici = path.join(klasor, `.${ad}.tmp`);
    try {
      await fsp.writeFile(gecici, new Uint8Array(veri));
      await fsp.rename(gecici, path.join(klasor, ad));
      yazilanlar.push(ad);
    } catch (e) {
      await fsp.rm(gecici, { force: true }).catch(() => {});
      throw e;
    }
  };
  try {
    await yaz(dosya, islem.veri);
    if (kapakAd && kapakVeri) await yaz(kapakAd, kapakVeri);
  } catch (e) {
    for (const ad of yazilanlar) await fsp.rm(path.join(klasor, ad), { force: true }).catch(() => {});
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
      tur: video ? "video" : "foto",
      sure: sureVeri,
      kapak: kapakAd,
    });
  } catch (e) {
    // DB kaydi olmayan dosya oksuz kalir — geri al (kapak dahil).
    for (const ad of yazilanlar) await fsp.rm(path.join(klasor, ad), { force: true }).catch(() => {});
    console.error("an kaydi hatasi", e);
    return NextResponse.json({ mesaj: "Kaydedilemedi. Tekrar deneyin." }, { status: 500 });
  }

  return NextResponse.json({
    ok: true, id,
    tur: video ? "video" : "foto",
    bayt: islem.bayt,
    oncekiBayt: islem.oncekiBayt,
    kazanc: Math.round((1 - islem.bayt / islem.oncekiBayt) * 100),
  });
}
