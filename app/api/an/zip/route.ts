import { NextResponse } from "next/server";
import fsp from "node:fs/promises";
import { db } from "@/lib/db";
import { adminMi } from "@/lib/admin";
import { anDosyaYolu, anlariListele, type An } from "@/lib/anlar";
import { zipYap, ZIP_MAX_BAYT, ZIP_MAX_DOSYA } from "@/lib/zip";

export const dynamic = "force-dynamic";

/**
 * Dosya adini ASCII'ye katlar: "Ayşe Yılmaz" -> "Ayse Yilmaz".
 *
 * NEDEN: arsivi UTF-8 bayragiyla (bit 11) yaziyoruz ve bu SPEC'E UYGUN —
 * Finder, Windows Gezgini, 7-Zip ve Python dogru cozuyor. Ama macOS'un
 * yerlesik `unzip`'i (Info-ZIP 6.00, 2009) bayragi yok sayiyor ve
 * "Illegal byte sequence" verip cikarmayi BASARISIZ birakiyor. Olculdu.
 *
 * Ad yalnizca bir etiket; fotografin kendisi etkilenmiyor. Her araçta
 * acilabilmesi, adin harfi harfine dogru olmasindan daha degerli.
 */
function asciyeKatla(s: string): string {
  return s
    .replace(/ı/g, "i").replace(/İ/g, "I")   // NFD ile ayrismazlar, acik gerekli
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^\x20-\x7E]/g, "")            // kalan ASCII disi her sey
    .replace(/[^A-Za-z0-9 _-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Toplu indirme — YALNIZCA ADMIN.
 *
 * Misafir tarafinda "Tümünü indir" butonu kaldirildi (kullanici karari).
 * Butonu kaldirmak tek basina yetmez: ucu acik biraksaydik adresi bilen
 * biri galeri acikken tum arsivi tek istekle cekebilirdi. Kapi da kapali.
 * Misafir tek tek indirmeye devam eder (/api/an/<id>?indir=1).
 */
export async function POST(req: Request) {
  if (!(await adminMi())) {
    return NextResponse.json({ mesaj: "Bulunamadı" }, { status: 404 });
  }

  // CSRF
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (origin && host && new URL(origin).host !== host) {
    return NextResponse.json({ mesaj: "Geçersiz istek." }, { status: 403 });
  }

  let govde: { idler?: unknown; tumu?: unknown };
  try {
    govde = await req.json();
  } catch {
    return NextResponse.json({ mesaj: "Geçersiz istek." }, { status: 400 });
  }

  let kayitlar: An[];
  if (govde.tumu === true) {
    kayitlar = anlariListele(ZIP_MAX_DOSYA);
  } else {
    const idler = Array.isArray(govde.idler) ? govde.idler.filter((x) => typeof x === "string") : [];
    if (idler.length === 0) {
      return NextResponse.json({ mesaj: "Hiç fotoğraf seçilmedi." }, { status: 400 });
    }
    if (idler.length > ZIP_MAX_DOSYA) {
      return NextResponse.json({ mesaj: "Çok fazla dosya seçildi." }, { status: 400 });
    }
    // Parametreli IN listesi — id'ler dogrudan SQL'e GOMULMEZ.
    const yer = idler.map(() => "?").join(",");
    kayitlar = db()
      .prepare(`SELECT * FROM anlar WHERE id IN (${yer}) ORDER BY olusturuldu DESC`)
      .all(...idler) as An[];
  }

  if (kayitlar.length === 0) {
    return NextResponse.json({ mesaj: "İndirilecek fotoğraf yok." }, { status: 404 });
  }

  /* ZIP64 yazmadigimiz icin 4 GB ustunu URETEMEYIZ. Sessizce bozuk bir
     arsiv vermektense burada durup kullaniciya daha az secmesini soyluyoruz. */
  const toplam = kayitlar.reduce((t, k) => t + k.bayt, 0);
  if (toplam > ZIP_MAX_BAYT) {
    return NextResponse.json(
      { mesaj: "Seçim çok büyük (4 GB üstü). Daha az fotoğraf seçin." },
      { status: 413 },
    );
  }

  const girdiler = [];
  for (const k of kayitlar) {
    const yol = anDosyaYolu(k.dosya);
    if (!yol) continue;                       // diskte yoksa atla, patlama
    const veri = await fsp.readFile(yol);
    const kim = asciyeKatla(k.yukleyen ?? "");
    const damga = k.olusturuldu.slice(0, 19).replace(/[:T]/g, "-");
    girdiler.push({
      ad: `${damga}${kim ? " " + kim : ""} ${k.id.slice(0, 8)}.webp`,
      veri,
      tarih: new Date(k.olusturuldu),
    });
  }
  if (girdiler.length === 0) {
    return NextResponse.json({ mesaj: "Dosyalar bulunamadı." }, { status: 404 });
  }

  const zip = zipYap(girdiler);
  const bugun = new Date().toISOString().slice(0, 10);
  return new NextResponse(new Uint8Array(zip), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="nisan-fotograflar-${bugun}.zip"`,
      "Content-Length": String(zip.length),
      "Cache-Control": "no-store",
    },
  });
}
