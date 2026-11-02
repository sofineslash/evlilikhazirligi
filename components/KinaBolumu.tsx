import type { KinaBilgisi } from "@/lib/etkinlik";

/**
 * Kına bölümü — YALNIZCA düğün öncesi davetiyesinde, kına tarihi girilmişse.
 * Tema 1 ve Tema 2 ortak kullanır; tema renklerini devralır (kendi arka planı yok).
 */
export default function KinaBolumu({ kina }: { kina: KinaBilgisi }) {
  return (
    <section className="kina-bolum" aria-labelledby="kina-baslik">
      <div className="kina-orn" aria-hidden="true"><i /><b>❖</b><i /></div>
      <h2 id="kina-baslik" className="kina-baslik">Kına Gecesi</h2>
      <p className="kina-tarih">
        {kina.tarih.metin} · <span>{kina.tarih.saatMetni}</span>
      </p>
      {kina.yer && <p className="kina-yer">{kina.yer}</p>}
      {kina.adres && <p className="kina-adres">{kina.adres}</p>}
      {kina.harita && (
        <div className="harita-ikili">
          <a className="btn btn-eylem" href={kina.harita.google} target="_blank" rel="noopener noreferrer">
            Google Haritalar
          </a>
          <a className="btn btn-eylem" href={kina.harita.apple} target="_blank" rel="noopener noreferrer">
            Apple Haritalar
          </a>
        </div>
      )}
    </section>
  );
}
