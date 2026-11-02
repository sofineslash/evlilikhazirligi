import { NextResponse } from "next/server";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { CFG } from "@/lib/config";
import { anlarKlasoru, kullanilanBayt } from "@/lib/anlar";
import { yuklemeAcikMi } from "@/lib/yukleme";
import { hizKontrol, istemciAnahtari } from "@/lib/ratelimit";
import { cihazJetonuDogrula } from "@/lib/session";
import { anKaydetVeIsle } from "@/lib/yukleme-isle";

export const dynamic = "force-dynamic";

/** Tek parca tavani — istemciyle AYNI olmali. */
const PARCA_MAX = 8 * 1024 * 1024;
/** Toplam dosya tavani (video). */
const TOPLAM_MAX = 1024 * 1024 * 1024;
/** Yarim kalmis yuklemeler bu sureden sonra cope gider. */
const OLU_PARCA_MS = 6 * 60 * 60 * 1000;

/**
 * PARCALI YUKLEME.
 *
 * Neden gerekli: 409 MB'lik bir video tek istekte gonderilince mobil
 * baglantida kopuyor ve BASTAN basliyor — kullanici "Bağlantı kesildi"
 * goruyor. Parcalara bolununce kopan yalnizca o parca oluyor, istemci
 * onu tekrar deniyor ve kaldigi yerden devam ediyor.
 *
 * Parcalar gecici bir dosyaya SIRAYLA ekleniyor. Son parca gelince
 * dosya normal boru hattina giriyor (fotograf/video tespiti, kucultme).
 */
/**
 * Son parcayla baslayan ISLEME (donusturme) yuklemeye gore tek. Uzun bir
 * videoda isleme 100 sn'yi asinca tunel baglantiyi kesiyor, telefon son
 * parcayi yeniden gonderiyor ve ayni video IKI KEZ isleniyordu (dosya da
 * ustten kesilip bozuluyordu). Ayni kimlikle gelen her istek calisan ise
 * katilir, bitmisse sonucu bir sure hatirlanir.
 */
type IsSonuc = { durum: number; govde: Record<string, unknown> };
const isler: Map<string, Promise<IsSonuc>> =
  ((globalThis as { __parcaIsler?: Map<string, Promise<IsSonuc>> }).__parcaIsler ??= new Map());
const ISI_HATIRLA_MS = 10 * 60_000;

function geciciKlasor(): string {
  const k = path.join(anlarKlasoru(), ".gecici");
  fs.mkdirSync(k, { recursive: true });
  return k;
}

/** Yarim kalmis eski parcalari temizle — yoksa disk sessizce doluyor. */
async function eskileriTemizle(klasor: string) {
  try {
    const simdi = Date.now();
    for (const ad of await fsp.readdir(klasor)) {
      const y = path.join(klasor, ad);
      const st = await fsp.stat(y).catch(() => null);
      if (st && simdi - st.mtimeMs > OLU_PARCA_MS) await fsp.rm(y, { force: true });
    }
  } catch { /* temizlik basarisiz olursa yukleme yine de devam etsin */ }
}

