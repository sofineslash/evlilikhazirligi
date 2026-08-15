import { NextResponse } from "next/server";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { adminMi } from "@/lib/admin";
import { MEDYA_KOK, SAHNELER, UZANTILAR, yuklenenDosya, sahneTuru, type SahneAd } from "@/lib/sahneler";
import { sahneIsle } from "@/lib/gorsel";
import { CFG } from "@/lib/config";

export const dynamic = "force-dynamic";

const MAX_BAYT = CFG.SAHNE_HAM_MAX_BAYT; // HAM dosya tavani; islenmis hali cok kucuk olur

/** Sihirli baytlardan gercek turu cikarir. Istemcinin dedigine GUVENILMEZ. */
function turTespit(b: Buffer): { uzanti: string; mime: string } | null {
  if (b.length < 12) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { uzanti: ".jpg", mime: "image/jpeg" };
  if (b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])))
    return { uzanti: ".png", mime: "image/png" };
  if (b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WEBP")
    return { uzanti: ".webp", mime: "image/webp" };
  if (b.subarray(4, 8).toString("ascii") === "ftyp" && b.subarray(8, 12).toString("ascii").startsWith("avif"))
    return { uzanti: ".avif", mime: "image/avif" };
  return null; // SVG dahil geri kalan her sey reddedilir
}

function gecerliAd(ad: string): ad is SahneAd {
  return SAHNELER.some((s) => s.ad === ad);
}

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
  ".webp": "image/webp", ".avif": "image/avif",
};

/** Yuklenen sahneyi servis eder. Herkese acik — davetiyenin parcasi. */
export async function GET(_req: Request, ctx: { params: Promise<{ ad: string }> }) {
  const { ad } = await ctx.params;
  if (!gecerliAd(ad)) return new NextResponse("Bulunamadı", { status: 404 });

  const dosya = yuklenenDosya(ad);
  if (!dosya) return new NextResponse("Bulunamadı", { status: 404 });

  const veri = await fsp.readFile(dosya.yol);
  return new NextResponse(new Uint8Array(veri), {
    headers: {
      "Content-Type": MIME[dosya.uzanti] ?? "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public, max-age=31536000, immutable", // yol ?v=mtime tasiyor
    },
  });
}

/** Yukleme — SADECE admin. Server Action degil (1 MB govde siniri). */
export async function POST(req: Request, ctx: { params: Promise<{ ad: string }> }) {
  if (!(await adminMi())) return NextResponse.json({ mesaj: "Yetkisiz" }, { status: 401 });

  const { ad } = await ctx.params;
  if (!gecerliAd(ad)) return NextResponse.json({ mesaj: "Geçersiz sahne adı" }, { status: 400 });

  const uzunluk = Number(req.headers.get("content-length") ?? 0);
  if (uzunluk > MAX_BAYT)
    return NextResponse.json({ mesaj: "Dosya çok büyük (en fazla 4 MB)." }, { status: 413 });

  const buf = Buffer.from(await req.arrayBuffer());
  if (buf.length === 0) return NextResponse.json({ mesaj: "Boş dosya." }, { status: 400 });
  if (buf.length > MAX_BAYT)
    return NextResponse.json({ mesaj: "Dosya çok büyük (en fazla 4 MB)." }, { status: 413 });

  const tur = turTespit(buf);
  if (!tur)
    return NextResponse.json(
      { mesaj: "Sadece JPG, PNG, WebP veya AVIF yükleyebilirsiniz." },
      { status: 415 },
    );

  // SUNUCUDA ISLE: 4:5 kirp, WebP'ye cevir, EXIF/GPS dusur, yonelimi gom.
  // Ham baytlar diske HIC yazilmaz — yalnizca turev yazilir.
  const islem = await sahneIsle(buf, sahneTuru(ad));
  if (!islem.ok) return NextResponse.json({ mesaj: islem.mesaj }, { status: 415 });

  await fsp.mkdir(MEDYA_KOK, { recursive: true });
  for (const u of UZANTILAR) {
    const eski = path.join(MEDYA_KOK, ad + u);
    if (fs.existsSync(eski)) await fsp.rm(eski, { force: true });
  }
  const gecici = path.join(MEDYA_KOK, `.${ad}.yukleniyor`);
  await fsp.writeFile(gecici, islem.veri);
  await fsp.rename(gecici, path.join(MEDYA_KOK, ad + ".webp"));

  return NextResponse.json({
    ok: true,
    uzanti: ".webp",
    bayt: islem.bayt,
    oncekiBayt: islem.oncekiBayt,
    kazanc: Math.round((1 - islem.bayt / islem.oncekiBayt) * 100),
  });

}

export async function DELETE(_req: Request, ctx: { params: Promise<{ ad: string }> }) {
  if (!(await adminMi())) return NextResponse.json({ mesaj: "Yetkisiz" }, { status: 401 });
  const { ad } = await ctx.params;
  if (!gecerliAd(ad)) return NextResponse.json({ mesaj: "Geçersiz sahne adı" }, { status: 400 });
  const dosya = yuklenenDosya(ad);
  if (dosya) await fsp.rm(dosya.yol, { force: true });
  return NextResponse.json({ ok: true });
}
