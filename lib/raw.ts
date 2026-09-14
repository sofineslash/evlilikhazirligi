import sharp from "sharp";

/**
 * RAW Kamera Görüntüsü Ayrıştırıcı ve Yüksek Kaliteli JPEG Çıkarıcı.
 *
 * Desteklenen Başlıca Formatlar:
 * - Canon: .cr2 (TIFF + CR imzası), .cr3 (ISO-BMFF / crx)
 * - Nikon: .nef (TIFF tabanlı SubIFD JpgFromRaw)
 * - Sony: .arw (TIFF tabanlı SubIFD Preview)
 * - Adobe/Evrensel: .dng (TIFF-EP, Apple ProRAW, Leica, Pentax, DJI, Pixel)
 * - Fujifilm: .raf (FUJIFILMCCD-RAW başlığı)
 * - Olympus: .orf (IIRO/MMOR başlığı)
 * - Panasonic: .rw2 (II\x55\0 başlığı)
 * - Pentax: .pef (TIFF tabanlı)
 *
 * NEDEN GÖMÜLÜ JPEG ÇIKARILIYOR:
 * 1. Renk Doğruluğu: Kamera üreticisinin kendi donanım işlemcisi (DIGIC,
 *    EXPEED, BIONZ X) tarafından uygulanan özel renk profili, beyaz dengesi,
 *    dinamik aralık ve ton eğrisi gömülü JPEG'de mevcuttur. Ham Bayer
 *    algoritmaları üretici profilleri olmadan soluk veya renk sapmalı çıkar.
 * 2. Hız & Kaynak: 45 MP'lik ham sensör verisini yazılımla demosaic etmek
 *    sunucu CPU'sunu 5-10 saniye %100 yükte kilitler. Gömülü tam JPEG'i
 *    çıkarmak ~15 milisaniyede sıfır gecikmeyle tamamlanır.
 * 3. Çözünürlük: Gömülü kare tam veya 2K-4K çözünürlüktedir; Retina ekranda
 *    orijinal RAW ile algılanabilir hiçbir fark oluşturmaz.
 */

/**
 * Baytların bir kamera RAW dosyasına ait olup olmadığını tespit eder.
 */
export function rawMu(b: Buffer): boolean {
  if (b.length < 16) return false;

  // Fujifilm RAF
  if (b.subarray(0, 15).toString("ascii") === "FUJIFILMCCD-RAW") return true;

  // Canon CR3 (ISO-BMFF, brand: crx )
  if (
    b.subarray(4, 8).toString("ascii") === "ftyp" &&
    b.subarray(8, 12).toString("ascii").startsWith("crx")
  ) {
    return true;
  }

  // Olympus ORF (IIRO veya MMOR)
  const ilkDort = b.subarray(0, 4).toString("ascii");
  if (ilkDort === "IIRO" || ilkDort === "MMOR") return true;

  // Panasonic RW2 (II\x55\0)
  if (b[0] === 0x49 && b[1] === 0x49 && b[2] === 0x55 && b[3] === 0x00) return true;

  // Canon CR2 özel imzası (TIFF başlığı + 8. baytta 'CR\x02\0')
  if (
    b[0] === 0x49 && b[1] === 0x49 && b[2] === 0x2a && b[3] === 0x00 &&
    b[8] === 0x43 && b[9] === 0x52 && b[10] === 0x02 && b[11] === 0x00
  ) {
    return true;
  }

  // Standart TIFF tabanlı RAW'lar (NEF, ARW, DNG, PEF)
  // Little-Endian (II*) veya Big-Endian (MM*)
  const isLeTiff = b[0] === 0x49 && b[1] === 0x49 && b[2] === 0x2a && b[3] === 0x00;
  const isBeTiff = b[0] === 0x4d && b[1] === 0x4d && b[2] === 0x00 && b[3] === 0x2a;
  if (isLeTiff || isBeTiff) return true;

  return false;
}

/**
 * JPEG SOF (Start of Frame) işaretçisini ayrıştırıp genişlik ve yükseklik döner.
 */
