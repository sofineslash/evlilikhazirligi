import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { db } from "@/lib/db";
import { CFG } from "@/lib/config";
import { adKontrol } from "@/lib/normalizeAd";
import { hizKontrol, istemciAnahtari } from "@/lib/ratelimit";
import { cihazJetonuDogrula } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  // CSRF: route handler Server Action'in origin kontrolunu almaz (E: 4.8)
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (origin && host && new URL(origin).host !== host) {
    return NextResponse.json({ mesaj: "Geçersiz istek." }, { status: 403 });
  }

  // Cihaz jetonu: ONCE header (proxy.ts enjekte etti), SONRA cerez.
  // Bu sira kritik — jetonu yaratan istekte cerez henuz yok (E6).
  const headerJeton = req.headers.get("x-cihaz");
  const cerezJeton = req.headers
    .get("cookie")
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("nisan_cihaz="))
    ?.slice("nisan_cihaz=".length);
  const cihaz = (await cihazJetonuDogrula(headerJeton)) ?? (await cihazJetonuDogrula(cerezJeton));

  if (!cihaz) {
    return NextResponse.json(
      { mesaj: "Oturum başlatılamadı. Sayfayı yenileyip tekrar deneyin." },
      { status: 400 },
    );
  }

  const hiz = hizKontrol(istemciAnahtari(req, cihaz), CFG.KATILIM_HIZ);
  if (!hiz.ok) {
    return NextResponse.json({ mesaj: hiz.mesaj }, { status: 429 });
  }

  let govde: any;
  try {
    govde = await req.json();
  } catch {
    return NextResponse.json({ mesaj: "Form okunamadı." }, { status: 400 });
  }

  const kontrol = adKontrol(String(govde.ad ?? ""));
  if (!kontrol.ok) return NextResponse.json({ mesaj: kontrol.mesaj }, { status: 400 });

  const geliyor = govde.geliyor === true;
  const kisi = geliyor
    ? Math.min(CFG.KISI_MAX, Math.max(1, Number(govde.kisi) || 1))
    : 0;
  const dilek = String(govde.dilek ?? "").trim().slice(0, CFG.DILEK_MAX_KARAKTER) || null;
  const zorla = govde.zorla === true;
  const tekKelime = kontrol.tekKelime;

  const d = db();
  const ipHash = crypto
    .createHash("sha256")
    .update(req.headers.get("cf-connecting-ip") ?? "yerel")
    .digest("hex")
    .slice(0, 16);

  try {
    // Kontrol + yazma TEK transaction icinde. Kismi tekil indeks yarisi ayrica kapatir.
    const yaz = d.transaction(() => {
      if (!zorla && !tekKelime) {
        const mevcut = d
          .prepare(
            "SELECT ad_soyad, geliyor, kisi_sayisi FROM katilimlar WHERE ad_soyad_norm = ? AND cift_isaretli = 0 AND tek_kelime = 0",
          )
          .get(kontrol.norm) as
          | { ad_soyad: string; geliyor: number; kisi_sayisi: number }
          | undefined;
        if (mevcut) return { cakisma: mevcut };
      }
      d.prepare(
        `INSERT INTO katilimlar
         (id, ad_soyad, ad_soyad_norm, geliyor, kisi_sayisi, dilek, cihaz_jetonu,
          cift_isaretli, tek_kelime, ip_hash, olusturuldu)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      ).run(
        crypto.randomUUID(),
        String(govde.ad).trim(),
        kontrol.norm,
        geliyor ? 1 : 0,
        kisi,
        dilek,
        cihaz,
        zorla ? 1 : 0,
        tekKelime ? 1 : 0,
        ipHash,
        new Date().toISOString(),
      );
      return { cakisma: null };
    });

    const r = yaz.immediate();
    if (r.cakisma) {
      return NextResponse.json(
        {
          kayit: {
            ad: r.cakisma.ad_soyad,
            geliyor: r.cakisma.geliyor === 1,
            kisi: r.cakisma.kisi_sayisi,
          },
        },
        { status: 409 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    // Es zamanli ikinci gonderim indekse takildi -> yumusak yola dus, 500 DEGIL
    if (String(e?.code) === "SQLITE_CONSTRAINT_UNIQUE") {
      const mevcut = d
        .prepare(
          "SELECT ad_soyad, geliyor, kisi_sayisi FROM katilimlar WHERE ad_soyad_norm = ? AND cift_isaretli = 0 AND tek_kelime = 0",
        )
        .get(kontrol.norm) as any;
      return NextResponse.json(
        { kayit: { ad: mevcut.ad_soyad, geliyor: mevcut.geliyor === 1, kisi: mevcut.kisi_sayisi } },
        { status: 409 },
      );
    }
    console.error("katilim hatasi", e);
    return NextResponse.json({ mesaj: "Kayıt sırasında bir hata oldu." }, { status: 500 });
  }
}
