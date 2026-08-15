-- Davetiye kartinin gorunum ayarlari. Admin panelinden kaydiraciyla ayarlanir.
-- kart_beyaz: kartin uzerindeki beyaz katmanin yuzdesi (dusuk = fotograf cok gorunur)
-- kart_blur : arkadaki fotografin bulanikligi (px)
INSERT OR IGNORE INTO ayarlar (anahtar, deger) VALUES
  ('metin.kart_beyaz', '62'),
  ('metin.kart_blur',  '16');
