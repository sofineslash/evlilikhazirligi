-- Katilim kayitlari.
CREATE TABLE IF NOT EXISTS katilimlar (
  id             TEXT PRIMARY KEY,
  ad_soyad       TEXT NOT NULL,           -- girildigi gibi, gosterim icin
  ad_soyad_norm  TEXT NOT NULL,           -- eslestirme anahtari (JS'te uretilir)
  geliyor        INTEGER NOT NULL,        -- 1 geliyorum, 0 gelemiyorum
  kisi_sayisi    INTEGER NOT NULL,        -- KENDISI DAHIL toplam. geliyor=0 ise 0.
  dilek          TEXT,                    -- opsiyonel
  dilek_yayinda  INTEGER NOT NULL DEFAULT 0,
  cihaz_jetonu   TEXT NOT NULL,
  cift_isaretli  INTEGER NOT NULL DEFAULT 0,  -- "farkli kisiyim" yolundan geldi
  tek_kelime     INTEGER NOT NULL DEFAULT 0,  -- tekillik kontrolune girmedi
  ip_hash        TEXT,
  olusturuldu    TEXT NOT NULL
);

-- KISMI TEKIL INDEKS — ayri ifade olmak ZORUNDA.
-- CREATE TABLE icinde "UNIQUE (...) WHERE ..." SQLite sozdizimi hatasidir.
-- Duz UNIQUE(norm, cift) de YANLIS: "farkli kisiyim" yolundan yalnizca BIR
-- kayda izin verir ve ikinci gercek davetliyi kilitler.
-- tek_kelime=0 sarti: tek kelimeli isimler tekillige hic girmez (D9).
CREATE UNIQUE INDEX IF NOT EXISTS ux_katilim_norm
  ON katilimlar(ad_soyad_norm)
  WHERE cift_isaretli = 0 AND tek_kelime = 0;

CREATE TABLE IF NOT EXISTS ayarlar (
  anahtar TEXT PRIMARY KEY,
  deger   TEXT
);

INSERT OR IGNORE INTO ayarlar (anahtar, deger) VALUES
  ('galeri_acik', '0'),
  ('yukleme_acik', '0'),
  ('son_yedek', '');
