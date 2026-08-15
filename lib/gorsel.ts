import sharp from "sharp";
import { CFG } from "./config";
import { ORAN, type SahneTur } from "./sahneler";
import { goruntuyuCoz } from "./video";
import heicCevir from "heic-convert";

/**
 * Sunucu tarafi gorsel isleme.
 *
 * Neden var: admin panelinden 2.4 MB'lik PNG'ler yuklendi. Salon sebekesi
 * tikanikken bes sahne x 2.4 MB davetiyenin hic acilmamasi demek.
 *
 * Ne yapiyor:
 *   1. .rotate()  — EXIF yonelimini piksele gomer. Metadata dusmeden ONCE
 *                   yapilmali, yoksa iPhone fotograflarinin yarisi yan gelir.
 *   2. resize     — 4:5 dikey, kirparak (cover). Tek oran karari tasarimdan.
 *   3. webp       — ~%90 daha kucuk dosya, gorsel fark yok.
 *   4. metadata   — sharp varsayilan olarak ATAR. EXIF/GPS temizligi bedava;
 *                   ayrica bir sey yapmaya gerek yok, sadece bozmamak lazim.
 *
 * Ham baytlar diske ASLA yazilmaz — bellekten islenir, yalnizca turev yazilir.
 */

/** sharp'in cozebildigi bicimler. HEIC hazir libvips'te YOKTUR. */
const DESTEKLENEN = new Set(["jpeg", "png", "webp", "avif", "gif", "tiff"]);

/** Kesme figurun uzun kenar tavani — kartta kucuk gorunuyor, buyuk olmasina gerek yok. */
const PNG_UZUN_KENAR = 700;

/**
 * HEIF/HEIC mi? SIHIRLI BAYTTAN bakiyoruz, sharp'in metadata'sindan DEGIL.
 * sharp bazi HEIF turevlerinde format'i baska raporluyor ya da metadata
 * okurken patliyor; ikisinde de HEIF yolu atlanip dosya cozulemeden
 * "islenmis" gibi devam ediyordu.
 */
function heifMi(b: Buffer): boolean {
  if (b.length < 12) return false;
  if (b.subarray(4, 8).toString("ascii") !== "ftyp") return false;
  return /heic|heix|heim|heis|hevc|mif1|msf1/i.test(b.subarray(8, 12).toString("ascii"));
}

/* `tur` bir AYRAC: video sonucuyla birlikte tek birlesimde kullaniliyor
   ve TypeScript hangi dalda oldugumuzu ancak boyle bilebiliyor. */
export type IslemSonuc =
  | { ok: true; tur: "foto"; veri: Buffer; bayt: number; oncekiBayt: number;
      genislik: number; yukseklik: number }
  | { ok: false; mesaj: string };

export async function sahneIsle(ham: Buffer, tur: SahneTur = "sahne"): Promise<IslemSonuc> {
  try {
    const meta = await sharp(ham, { limitInputPixels: 40_000_000, failOn: "truncated" }).metadata();

    if (!meta.format || !DESTEKLENEN.has(meta.format)) {
      return {
        ok: false,
        mesaj:
          meta.format === "heif"
            ? "iPhone'unuzda Ayarlar → Kamera → Biçimler → 'En Uyumlu' seçip tekrar deneyin."
            : "Bu görsel biçimi desteklenmiyor. JPG, PNG veya WebP yükleyin.",
      };
    }

    const boru = sharp(ham, { limitInputPixels: 40_000_000, failOn: "truncated" }).rotate();

    if (tur === "png") {
      /* Kesme figur.
         1) trim() — figurun etrafindaki BOS SEFFAF payi kirpar. Bu olmadan
            genis payli bir PNG ekranda kucuk, dar payli olan buyuk gorunur;
            her yuklemede boyut zipliyordu. Trim'den sonra figur cerceveyi
            doldurur ve ekrandaki boy her dosyada AYNI olur.
         2) fit: inside — oran korunur, kirpma yok.
         3) WebP alfa kanalini destekler, arka plan seffaf kalir. */
      let kirpik = boru;
      try {
        // threshold: hafif yari-saydam kenarlari da temizler
        kirpik = boru.trim({ threshold: 8 });
        await kirpik.clone().toBuffer();          // tamamen seffaf gorselde patlar
      } catch {
        kirpik = sharp(ham, { limitInputPixels: 40_000_000 }).rotate();  // trim'siz devam
      }

      const veri = await kirpik
        .resize(PNG_UZUN_KENAR, PNG_UZUN_KENAR, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 88, effort: 4, alphaQuality: 100 })
        .toBuffer();
      const m = await sharp(veri).metadata();
      return { ok: true, tur: "foto", veri, bayt: veri.length, oncekiBayt: ham.length,
               genislik: m.width ?? 0, yukseklik: m.height ?? 0 };
    }

    const veri = await boru
      .resize(ORAN.w, ORAN.h, { fit: "cover", position: "attention" })
      .webp({ quality: 82, effort: 4 })
      .toBuffer();

    return {
      ok: true, tur: "foto",
      veri,
      bayt: veri.length,
      oncekiBayt: ham.length,
      genislik: ORAN.w,
      yukseklik: ORAN.h,
    };
  } catch (e) {
    console.error("gorsel isleme hatasi", e);
    return { ok: false, mesaj: "Görsel işlenemedi. Başka bir dosya deneyin." };
  }
}