function jpegBoyutBul(b: Buffer, baslangic = 0): { w: number; h: number } | null {
  let pos = baslangic;
  if (b[pos] !== 0xff || b[pos + 1] !== 0xd8) return null;
  pos += 2;

  while (pos + 4 < b.length) {
    if (b[pos] !== 0xff) {
      pos++;
      continue;
    }
    const marker = b[pos + 1];
    // SOF0 (0xC0), SOF1 (0xC1), SOF2 (0xC2)
    if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
      const h = b.readUInt16BE(pos + 5);
      const w = b.readUInt16BE(pos + 7);
      return { w, h };
    }
    // Bağımsız veya uzunluk taşımayan işaretçiler
    if (marker === 0xd9 || marker === 0xda) break; // EOI veya SOS
    if (marker === 0x00 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) {
      pos += 2;
      continue;
    }
    const len = b.readUInt16BE(pos + 2);
    pos += 2 + len;
  }
  return null;
}

/**
 * Fujifilm RAF gömülü JPEG çıkarıcı.
 * RAF dosyasında 84. baytta JPEG ofseti, 88. baytta JPEG uzunluğu yer alır (Big-Endian).
 */
function rafCikar(b: Buffer): Buffer | null {
  if (b.length < 92 || b.subarray(0, 15).toString("ascii") !== "FUJIFILMCCD-RAW") {
    return null;
  }
  const ofset = b.readUInt32BE(84);
  const uzunluk = b.readUInt32BE(88);
  if (ofset > 0 && ofset + uzunluk <= b.length && uzunluk > 1024) {
    const aday = b.subarray(ofset, ofset + uzunluk);
    if (aday[0] === 0xff && aday[1] === 0xd8) return aday;
  }
  return null;
}

/**
 * Canon CR3 (ISO-BMFF) gömülü JPEG çıkarıcı.
 * CR3 kutularını gezerek `PRVW` (Preview) kutusundaki JPEG akışını bulur.
 */
function cr3Cikar(b: Buffer): Buffer | null {
  if (b.length < 32) return null;
  let pos = 0;

  while (pos + 8 <= b.length) {
    let kutuBoyu = b.readUInt32BE(pos);
    const kutuTuru = b.subarray(pos + 4, pos + 8).toString("ascii");

    if (kutuBoyu === 1 && pos + 16 <= b.length) {
      // 64-bit kutu boyu
      const high = b.readUInt32BE(pos + 8);
      const low = b.readUInt32BE(pos + 12);
      kutuBoyu = high * 2 ** 32 + low;
    }

    if (kutuBoyu <= 0 || pos + kutuBoyu > b.length) break;

    if (kutuTuru === "PRVW") {
      const icerik = b.subarray(pos + 8, pos + kutuBoyu);
      // PRVW içinde JPEG SOI (0xFF 0xD8 0xFF) ara
      const soi = icerik.indexOf(Buffer.from([0xff, 0xd8, 0xff]));
      if (soi !== -1) {
        return icerik.subarray(soi);
      }
    }

    // moov veya trak kutusu içinde iç içe kutular olabilir
    if (kutuTuru === "moov" || kutuTuru === "uuid") {
      const altIcerik = b.subarray(pos + 8, pos + kutuBoyu);
      const altPrvw = altIcerik.indexOf(Buffer.from("PRVW", "ascii"));
      if (altPrvw !== -1 && altPrvw >= 4) {
        const pLen = altIcerik.readUInt32BE(altPrvw - 4);
        const pIcerik = altIcerik.subarray(altPrvw + 4, altPrvw - 4 + pLen);
        const soi = pIcerik.indexOf(Buffer.from([0xff, 0xd8, 0xff]));
        if (soi !== -1) return pIcerik.subarray(soi);
      }
    }

    pos += kutuBoyu;
  }
  return null;
}

/**
 * TIFF Tabanlı RAW (CR2, NEF, ARW, DNG, ORF, RW2, PEF) IFD etiketlerini tarayarak
 * en yüksek çözünürlüklü JPEG'i çıkarır.
 */
