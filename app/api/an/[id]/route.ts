import { NextResponse } from "next/server";
import fsp from "node:fs/promises";
import { db } from "@/lib/db";
import { adminMi } from "@/lib/admin";
import { anDosyaYolu, type An } from "@/lib/anlar";
import { galeriAcikMi } from "@/lib/galeri";

export const dynamic = "force-dynamic";

/**
 * Tek fotografi servis eder.
 *
 * ERISIM: admin HER ZAMAN; misafir ancak galeri acikken. Galeri kapaliyken
 * dogru id'yi bilen biri bile goremez — 404 doner. "Kapali" demek
 * "davetiyede gizli" degil, "sunucudan verilmiyor" demek.
 *
 * ?indir=1 -> tarayici goruntulemek yerine indirir.
 */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  const yetkili = (await adminMi()) || galeriAcikMi();
  // Yetkisizde 403 degil 404: 403 "boyle bir fotograf VAR" bilgisini sizdirir.
  if (!yetkili) return new NextResponse("Bulunamadı", { status: 404 });

  const kayit = db().prepare("SELECT * FROM anlar WHERE id = ?").get(id) as An | undefined;
  if (!kayit) return new NextResponse("Bulunamadı", { status: 404 });

  // gizli fotograflari yalnizca admin gorur
  if (kayit.gizli === 1 && !(await adminMi())) {
    return new NextResponse("Bulunamadı", { status: 404 });
  }

  const yol = anDosyaYolu(kayit.dosya);
  if (!yol) return new NextResponse("Bulunamadı", { status: 404 });

  const veri = await fsp.readFile(yol);
  const indir = new URL(req.url).searchParams.get("indir") === "1";

  return new NextResponse(new Uint8Array(veri), {
    headers: {
      "Content-Type": "image/webp",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": indir
        ? `attachment; filename="nisan-${id.slice(0, 8)}.webp"`
        : "inline",
      /* private: ara vekiller onbelleklemesin. Galeri kapatildiginda
         paylasilan bir onbellekten servis edilmeye devam etmesin. */
      "Cache-Control": "private, max-age=3600",
    },
  });
}
