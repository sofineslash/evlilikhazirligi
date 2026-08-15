-- Fotograf yukleme ne zaman acilsin.
--   otomatik : nisan saatinde (CFG.TARIH) kendiliginden acilir  [varsayilan]
--   acik     : simdi acik — erken acmak icin
--   kapali   : tarih gecse bile kapali
--
-- 001'deki 'yukleme_acik' bayragi yerini buna birakiyor: iki durumlu bayrak
-- "tarihte kendiliginden acilsin" halini ifade edemiyordu.
-- INSERT OR IGNORE: kullanicinin sectigi deger asla ezilmez.
INSERT OR IGNORE INTO ayarlar (anahtar, deger) VALUES
  ('metin.yukleme_modu', 'otomatik');