function tiffAdaylariniBul(b: Buffer): { ofset: number; uzunluk?: number }[] {
  if (b.length < 16) return [];
  const isLe = b[0] === 0x49; // II*
  const readU16 = (o: number) => (isLe ? b.readUInt16LE(o) : b.readUInt16BE(o));
  const readU32 = (o: number) => (isLe ? b.readUInt32LE(o) : b.readUInt32BE(o));

  const ilkIfd = readU32(4);
  const kuyruk = [ilkIfd];
  const gezildi = new Set<number>();
  const adaylar: { ofset: number; uzunluk?: number }[] = [];

  while (kuyruk.length > 0) {
    const ifdOfset = kuyruk.shift()!;
    if (gezildi.has(ifdOfset) || ifdOfset <= 0 || ifdOfset + 2 > b.length) continue;
    gezildi.add(ifdOfset);

    const elemanSayisi = readU16(ifdOfset);
    let cur = ifdOfset + 2;

    let jpegOfset: number | undefined;
    let jpegUzunluk: number | undefined;
    let stripOfset: number | undefined;
    let stripUzunluk: number | undefined;
    let sikistirma = 0;

    for (let i = 0; i < elemanSayisi; i++) {
      if (cur + 12 > b.length) break;
      const tag = readU16(cur);
      const count = readU32(cur + 4);
      const val = readU32(cur + 8);

      // Tag 0x0103: Compression (6 = JPEG, 7 = JPEG / new-style JPEG)
      if (tag === 0x0103) sikistirma = readU16(cur + 8);

      // Tag 0x0201: JPEGInterchangeFormat (JPEG başlangıç ofseti)
      if (tag === 0x0201) jpegOfset = val;
      // Tag 0x0202: JPEGInterchangeFormatLength (JPEG bayt boyu)
      if (tag === 0x0202) jpegUzunluk = val;

      // Tag 0x0111: StripOffsets
      if (tag === 0x0111) stripOfset = val;
      // Tag 0x0117: StripByteCounts
      if (tag === 0x0117) stripUzunluk = val;

      // Tag 0x014A: SubIFDs (alt IFD ofsetleri)
      if (tag === 0x014a) {
        if (count === 1) {
          kuyruk.push(val);
        } else if (count > 1 && val + count * 4 <= b.length) {
          for (let s = 0; s < count; s++) {
            kuyruk.push(readU32(val + s * 4));
          }
        }
      }

      // Tag 0x8769: ExifIFD
      if (tag === 0x8769) kuyruk.push(val);

      cur += 12;
    }

    if (jpegOfset && jpegOfset < b.length) {
      adaylar.push({ ofset: jpegOfset, uzunluk: jpegUzunluk });
    } else if (stripOfset && stripOfset < b.length && (sikistirma === 6 || sikistirma === 7)) {
      adaylar.push({ ofset: stripOfset, uzunluk: stripUzunluk });
    }

    if (cur + 4 <= b.length) {
      const sonrakiIfd = readU32(cur);
      if (sonrakiIfd > 0) kuyruk.push(sonrakiIfd);
    }
  }

  return adaylar;
}

/**
 * Bayt tamponunda gömülü tüm JPEG SOI (0xFF, 0xD8, 0xFF) akışlarını tarar.
 * Tescilli / standart dışı MakerNote alanlarında gizlenmiş kareleri de yakalar.
 */
function evrenselJpegAdaylari(b: Buffer): Buffer[] {
  const adaylar: Buffer[] = [];
  let idx = 0;

  while (idx < b.length - 4) {
    const soi = b.indexOf(Buffer.from([0xff, 0xd8, 0xff]), idx);
    if (soi === -1) break;

    // Bir sonraki EOI (0xFF, 0xD9) ara
    let eoiArama = soi + 3;
    let sonEoi = -1;

    while (eoiArama < b.length - 1) {
      const eoi = b.indexOf(Buffer.from([0xff, 0xd9]), eoiArama);
      if (eoi === -1) break;

      // Eğer araya yeni bir SOI girdiyse bu bloğu atla
      const araSoi = b.indexOf(Buffer.from([0xff, 0xd8, 0xff]), eoiArama);
      if (araSoi !== -1 && araSoi < eoi) {
        break;
      }

      sonEoi = eoi + 2;
      break;
    }

    if (sonEoi > soi) {
      const dilim = b.subarray(soi, sonEoi);
      // En az 10 KB olsun (ufak simge/ikon olmasın)
      if (dilim.length >= 10_000) {
        adaylar.push(dilim);
      }
      idx = sonEoi;
    } else {
      idx = soi + 3;
    }
  }

  return adaylar;
}

