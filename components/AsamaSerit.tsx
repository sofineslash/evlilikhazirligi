import { ASAMA_ETIKET, type Asama } from "@/lib/asama";

/**
 * Önizleme şeridi — YALNIZCA `?asama=` ile bakıldığında (geliştirme ya da
 * giriş yapmış yönetici). Ziyaretçide hiç render edilmez. Ekranın altına
 * sabit; sayfa düzenini kaydırmaz.
 */
export default function AsamaSerit({ asama, eksik }: { asama: Asama; eksik: string[] }) {
  return (
    <div className="asama-serit" role="status">
      <strong>Önizleme:</strong> {ASAMA_ETIKET[asama]}
      <span> — henüz yayında değil</span>
      {eksik.length > 0 && (
        <span className="asama-serit-uyari"> · ⚠ Eksik: {eksik.join(", ")}</span>
      )}
      <a href="/admin#davetiye">Panele dön</a>
    </div>
  );
}
