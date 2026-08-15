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

export function ayarOku(anahtar: string, varsayilan = "0"): string {
  const row = db().prepare("SELECT deger FROM ayarlar WHERE anahtar = ?").get(anahtar) as
    | { deger: string }
    | undefined;
  return row?.deger ?? varsayilan; // satir yoksa savunmaci varsayilan
}

export function ayarYaz(anahtar: string, deger: string): void {
  db()
    .prepare(
      "INSERT INTO ayarlar (anahtar, deger) VALUES (?, ?) ON CONFLICT(anahtar) DO UPDATE SET deger = excluded.deger",
    )
    .run(anahtar, deger);
}
