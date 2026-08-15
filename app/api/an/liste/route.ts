import { NextResponse } from "next/server";
import { adminMi } from "@/lib/admin";
import { anlariListele } from "@/lib/anlar";
import { galeriAcikMi } from "@/lib/galeri";

export const dynamic = "force-dynamic";

/**
 * Galerinin GUNCEL listesi.
 *
 * Neden var: sayfa acilirken liste sunucudan bir kez prop olarak geliyordu
 * ve orada donuyordu. Misafir fotograf yukleyip galeriyi acinca kendi
 * fotografini GOREMIYORDU — yuklenmedi sanip tekrar tekrar yukluyordu.
 * Pencere her acildiginda buraya sorup listeyi tazeliyor.
 *
 * Erisim kurali /api/an/<id> ile AYNI: admin her zaman, misafir ancak
 * galeri acikken. Kapaliyken id listesi de sizmamali.
 */
export async function GET() {
  const admin = await adminMi();
  if (!admin && !galeriAcikMi()) {
    return NextResponse.json({ mesaj: "Bulunamadı" }, { status: 404 });
  }

  const hepsi = anlariListele(200);
  const anlar = (admin ? hepsi : hepsi.filter((a) => a.gizli === 0)).map((a) => ({
    id: a.id,
    yukleyen: a.yukleyen,
  }));

  return NextResponse.json(
    { anlar },
    { headers: { "Cache-Control": "no-store" } },
  );
}