export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (origin && host && new URL(origin).host !== host) {
    return NextResponse.json({ mesaj: "Geçersiz istek." }, { status: 403 });
  }
  if (!yuklemeAcikMi()) {
    return NextResponse.json({ mesaj: "Fotoğraf yükleme şu an kapalı." }, { status: 403 });
  }

  const cerez = req.headers.get("cookie")?.split(";").map((c) => c.trim())
    .find((c) => c.startsWith("nisan_cihaz="))?.slice("nisan_cihaz=".length);
  const cihaz =
    (await cihazJetonuDogrula(req.headers.get("x-cihaz"))) ??
    (await cihazJetonuDogrula(cerez));

  // Parca basina degil, DOSYA basina sinir olsun diye bol: 1 GB / 8 MB = 128 parca
  const hiz = hizKontrol(`parca:${istemciAnahtari(req, cihaz)}`, { adet: 1200, pencere_dk: 30 });
  if (!hiz.ok) return NextResponse.json({ mesaj: hiz.mesaj }, { status: 429 });

  if (kullanilanBayt() >= CFG.MEDYA_KOTA_BAYT) {
    return NextResponse.json({ mesaj: "Depolama alanı doldu." }, { status: 507 });
  }

  /* Yukleme kimligi ISTEMCIDEN gelir ama DOGRULANIR: yalnizca uuid
     bicimi kabul ediliyor. Aksi halde "../" gibi bir deger yol gecisine
     acilirdi. */
  const id = req.headers.get("x-yukleme-id") ?? "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ mesaj: "Geçersiz yükleme kimliği." }, { status: 400 });
  }
  const no = Number(req.headers.get("x-parca-no"));
  const toplam = Number(req.headers.get("x-parca-toplam"));
  if (!Number.isInteger(no) || !Number.isInteger(toplam) || no < 0 || toplam < 1 || no >= toplam) {
    return NextResponse.json({ mesaj: "Geçersiz parça numarası." }, { status: 400 });
  }

  const calisan = isler.get(id);
  if (calisan) {
    const r = await calisan;
    return NextResponse.json(r.govde, { status: r.durum });
  }

  const govde = Buffer.from(await req.arrayBuffer());
  if (govde.length === 0) return NextResponse.json({ mesaj: "Boş parça." }, { status: 400 });
  if (govde.length > PARCA_MAX) {
    return NextResponse.json({ mesaj: "Parça çok büyük." }, { status: 413 });
  }

  const klasor = geciciKlasor();
  if (no === 0) await eskileriTemizle(klasor);
  const yol = path.join(klasor, `${id}.part`);

  /* SIRA + TEKRAR KONTROLU. Parca N, dosyada TAM N * PARCA_MAX baytindan
     baslar (istemci hep ayni boyda parca gonderir).
     - Daha kisaysa bir parca atlanmis: dosya sessizce bozulur, reddet.
     - Daha uzunsa AYNI parca daha once gelmis ve istemci yaniti alamadigi
       icin yeniden gonderiyor. Eskiden bu ikinci kez eklenip videoyu
       bozuyordu ("Bu video açılamadı"); simdi fazlalik kesilip ustune
       yazilir, yani tekrar zararsiz. */
  const suanki = await fsp.stat(yol).then((s) => s.size).catch(() => 0);
  if (no === 0 && suanki > 0) await fsp.rm(yol, { force: true });
  const baslangic = no * PARCA_MAX;
  const mevcut = no === 0 ? 0 : suanki;
  if (no > 0 && mevcut < baslangic) {
    return NextResponse.json({ mesaj: "Yükleme eksik kaldı, baştan deneyin." }, { status: 409 });
  }
  if (no > 0 && mevcut > baslangic) await fsp.truncate(yol, baslangic);
  if (baslangic + govde.length > TOPLAM_MAX) {
    await fsp.rm(yol, { force: true });
    return NextResponse.json({ mesaj: "Dosya çok büyük (en fazla 1 GB)." }, { status: 413 });
  }

  try {
    await fsp.appendFile(yol, new Uint8Array(govde));
  } catch (e) {
    console.error("parca yazma hatasi", e);
    return NextResponse.json({ mesaj: "Kaydedilemedi. Tekrar deneyin." }, { status: 500 });
  }
  const yeniBoyut = baslangic + govde.length;

  // Son parca degilse yalnizca onay don
  if (no < toplam - 1) {
    return NextResponse.json({ ok: true, alinan: no, bayt: yeniBoyut });
  }

  /* SON PARCA: dosya zaten diskte — YOLUNU veriyoruz, bellege okumuyoruz.
     400 MB'lik bir videoyu Buffer'a almak sunucuyu bosuna zorluyordu. */
  const is = (async (): Promise<IsSonuc> => {
    try {
      let yukleyen: string | null = null;
      try {
        yukleyen = decodeURIComponent(req.headers.get("x-yukleyen") ?? "").trim().slice(0, 60) || null;
      } catch { yukleyen = null; }

      /* Istemci gonderdigi TOPLAM bayti bildiriyor: birlesen dosya ondan
         farkliysa video "bozuk" diye degil, "eksik geldi" diye reddedilir. */
      const beklenenToplam = Number(req.headers.get("x-dosya-bayt"));
      if (Number.isFinite(beklenenToplam) && beklenenToplam > 0 && beklenenToplam !== yeniBoyut) {
        await fsp.rm(yol, { force: true });
        console.error("parca toplam uyusmazligi", { beklenenToplam, yeniBoyut, toplam });
        return { durum: 409, govde: { mesaj: "Yükleme eksik kaldı. Tekrar deneyin." } };
      }

      const sonuc = await anKaydetVeIsle({ yol, bayt: yeniBoyut }, yukleyen);
      await fsp.rm(yol, { force: true });
      if (!sonuc.ok) return { durum: 415, govde: { mesaj: sonuc.mesaj } };
      return { durum: 200, govde: sonuc };
    } catch (e) {
      await fsp.rm(yol, { force: true }).catch(() => {});
      console.error("parca birlestirme hatasi", e);
      return { durum: 500, govde: { mesaj: "İşlenemedi. Tekrar deneyin." } };
    }
  })();
  isler.set(id, is);
  void is.finally(() => { setTimeout(() => isler.delete(id), ISI_HATIRLA_MS).unref?.(); });

  const r = await is;
  return NextResponse.json(r.govde, { status: r.durum });
}

/** Kesilen bir yuklemenin nereden devam edecegini soylar. */
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ bayt: 0 });
  const yol = path.join(geciciKlasor(), `${id}.part`);
  const bayt = await fsp.stat(yol).then((s) => s.size).catch(() => 0);
  return NextResponse.json({ bayt });
}
