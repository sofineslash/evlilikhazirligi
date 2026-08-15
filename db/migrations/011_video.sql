-- Misafir yuklemeleri artik video da olabiliyor.
--
-- tur   : 'foto' | 'video'  — mevcut satirlarin hepsi fotograf.
-- sure  : video uzunlugu (saniye); fotografta NULL.
-- kapak : videonun kapak karesi (dosya adi); fotografta NULL.
--         Ayri bir dosya, cunku <video poster> bir GORSEL istiyor.
--         Videoyu indirtip ilk kareyi cizdirmek mobilde hem yavas
--         hem de bosuna onlarca MB indirmek demek.
ALTER TABLE anlar ADD COLUMN tur   TEXT NOT NULL DEFAULT 'foto';
ALTER TABLE anlar ADD COLUMN sure  INTEGER;
ALTER TABLE anlar ADD COLUMN kapak TEXT;
