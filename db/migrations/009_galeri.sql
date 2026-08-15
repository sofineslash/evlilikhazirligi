-- Galeri gorunurlugu. 001'deki `galeri_acik` bayragi yerine metin.* altina
-- tasindi ki admin panelindeki mevcut duzenleme altyapisiyla yonetilebilsin.
-- VARSAYILAN KAPALI: misafir fotograflari kisisel.
INSERT OR IGNORE INTO ayarlar (anahtar, deger) VALUES ('metin.galeri_acik', 'kapali');
