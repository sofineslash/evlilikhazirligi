import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), "data", "nisan.db");

let _db: Database.Database | null = null;

export function db(): Database.Database {
  if (_db) return _db;
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const d = new Database(DB_PATH);
  d.pragma("journal_mode = WAL");
  d.pragma("busy_timeout = 5000");
  d.pragma("foreign_keys = ON");
  _db = d;
  return d;
}

/**
 * Tablolar HENUZ YOKKEN yapilan okuma patlamamali.
 *
 * `next build` kok layout'un generateMetadata'sini calistirarak statik
 * sayfalari (/_not-found, /robots.txt, /admin/giris) on-render ediyor.
 * Docker imajinda `data/` yok (.dockerignore) ve migration'lar konteyner
 * ACILIRKEN kosuyor — yani derleme aninda veritabani bos. Eskiden burasi
 * "no such table: ayarlar" firlatiyor ve DERLEME COKUYORDU.
 *
 * Yerelde gorunmuyordu cunku gelistirme makinesinde dolu bir nisan.db var.
 */
function tabloYok(e: unknown): boolean {
  return e instanceof Error && /no such table/i.test(e.message);
}

export function ayarOku(anahtar: string, varsayilan = "0"): string {
  try {
    const row = db().prepare("SELECT deger FROM ayarlar WHERE anahtar = ?").get(anahtar) as
      | { deger: string }
      | undefined;
    return row?.deger ?? varsayilan; // satir yoksa savunmaci varsayilan
  } catch (e) {
    if (tabloYok(e)) return varsayilan;
    throw e;
  }
}

export function ayarYaz(anahtar: string, deger: string): void {
  db()
    .prepare(
      "INSERT INTO ayarlar (anahtar, deger) VALUES (?, ?) ON CONFLICT(anahtar) DO UPDATE SET deger = excluded.deger",
    )
    .run(anahtar, deger);
}
