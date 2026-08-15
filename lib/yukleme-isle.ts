import crypto from "node:crypto";
import fsp from "node:fs/promises";
import path from "node:path";
import { anIsle } from "./gorsel";
import { videoIsle } from "./video";
import { anKaydet, anlarKlasoru } from "./anlar";

/**
 * Yuklenen ham baytlari isleyip kaydeder.
 *
 * TEK YERDE: hem tek istekli yukleme (/api/an) hem parcali yukleme
 * (/api/an/parca) burayi cagiriyor. Iki yerde kopyalansaydi biri
 * digerinden kayardi — tur tespiti, kucultme ve geri alma mantiginin
 * ayrisması sessiz veri bozulmasi demek.
 */

/** Fotograf tavani. Video icin ayri ve cok daha yuksek. */
export const FOTO_MAX_BAYT = 25 * 1024 * 1024;
export const VIDEO_MAX_BAYT = 600 * 1024 * 1024;

/**
 * Sihirli baytlardan gercek turu cikarir — istemcinin dedigi MIME'a GUVENILMEZ.
 * SVG bilerek DISARIDA: icinde script tasiyabilir.
 */
export function goruntuMu(b: Buffer): boolean {
  if (b.length < 12) return false;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return true;                    // JPEG
  if (b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return true; // PNG
  if (b.subarray(0, 4).toString("ascii") === "RIFF" &&
      b.subarray(8, 12).toString("ascii") === "WEBP") return true;                     // WebP
  const ftyp = b.subarray(4, 8).toString("ascii") === "ftyp";
  if (ftyp && b.subarray(8, 12).toString("ascii").startsWith("avif")) return true;     // AVIF
  if (ftyp && /heic|heif|heix|heim|heis|mif1|msf1/i.test(b.subarray(8, 12).toString("ascii"))) return true;
  return false;
}

/**
 * Video mu? Yine sihirli bayt.
 * HEIC de ftyp tasiyor ama GORUNTU — goruntuMu() once cagrilir.
 */
export function videoMu(b: Buffer): boolean {
  if (b.length < 12) return false;
  const ftyp = b.subarray(4, 8).toString("ascii") === "ftyp";
  if (ftyp) {
    const marka = b.subarray(8, 12).toString("ascii");
    if (/isom|iso2|mp4|avc1|M4V|mmp4|dash/i.test(marka)) return true;
    if (marka.startsWith("qt")) return true;                    // MOV
    if (/^3g/i.test(marka)) return true;                        // 3GP
  }
  if (b.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))) return true; // WebM/MKV
  return false;
}

export type YuklemeSonuc =
  | { ok: true; id: string; tur: "foto" | "video"; bayt: number; oncekiBayt: number; kazanc: number }
  | { ok: false; mesaj: string };

/**
 * Kaynak ya bellekteki baytlar ya da DISKTEKI bir dosya.
 *
 * Parcali yuklemede dosya zaten diske yazilmis oluyor. 400 MB'lik bir
 * videoyu ayrica bellege okumak sunucuyu gereksiz zorluyordu (olculdu:
 * ~745 MB RSS); ayni anda birkac misafir yuklerse bellek biter. Yol
 * verildiginde yalnizca BAS KISMI okunuyor — tur tespiti icin o yetiyor.
 */
export type Kaynak = Buffer | { yol: string; bayt: number };

/** Sihirli bayt icin dosyanin ilk baytlari — tamamini okumaya gerek yok. */
async function bas(kaynak: Kaynak): Promise<Buffer> {
  if (Buffer.isBuffer(kaynak)) return kaynak;
  const f = await fsp.open(kaynak.yol, "r");
  try {
    const tampon = Buffer.alloc(32);
    const { bytesRead } = await f.read(tampon, 0, 32, 0);
    return tampon.subarray(0, bytesRead);
  } finally {
    await f.close();
  }
}

export async function anKaydetVeIsle(
  kaynak: Kaynak,
  yukleyen: string | null,
): Promise<YuklemeSonuc> {
  const bayt = Buffer.isBuffer(kaynak) ? kaynak.length : kaynak.bayt;
  const ilkler = await bas(kaynak);
  const foto = goruntuMu(ilkler);
  const video = !foto && videoMu(ilkler);
  if (!foto && !video) {
    return { ok: false, mesaj: "Sadece fotoğraf veya video gönderebilirsiniz." };
  }
  if (foto && bayt > FOTO_MAX_BAYT) {
    return { ok: false, mesaj: "Fotoğraf çok büyük (en fazla 25 MB)." };
  }
  if (video && bayt > VIDEO_MAX_BAYT) {
    return { ok: false, mesaj: "Video çok büyük (en fazla 600 MB)." };
  }

  /* SUNUCUDA ISLE. Ham baytlar diske turev disinda YAZILMAZ.
     Fotograf: 2048px WebP, EXIF/GPS dusuk.
     Video   : 1080p H.264/AAC, faststart, metadata dusuk + kapak karesi.
     Video yol ile veriliyor (bellege okunmuyor); fotograf 25 MB tavanli,
     bellege almak sorun degil. */
  const islem = video
    ? await videoIsle(Buffer.isBuffer(kaynak) ? kaynak : kaynak.yol)
    : await anIsle(Buffer.isBuffer(kaynak) ? kaynak : await fsp.readFile(kaynak.yol));
  if (!islem.ok) return { ok: false, mesaj: islem.mesaj };

  const kapakVeri: Buffer | null = islem.tur === "video" ? islem.kapak : null;
  const sureVeri: number | null = islem.tur === "video" ? islem.sure : null;

  const id = crypto.randomUUID();
  const dosya = video ? `${id}.mp4` : `${id}.webp`;
  const kapakAd = video ? `${id}-kapak.jpg` : null;
  const klasor = anlarKlasoru();

  // Once gecici ada yaz, sonra rename: yarim dosya asla gorunmez.
  const yazilanlar: string[] = [];
  const yaz = async (ad: string, veri: Buffer) => {
    const gecici = path.join(klasor, `.${ad}.tmp`);
    try {
      await fsp.writeFile(gecici, new Uint8Array(veri));
      await fsp.rename(gecici, path.join(klasor, ad));
      yazilanlar.push(ad);
    } catch (e) {
      await fsp.rm(gecici, { force: true }).catch(() => {});
      throw e;
    }
  };
  const geriAl = async () => {
    for (const ad of yazilanlar) {
      await fsp.rm(path.join(klasor, ad), { force: true }).catch(() => {});
    }
  };

  try {
    await yaz(dosya, islem.veri);
    if (kapakAd && kapakVeri) await yaz(kapakAd, kapakVeri);
  } catch (e) {
    await geriAl();
    console.error("an yazma hatasi", e);
    return { ok: false, mesaj: "Kaydedilemedi. Tekrar deneyin." };
  }

  try {
    anKaydet({
      id, dosya, yukleyen,
      bayt: islem.bayt, genislik: islem.genislik, yukseklik: islem.yukseklik,
      tur: video ? "video" : "foto",
      sure: sureVeri,
      kapak: kapakAd,
    });
  } catch (e) {
    // DB kaydi olmayan dosya oksuz kalir — geri al (kapak dahil).
    await geriAl();
    console.error("an kaydi hatasi", e);
    return { ok: false, mesaj: "Kaydedilemedi. Tekrar deneyin." };
  }

  return {
    ok: true, id,
    tur: video ? "video" : "foto",
    bayt: islem.bayt,
    oncekiBayt: bayt,
    kazanc: Math.round((1 - islem.bayt / bayt) * 100),
  };
}
