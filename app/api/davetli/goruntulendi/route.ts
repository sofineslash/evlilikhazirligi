import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { davetliGetirToken, davetliGoruntulendiIsaretle } from "@/lib/davetliler";
import { DEFAULT_DAVETIYE_ID } from "@/lib/site";
import { hizKontrol } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

/**
 * Yalnizca gercek kullanici tarayicisindan cagirilan goruntulenme takip uctasi.
 * Crawler isteklerini ayirir; ayni oturumda tekrar eden yenilemelerde sayaci sisirmez.
 */
export async function POST(req: NextRequest) {
  try {
    const govde = (await req.json()) as { token?: string; davetiyeId?: string };
    const token = typeof govde?.token === "string" ? govde.token.trim() : "";
    const davetiyeId = typeof govde?.davetiyeId === "string" ? govde.davetiyeId.trim() : DEFAULT_DAVETIYE_ID;

    if (!token || token.length < 8) {
      return NextResponse.json({ ok: false, mesaj: "Geçersiz token" }, { status: 400 });
    }

    // Hiz kontrolu (rate limit): dakikada azami 15 istek
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "yerel";
    const hiz = hizKontrol(`davetli-gor:${ip}:${token}`, { adet: 15, pencere_dk: 1 });
    if (!hiz.ok) {
      return NextResponse.json({ ok: true, tekrarlanan: true }); // hatasiz gec
    }

    // Token ve davetiye dogrulamasi
    const davetli = davetliGetirToken(token, davetiyeId);
    if (!davetli) {
      return NextResponse.json({ ok: false, mesaj: "Davetli bulunamadı" }, { status: 404 });
    }

    // Ayni tarayici oturumunda mukerrer sayimi engelle (Deduplication)
    const cerezDeposu = await cookies();
    const cerezAdi = `dav_g_${token.slice(0, 8)}`;
    const dahaOnceGoruldu = cerezDeposu.has(cerezAdi);

    if (!dahaOnceGoruldu) {
      // Ilk kez goruntulendi — veritabanini guncelle
      davetliGoruntulendiIsaretle(token, davetiyeId);

      // Cerez ile 12 saatlik deduplication damgasi birak
      cerezDeposu.set(cerezAdi, "1", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 12 * 60 * 60,
        path: "/",
      });
    }

    return NextResponse.json({ ok: true, misafir: davetli.ad_soyad });
  } catch (e) {
    return NextResponse.json({ ok: false, hata: "Sunucu hatası" }, { status: 500 });
  }
}
