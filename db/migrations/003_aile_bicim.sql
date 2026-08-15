-- Anne-baba isimlerinin nasil yazilacagi. Otomatik algilama kaldirildi:
-- bosanmis ama ayni soyadi tasiyan ebeveynler, ya da farkli soyadi olup
-- birlikte yazilmak istenen durumlar otomatik kuralla dogru cikmiyordu.
INSERT OR IGNORE INTO ayarlar (anahtar, deger) VALUES
  ('metin.damat_bicim', 'birlikte'),
  ('metin.gelin_bicim', 'birlikte');
