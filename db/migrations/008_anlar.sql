-- Misafirlerin yukledigi fotograflar ("anlar").
--
-- gizli: varsayilan 0. Galeri erisimi ayri bir anahtarla (galeri_acik)
-- yonetiliyor; bu sutun tek tek fotografi saklamak icin.
-- dosya UNIQUE: ayni turev iki kez kaydedilmesin.
CREATE TABLE IF NOT EXISTS anlar (
  id          TEXT PRIMARY KEY,
  dosya       TEXT NOT NULL UNIQUE,
  yukleyen    TEXT,
  bayt        INTEGER NOT NULL,
  genislik    INTEGER,
  yukseklik   INTEGER,
  gizli       INTEGER NOT NULL DEFAULT 0,
  olusturuldu TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS ix_anlar_tarih ON anlar(olusturuldu DESC);
