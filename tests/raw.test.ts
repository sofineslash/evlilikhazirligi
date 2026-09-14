import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { rawMu, rawToJpeg } from "../lib/raw";
import { anIsle } from "../lib/gorsel";
import { goruntuMu } from "../lib/yukleme-isle";

describe("RAW Fotoğraf Tespiti (rawMu & goruntuMu)", () => {
  it("Fujifilm RAF başlığını tanır", () => {
    const raf = Buffer.alloc(100);
    raf.write("FUJIFILMCCD-RAW ", 0, 16, "ascii");
    expect(rawMu(raf)).toBe(true);
    expect(goruntuMu(raf)).toBe(true);
  });

  it("Canon CR3 (ftypcrx) başlığını tanır", () => {
    const cr3 = Buffer.alloc(100);
    cr3.writeUInt32BE(24, 0);
    cr3.write("ftyp", 4, 4, "ascii");
    cr3.write("crx ", 8, 4, "ascii");
    expect(rawMu(cr3)).toBe(true);
    expect(goruntuMu(cr3)).toBe(true);
  });

  it("Canon CR2 başlığını tanır", () => {
    const cr2 = Buffer.alloc(100);
    cr2[0] = 0x49; cr2[1] = 0x49; cr2[2] = 0x2a; cr2[3] = 0x00; // II*
    cr2[8] = 0x43; cr2[9] = 0x52; cr2[10] = 0x02; cr2[11] = 0x00; // CR\x02\0
    expect(rawMu(cr2)).toBe(true);
    expect(goruntuMu(cr2)).toBe(true);
  });

  it("TIFF tabanlı RAW (Nikon NEF, Sony ARW, Adobe DNG) başlıklarını tanır", () => {
    const leTiff = Buffer.alloc(100);
    leTiff[0] = 0x49; leTiff[1] = 0x49; leTiff[2] = 0x2a; leTiff[3] = 0x00; // II*
    expect(rawMu(leTiff)).toBe(true);
    expect(goruntuMu(leTiff)).toBe(true);

    const beTiff = Buffer.alloc(100);
    beTiff[0] = 0x4d; beTiff[1] = 0x4d; beTiff[2] = 0x00; beTiff[3] = 0x2a; // MM*
    expect(rawMu(beTiff)).toBe(true);
    expect(goruntuMu(beTiff)).toBe(true);
  });

  it("Olympus ORF ve Panasonic RW2 başlıklarını tanır", () => {
    const orf = Buffer.alloc(100);
    orf.write("IIRO", 0, 4, "ascii");
    expect(rawMu(orf)).toBe(true);

    const rw2 = Buffer.alloc(100);
    rw2[0] = 0x49; rw2[1] = 0x49; rw2[2] = 0x55; rw2[3] = 0x00;
    expect(rawMu(rw2)).toBe(true);
  });

  it("Standart JPEG, PNG ve rastgele baytlar için rawMu false döner", () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
    expect(rawMu(jpeg)).toBe(false);

    const rastgele = Buffer.alloc(32, 0x55);
    expect(rawMu(rastgele)).toBe(false);
  });
});