/**
 * Misafir fotografi ("an") isleme.
 *
 * Sahne islemeden FARKI: KIRPMA YOK. Sahne 4:5'e kirpiliyor cunku
 * tasarimda sabit bir yuvaya oturuyor. Misafirin cektigi kare ise
 * kompozisyonun kendisi — kirpmak insanlarin kafasini kesiyor.
 * fit: "inside" oran koruyarak yalnizca kucultur.
 *
 * Boyut dusurme burada: 4000px'lik bir iPhone karesi 2048px'e iner,
 * ~8 MB JPEG ~400 KB WebP olur. 20 GB kota bu sayede yetiyor.
 *
 * EXIF/GPS: sharp metadata'yi varsayilan olarak ATAR. Misafirin ev
 * konumu fotografin icinde bize gelmez.
 */
export async function anIsle(ham: Buffer): Promise<IslemSonuc> {
  /* limitInputPixels: 200 MP. Onceki 80 MP degeri Samsung'un 108/200 MP
     kiplerini reddediyordu ve misafir sebebini anlamadan "islenemedi"
     goruyordu. */
  const AYAR = { limitInputPixels: 200_000_000, failOn: "none" as const };

  const cevir = async (girdi: Buffer) => {
    const veri = await sharp(girdi, AYAR)
      .rotate()                                   // EXIF yonelimini piksele gom (metadata dusmeden ONCE)
      .resize(CFG.FOTO_UZUN_KENAR, CFG.FOTO_UZUN_KENAR, {
        fit: "inside",
        withoutEnlargement: true,                 // kucuk fotografi buyutup bozma
      })
      .webp({ quality: Math.round(CFG.FOTO_WEBP_KALITE * 100), effort: 4 })
      .toBuffer();
    const m = await sharp(veri).metadata();
    /* failOn: "none" sharp'i toleransli yapiyor — bozuk girdide HATA
       FIRLATMAK yerine bos/kirpik bir goruntu uretebiliyor. O zaman
       yukleme "basarili" gorunup galeride bos kare cikiyor. Ciktiyi
       akla yatkinlik kontrolunden geciriyoruz. */
    if (!m.width || !m.height || m.width < 16 || m.height < 16 || veri.length < 1024) {
      throw new Error(`bozuk cikti: ${m.width}x${m.height}, ${veri.length} bayt`);
    }
    /* DUZ RENK KONTROLU. Cozulemeyen bir dosyada sharp (failOn:"none"
       ile) hata firlatmak yerine TEK RENK bir goruntu uretebiliyor —
       canlida HEIC'ler duz MAVI kare olarak kaydedildi ve "%100
       kucultuldu" yazdi. Gercek bir fotografta gurultu her zaman vardir;
       standart sapma sifira yakinsa cozme basarisiz olmus demektir. */
    const ist = await sharp(veri).stats();
    const enYuksekSapma = Math.max(...ist.channels.map((k) => k.stdev));
    if (enYuksekSapma < 1) {
      throw new Error(`duz renk cikti (sapma ${enYuksekSapma.toFixed(2)}) — cozulemedi`);
    }
    return {
      ok: true as const, tur: "foto" as const, veri,
      bayt: veri.length, oncekiBayt: ham.length,
      genislik: m.width, yukseklik: m.height,
    };
  };

  /* HEIF/HEIC AYRI YOL. Ne sharp ne ffmpeg cozebiliyor (ikisi de test
     edildi: sharp "Decoder plugin generated an error", ffmpeg "moov atom
     not found" — ffmpeg'in HEVC cozucusu var ama HEIF demuxer'i yok).
     heic-convert saf JS bir cozucu; yavas ama her mimaride calisiyor
     (~540 ms / 2 MP, olculdu). Misafire "telefon ayarlarini degistir"
     demek yerine sunucu isi hallediyor — Samsung ve iPhone paylasimlarinin
     buyuk kismi HEIF geliyor. */
  let girdi = ham;
  if (heifMi(ham)) {
    try {
      girdi = await heicCevir({ buffer: ham, format: "JPEG", quality: 0.92 });
    } catch (e) {
      /* HEIF cozulemediyse DEVAM ETME. Eskiden ham veriyle devam
         ediliyordu ve sharp cop bir goruntu uretip kaydediyordu. */
      console.error("an isleme: HEIF cozulemedi", (e as Error).message);
      return {
        ok: false,
        mesaj: "Bu fotoğraf açılamadı. Telefon ayarlarından fotoğraf biçimini JPEG yapıp tekrar deneyin.",
      };
    }
  }

  /* Once sharp (hizli), olmazsa ffmpeg ile cozup tekrar dene. ffmpeg
     sharp'in takildigi bazi bicimleri (bozuk EXIF, alisilmadik TIFF)
     cozebiliyor. HEIC'te ikisi de cozemiyor, o yuzden yukarida ayrildi. */
  try {
    return await cevir(girdi);
  } catch (e) {
    console.error("an isleme: sharp basarisiz, ffmpeg deneniyor", (e as Error).message);
  }

  const cozulmus = await goruntuyuCoz(girdi);
  if (!cozulmus) {
    return { ok: false, mesaj: "Fotoğraf işlenemedi. Başka bir dosya deneyin." };
  }
  try {
    return await cevir(cozulmus);
  } catch (e) {
    console.error("an isleme: ffmpeg ciktisi da islenemedi", (e as Error).message);
    return { ok: false, mesaj: "Fotoğraf işlenemedi. Başka bir dosya deneyin." };
  }
}

/** Islenmis dosya butcede mi — admin panelinde uyari gostermek icin. */
export function butcedeMi(bayt: number): boolean {
  return bayt <= CFG.SAHNE_MAX_BAYT;
}
