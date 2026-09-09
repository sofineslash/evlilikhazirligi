-- Davetli takip sistemi ve WhatsApp paylasim altyapisi
CREATE TABLE IF NOT EXISTS davetliler (
  id TEXT PRIMARY KEY,
  davetiye_id TEXT NOT NULL,
  ad_soyad TEXT NOT NULL,
  telefon TEXT,
  token TEXT UNIQUE NOT NULL,
  kisi_sayisi INTEGER DEFAULT 1,
  izinli_kisi_sayisi INTEGER DEFAULT 1,
  durum TEXT DEFAULT 'bekliyor', -- bekliyor | geliyor | gelemiyor | belirsiz
  gonderildi_mi INTEGER DEFAULT 0,
  whatsapp_acildi_mi INTEGER DEFAULT 0,
  ilk_acilma TEXT,
  son_acilma TEXT,
  acilma_sayisi INTEGER DEFAULT 0,
  rsvp_tarihi TEXT,
  masa_no TEXT,
  notlar TEXT,
  olusturuldu TEXT NOT NULL,
  guncellendi TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_davetliler_davetiye_token ON davetliler(davetiye_id, token);

-- Varsayilan WhatsApp ve slug ayarlari
INSERT OR IGNORE INTO ayarlar (anahtar, deger) VALUES
  ('metin.davetiye_slug', 'omur-kubra'),
  ('metin.whatsapp_og_tur', 'dinamik'),
  ('metin.whatsapp_mesaj', '💌 {cift}

Davetlisiniz!

Özel günümüzde sizleri de aramızda görmekten mutluluk duyarız.

Davet detayları ve katılım için:
{link}');
