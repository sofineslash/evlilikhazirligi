import fs from "node:fs";
import path from "node:path";
import { db } from "./db";
import { MEDYA_KOK } from "./sahneler";

/**
 * Misafir fotograflari ("anlar").
 *
 * Sahne gorselleriyle AYNI klasorde durmamalari onemli: sahneler admin
 * tarafindan yuklenen, davetiyenin parcasi olan az sayida dosya; anlar
 * ise misafirlerden gelen, sayisi belirsiz icerik. Karisirsa sahne
 * listeleme kodu misafir fotograflarini da tarar.
 */
export const ANLAR_KOK = process.env.ANLAR_KOK || path.join(path.dirname(MEDYA_KOK), "anlar");

export type An = {
  id: string;
  dosya: string;
  yukleyen: string | null;
  bayt: number;
  genislik: number | null;
  yukseklik: number | null;
  gizli: number;
  olusturuldu: string;
};

export function anlarKlasoru(): string {
  fs.mkdirSync(ANLAR_KOK, { recursive: true });
  return ANLAR_KOK;
}

export function anKaydet(a: {
  id: string; dosya: string; yukleyen: string | null;
  bayt: number; genislik: number; yukseklik: number;
}): void {
  db()
    .prepare(
      `INSERT INTO anlar (id, dosya, yukleyen, bayt, genislik, yukseklik, olusturuldu)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(a.id, a.dosya, a.yukleyen, a.bayt, a.genislik, a.yukseklik, new Date().toISOString());
}

export function anlariListele(limit = 500): An[] {
  return db()
    .prepare("SELECT * FROM anlar ORDER BY olusturuldu DESC LIMIT ?")
    .all(limit) as An[];
}

export function anSayisi(): { adet: number; bayt: number } {
  const r = db()
    .prepare("SELECT COUNT(*) AS adet, COALESCE(SUM(bayt), 0) AS bayt FROM anlar")
    .get() as { adet: number; bayt: number };
  return r;
}

/** Diskteki toplam kullanim — kota kontrolu icin. */
export function kullanilanBayt(): number {
  return anSayisi().bayt;
}

export function anDosyaYolu(dosya: string): string | null {
  // Yol gecisi savunmasi: dosya adi ASLA klasor ayraci icermemeli.
  if (dosya.includes("/") || dosya.includes("\\") || dosya.includes("..")) return null;
  const y = path.join(ANLAR_KOK, dosya);
  return fs.existsSync(y) ? y : null;
}
