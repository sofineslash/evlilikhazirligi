-- Davetliyi hangi tarafın davet ettiği.
--
-- Kız tarafı ve erkek tarafı kendi çevresine kendi numarasından
-- gönderiyor; bu yüzden hem listeler hem WhatsApp oturumları tarafa göre
-- ayrılıyor. Boş bırakılabilir: mevcut 66 davetli NULL ile başlar ve
-- "Belirsiz" olarak görünür, kimse zorla bir tarafa atanmaz.
ALTER TABLE davetliler ADD COLUMN taraf TEXT;

CREATE INDEX IF NOT EXISTS idx_davetliler_taraf ON davetliler(taraf);
