import zlib from "node:zlib";

/**
 * Kucuk ZIP yazici — YALNIZCA "store" (sikistirmasiz) yontemi.
 *
 * Neden sikistirmiyoruz: icerik WebP, yani zaten sikistirilmis. Deflate
 * uygulamak %0-1 kazanc icin her dosyayi bastan islemek demek; 500
 * fotografta sunucuyu bosuna mesgul eder.
 *
 * Neden kutuphane degil: tek bagimlilik eklemeden ~80 satirla cozuluyor
 * ve bicim sabit (APPNOTE 4.3). Sikistirma olmayinca en riskli kisim
 * (deflate akisi) de yok.
 *
 * SINIR: ZIP64 YOK. 4 GB ustu arsiv veya 65535'ten fazla dosya
 * uretilemez — cagiran taraf kontrol etmeli (bkz. ZIP_MAX_BAYT).
 */

export const ZIP_MAX_BAYT = 4 * 1024 * 1024 * 1024 - 1;
export const ZIP_MAX_DOSYA = 65535;

/** Node 22+ zlib.crc32 sunar; yoksa tablo ile hesapla. */
const crcTablo = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c >>> 0;
  }
  return t;
})();

function crc32(buf: Buffer): number {
  const yerlesik = (zlib as unknown as { crc32?: (b: Buffer) => number }).crc32;
  if (typeof yerlesik === "function") return yerlesik(buf) >>> 0;
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTablo[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** MS-DOS tarih/saat bicimi — ZIP'in zorunlu alani. */
function dosZaman(d: Date): { zaman: number; tarih: number } {
  return {
    zaman: (d.getHours() << 11) | (d.getMinutes() << 5) | (Math.floor(d.getSeconds() / 2)),
    tarih: ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(),
  };
}

export type ZipGirdi = { ad: string; veri: Buffer; tarih?: Date };

export function zipYap(girdiler: ZipGirdi[]): Buffer {
  const parcalar: Buffer[] = [];
  const merkez: Buffer[] = [];
  let ofset = 0;

  for (const g of girdiler) {
    // UTF-8 dosya adi: bayrak bit 11 kurulmali, yoksa Turkce harfler bozulur.
    const ad = Buffer.from(g.ad, "utf8");
    const crc = crc32(g.veri);
    const { zaman, tarih } = dosZaman(g.tarih ?? new Date());

    const yerel = Buffer.alloc(30);
    yerel.writeUInt32LE(0x04034b50, 0);   // imza
    yerel.writeUInt16LE(20, 4);           // gereken surum
    yerel.writeUInt16LE(0x0800, 6);       // bayrak: UTF-8
    yerel.writeUInt16LE(0, 8);            // yontem: 0 = store
    yerel.writeUInt16LE(zaman, 10);
    yerel.writeUInt16LE(tarih, 12);
    yerel.writeUInt32LE(crc, 14);
    yerel.writeUInt32LE(g.veri.length, 18);  // sikistirilmis boy
    yerel.writeUInt32LE(g.veri.length, 22);  // ham boy (store: esit)
    yerel.writeUInt16LE(ad.length, 26);
    yerel.writeUInt16LE(0, 28);              // ekstra alan yok
    parcalar.push(yerel, ad, g.veri);

    const m = Buffer.alloc(46);
    m.writeUInt32LE(0x02014b50, 0);
    m.writeUInt16LE(20, 4);               // yaratan surum
    m.writeUInt16LE(20, 6);               // gereken surum
    m.writeUInt16LE(0x0800, 8);
    m.writeUInt16LE(0, 10);
    m.writeUInt16LE(zaman, 12);
    m.writeUInt16LE(tarih, 14);
    m.writeUInt32LE(crc, 16);
    m.writeUInt32LE(g.veri.length, 20);
    m.writeUInt32LE(g.veri.length, 24);
    m.writeUInt16LE(ad.length, 28);
    m.writeUInt16LE(0, 30);               // ekstra
    m.writeUInt16LE(0, 32);               // yorum
    m.writeUInt16LE(0, 34);               // disk no
    m.writeUInt16LE(0, 36);               // ic oznitelik
    m.writeUInt32LE(0, 38);               // dis oznitelik
    m.writeUInt32LE(ofset, 42);           // yerel baslik ofseti
    merkez.push(m, ad);

    ofset += yerel.length + ad.length + g.veri.length;
  }

  const merkezBuf = Buffer.concat(merkez);
  const son = Buffer.alloc(22);
  son.writeUInt32LE(0x06054b50, 0);
  son.writeUInt16LE(0, 4);                     // disk no
  son.writeUInt16LE(0, 6);                     // merkezin basladigi disk
  son.writeUInt16LE(girdiler.length, 8);
  son.writeUInt16LE(girdiler.length, 10);
  son.writeUInt32LE(merkezBuf.length, 12);
  son.writeUInt32LE(ofset, 16);
  son.writeUInt16LE(0, 20);                    // yorum uzunlugu

  return Buffer.concat([...parcalar, merkezBuf, son]);
}
