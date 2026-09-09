import { NextResponse } from "next/server";
import fsp from "node:fs/promises";
import path from "node:path";
import { adminMi } from "@/lib/admin";
import { MUZIK_YOLU, muzikDurumu } from "@/lib/muzik";

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
    // Klasörün varlığından emin ol
    await fsp.mkdir(path.dirname(MUZIK_YOLU), { recursive: true });
    // Dosyayı public/muzik/davetiye.mp3 olarak kaydet
    await fsp.writeFile(MUZIK_YOLU, tampon);

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

  try {
    await fsp.unlink(MUZIK_YOLU);
    return NextResponse.json({ basarili: true, mesaj: "Müzik silindi" });
  } catch {
    return NextResponse.json({ mesaj: "Dosya bulunamadı veya silinemedi" }, { status: 404 });
  }
}