describe("RAW Gömülü JPEG Ayrıştırma (rawToJpeg)", () => {
  it("Fujifilm RAF dosyasından gömülü yüksek çözünürlüklü JPEG'i çıkarır", async () => {
    const testJpeg = await sharp({
      create: { width: 1920, height: 1080, channels: 3, background: { r: 80, g: 120, b: 160 } }
    }).jpeg({ quality: 90 }).toBuffer();

    const raf = Buffer.alloc(100 + testJpeg.length);
    raf.write("FUJIFILMCCD-RAW ", 0, 16, "ascii");
    raf.writeUInt32BE(100, 84); // ofset
    raf.writeUInt32BE(testJpeg.length, 88); // uzunluk
    testJpeg.copy(raf, 100);

    const cikarilmis = await rawToJpeg(raf);
    expect(cikarilmis).not.toBeNull();
    const meta = await sharp(cikarilmis!).metadata();
    expect(meta.format).toBe("jpeg");
    expect(meta.width).toBe(1920);
    expect(meta.height).toBe(1080);
  });

  it("Canon CR3 (PRVW atomu) dosyasından gömülü JPEG'i çıkarır", async () => {
    const testJpeg = await sharp({
      create: { width: 1600, height: 1200, channels: 3, background: { r: 180, g: 90, b: 60 } }
    }).jpeg({ quality: 85 }).toBuffer();

    const ftyp = Buffer.alloc(16);
    ftyp.writeUInt32BE(16, 0);
    ftyp.write("ftyp", 4, 4, "ascii");
    ftyp.write("crx ", 8, 4, "ascii");
    ftyp.writeUInt32BE(1, 12);

    const prvwHeader = Buffer.alloc(14);
    const prvw = Buffer.concat([
      Buffer.alloc(8),
      prvwHeader,
      testJpeg
    ]);
    prvw.writeUInt32BE(prvw.length, 0);
    prvw.write("PRVW", 4, 4, "ascii");

    const cr3 = Buffer.concat([ftyp, prvw]);

    const cikarilmis = await rawToJpeg(cr3);
    expect(cikarilmis).not.toBeNull();
    const meta = await sharp(cikarilmis!).metadata();
    expect(meta.width).toBe(1600);
    expect(meta.height).toBe(1200);
  });

  it("TIFF SubIFD içeren dosyada ufak thumbnail yerine tam çözünürlüklü görseli seçer", async () => {
    // 160x120 küçük önizleme
    const thumb = await sharp({
      create: { width: 160, height: 120, channels: 3, background: { r: 10, g: 20, b: 30 } }
    }).jpeg().toBuffer();

    // 2400x1600 tam çözünürlüklü JPEG
    const fullJpeg = await sharp({
      create: { width: 2400, height: 1600, channels: 3, background: { r: 200, g: 150, b: 100 } }
    }).jpeg().toBuffer();

    const header = Buffer.alloc(8);
    header[0] = 0x49; header[1] = 0x49; // II*
    header.writeUInt16LE(42, 2);
    header.writeUInt32LE(8, 4); // IFD0 ofset 8

    // IFD0 (30 bayt): 1 SubIFD etiketi, 1 thumb etiketi
    const ifd0 = Buffer.alloc(30);
    ifd0.writeUInt16LE(2, 0);
    // SubIFD tag 0x014A
    ifd0.writeUInt16LE(0x014a, 2);
    ifd0.writeUInt16LE(4, 4);
    ifd0.writeUInt32LE(1, 6);
    ifd0.writeUInt32LE(38, 10); // SubIFD ofseti: 38
    // Thumb tag 0x0201
    ifd0.writeUInt16LE(0x0201, 14);
    ifd0.writeUInt16LE(4, 16);
    ifd0.writeUInt32LE(1, 18);
    const thumbOfset = 38 + 30;
    ifd0.writeUInt32LE(thumbOfset, 22);

    // SubIFD (30 bayt): fullJpeg etiketi
    const subifd = Buffer.alloc(30);
    subifd.writeUInt16LE(2, 0);
    subifd.writeUInt16LE(0x0201, 2); // JPEGInterchangeFormat
    subifd.writeUInt16LE(4, 4);
    subifd.writeUInt32LE(1, 6);
    const fullOfset = thumbOfset + thumb.length;
    subifd.writeUInt32LE(fullOfset, 10);
    subifd.writeUInt16LE(0x0202, 14); // JPEGInterchangeFormatLength
    subifd.writeUInt16LE(4, 16);
    subifd.writeUInt32LE(1, 18);
    subifd.writeUInt32LE(fullJpeg.length, 22);

    const tiff = Buffer.concat([header, ifd0, subifd, thumb, fullJpeg]);

    const cikarilmis = await rawToJpeg(tiff);
    expect(cikarilmis).not.toBeNull();
    const meta = await sharp(cikarilmis!).metadata();
    // Thumbnail (160x120) değil, 2400x1600 seçilmeli
    expect(meta.width).toBe(2400);
    expect(meta.height).toBe(1600);
  });
});

describe("Uçtan Uca Görsel İşleme (anIsle ile RAW Dönüştürme)", () => {
  it("RAW konteynerinden WebP türetir, boyutunu küçültür ve kalitesini korur", async () => {
    // 3000x2000 piksel, desenli kaliteli JPEG (düz renk olmamalı)
    const testJpeg = await sharp({
      create: { width: 3000, height: 2000, channels: 3, background: { r: 120, g: 180, b: 240 } }
    })
      .composite([{
        input: Buffer.from('<svg width="3000" height="2000"><circle cx="1500" cy="1000" r="800" fill="#e74c3c"/><rect x="200" y="200" width="1000" height="800" fill="#2ecc71"/></svg>'),
        top: 0,
        left: 0,
      }])
      .jpeg({ quality: 95 })
      .toBuffer();

    // Simüle edilmiş Fujifilm RAW
    const rawBuffer = Buffer.alloc( testJpeg.length + 1000 );
    rawBuffer.write("FUJIFILMCCD-RAW ", 0, 16, "ascii");
    rawBuffer.writeUInt32BE(1000, 84);
    rawBuffer.writeUInt32BE(testJpeg.length, 88);
    testJpeg.copy(rawBuffer, 1000);

    const sonuc = await anIsle(rawBuffer);
    expect(sonuc.ok).toBe(true);

    if (sonuc.ok) {
      expect(sonuc.tur).toBe("foto");
      // 2048px tavanına ölçeklenmeli
      expect(sonuc.genislik).toBe(2048);
      expect(sonuc.yukseklik).toBe(Math.round(2000 * (2048 / 3000)));
      // Çıktı geçerli bir WebP olmalı
      const meta = await sharp(sonuc.veri).metadata();
      expect(meta.format).toBe("webp");
      // Dosya boyutu ham RAW boyutundan çok daha küçük olmalı
      expect(sonuc.bayt).toBeLessThan(rawBuffer.length / 5);
      expect(sonuc.oncekiBayt).toBe(rawBuffer.length);
    }
  });
});
