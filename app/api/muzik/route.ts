import { NextResponse } from "next/server";
import fsp from "node:fs/promises";
import path from "node:path";
import { adminMi } from "@/lib/admin";
import { KALICI_MUZIK, REPO_MUZIK, muzikDurumu } from "@/lib/muzik";

export const dynamic = "force-dynamic";

const MAX_BAYT = 25 * 1024 * 1024; // 25 MB max müzik dosyası

export async function GET() {
  return NextResponse.json(muzikDurumu());
}

export async function POST(req: Request) {
  if (!(await adminMi())) {
    return NextResponse.json({ mesaj: "Yetkisiz erişim" }, { status: 401 });
  }

  const tampon = Buffer.from(await req.arrayBuffer());

  if (tampon.length < 100) {
    return NextResponse.json({ mesaj: "Dosya çok küçük veya boş" }, { status: 400 });
  }

  if (tampon.length > MAX_BAYT) {
    return NextResponse.json(
      { mesaj: "Müzik dosyası 25 MB'dan büyük olamaz." },
      { status: 400 }
    );
  }

  try {
    // Hem kalıcı disk (varsa Docker volume) hem repo klasörüne yaz
    await fsp.mkdir(path.dirname(KALICI_MUZIK), { recursive: true });
    await fsp.writeFile(KALICI_MUZIK, tampon);

    if (REPO_MUZIK !== KALICI_MUZIK) {
      try {
        await fsp.mkdir(path.dirname(REPO_MUZIK), { recursive: true });
        await fsp.writeFile(REPO_MUZIK, tampon);
      } catch {}
    }

    return NextResponse.json({
      basarili: true,
      mesaj: "Müzik başarıyla yüklendi",
      durum: muzikDurumu(),
    });
  } catch (err) {
    console.error("Müzik yükleme hatası:", err);
    return NextResponse.json({ mesaj: "Müzik kaydedilemedi" }, { status: 500 });
  }
}

export async function DELETE() {
  if (!(await adminMi())) {
    return NextResponse.json({ mesaj: "Yetkisiz erişim" }, { status: 401 });
  }

  let silindi = false;
  try {
    await fsp.unlink(KALICI_MUZIK);
    silindi = true;
  } catch {}

  if (REPO_MUZIK !== KALICI_MUZIK) {
    try {
      await fsp.unlink(REPO_MUZIK);
      silindi = true;
    } catch {}
  }

  if (silindi) {
    return NextResponse.json({ basarili: true, mesaj: "Müzik silindi" });
  }
  return NextResponse.json({ mesaj: "Dosya bulunamadı veya silinemedi" }, { status: 404 });
}
