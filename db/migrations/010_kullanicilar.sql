-- Ek yonetici hesaplari.
--
-- SAHIP (.env'deki ADMIN_KULLANICI) bu tabloda DEGIL: veritabani bozulsa
-- ya da buradaki son kayit silinse bile sahip panele girebilmeli.
--
-- kullanici_adi normalize edilmis (Turkce kucultme) saklanir; UNIQUE
-- boylece "Ayse" ve "ayse" ayni hesap sayilir.
CREATE TABLE IF NOT EXISTS kullanicilar (
  id            TEXT PRIMARY KEY,
  kullanici_adi TEXT NOT NULL UNIQUE,
  sifre_hash    TEXT NOT NULL,
  olusturuldu   TEXT NOT NULL
);