/**
 * Bir JPEG tamponunun geçerliliğini ve boyutunu kontrol eder.
 */
async function jpegDogrula(b: Buffer): Promise<{ w: number; h: number; buffer: Buffer } | null> {
  // Hızlı SOF kontrolü
  const boyut = jpegBoyutBul(b);
  if (boyut && boyut.w > 0 && boyut.h > 0) {
    return { w: boyut.w, h: boyut.h, buffer: b };
  }
  // SOF okunamadıysa Sharp ile doğrula
  try {
    const meta = await sharp(b, { failOn: "none" }).metadata();
    if (meta.width && meta.height && meta.width >= 16 && meta.height >= 16) {
      return { w: meta.width, h: meta.height, buffer: b };
    }
  } catch {}
  return null;
}

/**
 * Herhangi bir kamera RAW tamponunu alır, içerisindeki yüksek çözünürlüklü
 * gömülü JPEG'i (Full-res veya Preview) ayıklar ve bir JPEG Buffer olarak döner.
 *
 * Eğer dosya sıkıştırmasız DNG/TIFF ise doğrudan Sharp ile çözülebilir tampon döner.
 */
export async function rawToJpeg(ham: Buffer): Promise<Buffer | null> {
  // 1. Fujifilm RAF
  const rafJpeg = rafCikar(ham);
  if (rafJpeg) {
    const dogru = await jpegDogrula(rafJpeg);
    if (dogru) return dogru.buffer;
  }

  // 2. Canon CR3 (ISO-BMFF)
  const cr3Jpeg = cr3Cikar(ham);
  if (cr3Jpeg) {
    const dogru = await jpegDogrula(cr3Jpeg);
    if (dogru) return dogru.buffer;
  }

  // 3. TIFF Tabanlı IFD Ayrıştırma (CR2, NEF, ARW, DNG, ORF, RW2, PEF)
  const tiffAdaylar = tiffAdaylariniBul(ham);
  let enIyiBuffer: Buffer | null = null;
  let enYuksekPiksel = 0;

  for (const c of tiffAdaylar) {
    const dilim = c.uzunluk
      ? ham.subarray(c.ofset, c.ofset + c.uzunluk)
      : ham.subarray(c.ofset);

    if (dilim.length < 2 || dilim[0] !== 0xff || dilim[1] !== 0xd8) continue;

    const dogru = await jpegDogrula(dilim);
    if (dogru) {
      const piksel = dogru.w * dogru.h;
      if (piksel > enYuksekPiksel) {
        enYuksekPiksel = piksel;
        enIyiBuffer = dogru.buffer;
      }
    }
  }

  // Eğer TIFF IFD'lerinde yeterince büyük bir görsel (> 800px) bulunduysa dön
  if (enIyiBuffer && enYuksekPiksel >= 800 * 600) {
    return enIyiBuffer;
  }

  // 4. Evrensel JPEG Akış Taraması (Fallback)
  const evrenselAdaylar = evrenselJpegAdaylari(ham);
  for (const dilim of evrenselAdaylar) {
    const dogru = await jpegDogrula(dilim);
    if (dogru) {
      const piksel = dogru.w * dogru.h;
      if (piksel > enYuksekPiksel) {
        enYuksekPiksel = piksel;
        enIyiBuffer = dogru.buffer;
      }
    }
  }

  if (enIyiBuffer) {
    return enIyiBuffer;
  }

  // 5. Doğrudan Sharp Fallback (Sıkıştırmasız DNG / TIFF durumunda)
  try {
    const meta = await sharp(ham, { limitInputPixels: 200_000_000, failOn: "none" }).metadata();
    if (meta.width && meta.height && meta.width >= 16 && meta.height >= 16) {
      // Sharp bunu doğrudan çözebiliyor
      return ham;
    }
  } catch {}

  return null;
}
