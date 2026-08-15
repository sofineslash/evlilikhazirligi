-- Duzenlenebilir metinler. ayarlar tablosunda 'metin.' onekiyle yasar,
-- boylece admin panelinden degistirilebilir ve deploy gerektirmez.
-- lib/config.ts'teki degerler yalnizca VARSAYILAN olarak kalir.
INSERT OR IGNORE INTO ayarlar (anahtar, deger) VALUES
  ('metin.davet_cumlesi', 'Nişan törenimizde sizleri de aramızda görmekten mutluluk duyarız'),
  ('metin.zarf_notu',     'Sizleri aramızda görmekten mutluluk duyarız'),

  ('metin.damat_anne_ad',    ''),
  ('metin.damat_anne_soyad', ''),
  ('metin.damat_baba_ad',    ''),
  ('metin.damat_baba_soyad', ''),

  ('metin.gelin_anne_ad',    ''),
  ('metin.gelin_anne_soyad', ''),
  ('metin.gelin_baba_ad',    ''),
  ('metin.gelin_baba_soyad', ''),

  ('metin.iletisim_tel',  ''),
  ('metin.yemek_notu',    ''),
  ('metin.otopark_notu',  ''),
  ('metin.kapanis',       'Sizi aramızda görmek bizim için çok kıymetli.');
