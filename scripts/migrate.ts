import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), "data", "nisan.db");
const DIR = path.join(process.cwd(), "db", "migrations");

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
const d = new Database(DB_PATH);
d.pragma("journal_mode = WAL");
d.pragma("busy_timeout = 5000");
d.exec("CREATE TABLE IF NOT EXISTS _migrations (ad TEXT PRIMARY KEY, uygulandi TEXT NOT NULL)");

const uygulanmis = new Set(
  (d.prepare("SELECT ad FROM _migrations").all() as { ad: string }[]).map((r) => r.ad),
);
const dosyalar = fs.readdirSync(DIR).filter((f) => f.endsWith(".sql")).sort();

let n = 0;
for (const f of dosyalar) {
  if (uygulanmis.has(f)) continue;
  const sql = fs.readFileSync(path.join(DIR, f), "utf8");
  d.exec("BEGIN");
  try {
    d.exec(sql);
    d.prepare("INSERT INTO _migrations (ad, uygulandi) VALUES (?, ?)").run(
      f,
      new Date().toISOString(),
    );
    d.exec("COMMIT");
    console.log(`uygulandi: ${f}`);
    n++;
  } catch (e) {
    d.exec("ROLLBACK");
    console.error(`HATA: ${f}`);
    throw e;
  }
}
console.log(n === 0 ? "migration yok, veritabani guncel" : `${n} migration uygulandi`);
d.close();
