import { ASAMALAR, ASAMA_ETIKET, type Asama } from "@/lib/asama";

/**
 * Admin → Davetiye sekmesi: şu an yayında olan aşama ve önizleme bağlantıları.
 *
 * Önizleme `?asama=` ile açılır ve YALNIZCA giriş yapmış yönetici için çalışır
 * (üretimde ziyaretçi adrese ekleyip yayınlanmamış aşamayı göremez). Yani
 * yayına almadan önce her aşama gerçek sitede, gerçek verilerle görülebilir.
 */
export default function AsamaOnizleme({
  aktif,
  dugunEksik,
}: {
  aktif: Asama;
  dugunEksik: string[];
}) {
  return (
    <section className="admin-kart asama-ozet">
      <h3 style={{ marginTop: 0 }}>🗂 Yayındaki aşama: <strong>{ASAMA_ETIKET[aktif]}</strong></h3>
      <p className="kucuk" style={{ margin: "0 0 .8rem", color: "#666" }}>
        Aşağıdaki bağlantılar her aşamayı <strong>yayınlamadan</strong> gösterir; yalnızca bu panele
        giriş yapmışken çalışır. Yayına almak için aşağıdaki «Site Aşaması»nı seçip kaydet.
      </p>
      <div className="asama-onizle-liste">
        {ASAMALAR.map((a) => (
          <a
            key={a}
            href={`/?asama=${a}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`btn${a === aktif ? " btn-birincil" : ""}`}
          >
            {ASAMA_ETIKET[a]} — Önizle ↗
          </a>
        ))}
      </div>
      {dugunEksik.length > 0 && (
        <p className="kucuk asama-uyari" role="note">
          ⚠ Düğün öncesi için eksik bilgi: <strong>{dugunEksik.join(", ")}</strong>.
          Metinler sekmesindeki «Düğün bilgileri» bölümünden doldur.
        </p>
      )}
    </section>
  );
}
