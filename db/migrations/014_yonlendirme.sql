-- Yönlendirilen davetlileri ve link zincirini ayirma altyapisi
ALTER TABLE davetliler ADD COLUMN yonlendiren_davetli_id TEXT;
ALTER TABLE davetliler ADD COLUMN yonlendiren_ad TEXT;

ALTER TABLE katilimlar ADD COLUMN davetli_id TEXT;
ALTER TABLE katilimlar ADD COLUMN yonlendiren_ad TEXT;

CREATE INDEX IF NOT EXISTS idx_davetliler_yonlendiren ON davetliler(yonlendiren_davetli_id);
CREATE INDEX IF NOT EXISTS idx_katilimlar_davetli_id ON katilimlar(davetli_id);
