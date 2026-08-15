import { NextResponse } from "next/server";
import fs from "node:fs";
import fsp from "node:fs/promises";
import { db } from "@/lib/db";
import { adminMi } from "@/lib/admin";
import { anDosyaYolu, type An } from "@/lib/anlar";
import { galeriAcikMi } from "@/lib/galeri";

export const dynamic = "force-dynamic";

/**
 * Tek dosyayi servis eder — fotograf, video ya da videonun kapak karesi.
 *
 * ERISIM: admin HER ZAMAN; misafir ancak galeri acikken. Galeri kapaliyken
 * dogru id'yi bilen biri bile goremez — 404 doner. "Kapali" demek
 * "davetiyede gizli" degil, "sunucudan verilmiyor" demek.
 *
 * ?kapak=1 -> videonun kapak karesi (JPEG)
 * ?indir=1 -> tarayici goruntulemek yerine indirir
 */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  const admin = await adminMi();
  // Yetkisizde 403 degil 404: 403 "boyle bir dosya VAR" bilgisini sizdirir.
  if (!admin && !galeriAcikMi()) return new NextResponse("Bulunamadı", { status: 404 });

  const kayit = db().prepare("SELECT * FROM anlar WHERE id = ?").get(id) as An | undefined;
  if (!kayit) return new NextResponse("Bulunamadı", { status: 404 });
  if (kayit.gizli === 1 && !admin) return new NextResponse("Bulunamadı", { status: 404 });

  const url = new URL(req.url);
  const kapakIste = url.searchParams.get("kapak") === "1";
  const indir = url.searchParams.get("indir") === "1";

  const dosyaAdi = kapakIste && kayit.kapak ? kayit.kapak : kayit.dosya;
  const yol = anDosyaYolu(dosyaAdi);
  if (!yol) return new NextResponse("Bulunamadı", { status: 404 });

  const video = kayit.tur === "video" && !kapakIste;
  const mime = video ? "video/mp4" : kapakIste ? "image/jpeg" : "image/webp";
  const uzanti = video ? "mp4" : kapakIste ? "jpg" : "webp";

  const ortak: Record<string, string> = {
    "Content-Type": mime,
    "X-Content-Type-Options": "nosniff",
    "Content-Disposition": indir
      ? `attachment; filename="nisan-${id.slice(0, 8)}.${uzanti}"`
      : "inline",
    /* private: ara vekiller onbelleklemesin. Galeri kapatildiginda
       paylasilan bir onbellekten servis edilmeye devam etmesin. */
    "Cache-Control": "private, max-age=3600",
  };

  /* VIDEO: Range destegi SART. Onsuz iOS Safari videoyu hic oynatmiyor
     (206 bekliyor) ve ileri sarma her yerde calismiyor — tarayici
     dosyanin tamamini indirmeden konumlanamiyor. */
  if (video) {
    const boyut = (await fsp.stat(yol)).size;
    const aralik = req.headers.get("range");

    if (aralik) {
      const m = /^bytes=(\d*)-(\d*)$/.exec(aralik.trim());
      if (!m) {
        return new NextResponse("Geçersiz aralık", {
          status: 416,
          headers: { "Content-Range": `bytes */${boyut}` },
        });
      }
      let bas = m[1] ? Number(m[1]) : 0;
      let son = m[2] ? Number(m[2]) : boyut - 1;
      // Sondan N bayt istegi: "bytes=-500"
      if (!m[1] && m[2]) { bas = Math.max(0, boyut - Number(m[2])); son = boyut - 1; }
      if (!Number.isFinite(bas) || !Number.isFinite(son) || bas > son || bas >= boyut) {
        return new NextResponse("Geçersiz aralık", {
          status: 416,
          headers: { "Content-Range": `bytes */${boyut}` },
        });
      }
      son = Math.min(son, boyut - 1);

      const akis = fs.createReadStream(yol, { start: bas, end: son });
      return new NextResponse(akis as unknown as ReadableStream, {
        status: 206,
        headers: {
          ...ortak,
          "Accept-Ranges": "bytes",
          "Content-Range": `bytes ${bas}-${son}/${boyut}`,
          "Content-Length": String(son - bas + 1),
        },
      });
    }

    // Aralik istenmediyse tamamini AKIS olarak ver — 100 MB'i belleğe almayalim.
    const akis = fs.createReadStream(yol);
    return new NextResponse(akis as unknown as ReadableStream, {
      headers: { ...ortak, "Accept-Ranges": "bytes", "Content-Length": String(boyut) },
    });
  }

  const veri = await fsp.readFile(yol);
  return new NextResponse(new Uint8Array(veri), { headers: ortak });
}
