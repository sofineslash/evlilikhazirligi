"use client";

import { useMemo, useState } from "react";
import type { Davetli } from "@/lib/davetliler";
import type { DavetliTaraf } from "@/lib/taraf";
import { davetliGonderildiAction, davetliTarafAction } from "@/lib/admin";

/**
 * Gonderimi tamamlanmis davetliler.
 *
 * Ayri sekmede duruyor: gonderim listesi 66 kisiyken, bitmis olanlarin
 * arada durmasi "siradaki kim" sorusunu her seferinde goz taramasina
 * ceviriyordu. Burasi takip ekrani — kim acti, kim yanit verdi.
 */
export default function GonderilenlerListesi({
  davetliler: baslangic,
}: {
  davetliler: Davetli[];
}) {
  const [davetliler, setDavetliler] = useState<Davetli[]>(baslangic);
  const [ara, setAra] = useState("");
  const [taraf, setTaraf] = useState<DavetliTaraf | "hepsi">("hepsi");
  const [suzgec, setSuzgec] = useState<"hepsi" | "acmayan" | "yanitsiz">("hepsi");
  const [islemdeki, setIslemdeki] = useState<string | null>(null);

  const liste = useMemo(() => {
    const t = ara.trim().toLocaleLowerCase("tr");
    return davetliler.filter((d) => {
      if (taraf !== "hepsi" && d.taraf !== taraf) return false;
      if (suzgec === "acmayan" && d.acilma_sayisi > 0) return false;
      if (suzgec === "yanitsiz" && d.durum !== "bekliyor") return false;
      if (!t) return true;
      return (
        d.ad_soyad.toLocaleLowerCase("tr").includes(t) ||
        (d.telefon ?? "").includes(t)
      );
    });
  }, [davetliler, ara, suzgec, taraf]);

  /* Taraf burada da degistirilebilir: gonderilmis biri yanlis tarafta
     kalirsa listelerin tamami yaniltici olur. Iyimser yazilir — secim
     aninda satir dogru tarafa gecsin. */
  const tarafDegistir = async (id: string, yeni: DavetliTaraf | null) => {
    setDavetliler((p) => p.map((x) => (x.id === id ? { ...x, taraf: yeni } : x)));
    await davetliTarafAction(id, yeni);
  };

  /* Geri alma: yanlislikla "gonderildi" isaretlenen biri tekrar gonderim
     listesine donebilmeli, yoksa o kisiye davetiye hic gitmiyor. */
  const geriAl = async (d: Davetli) => {
    if (!confirm(`"${d.ad_soyad}" gönderilmedi olarak işaretlensin mi?\nTekrar gönderim listesine döner.`)) return;
    setIslemdeki(d.id);
    try {
      await davetliGonderildiAction(d.id, false);
      setDavetliler((p) => p.filter((x) => x.id !== d.id));
    } finally {
      setIslemdeki(null);
    }
  };

  const durumRozet = (d: Davetli) => {
    if (d.durum === "geliyor")
      return <span style={{ color: "#2e7d32", fontWeight: 600 }}>Katılacak ({d.kisi_sayisi} kişi)</span>;
    if (d.durum === "gelemiyor") return <span style={{ color: "#c62828" }}>Katılamayacak</span>;
    if (d.durum === "belirsiz") return <span style={{ color: "#e65100" }}>Net değil</span>;
    return <span style={{ color: "#888" }}>Yanıt yok</span>;
  };

  if (baslangic.length === 0) {
    return (
      <section className="admin-kart">
        <h3 style={{ marginTop: 0 }}>📤 Gönderilenler</h3>
        <p className="kucuk" style={{ color: "#666" }}>
          Henüz gönderilmiş davetli yok. &quot;WhatsApp Paylaşım&quot; sekmesinden gönderim
          yaptıkça ya da bir davetliyi gönderildi olarak işaretledikçe buraya taşınırlar.
        </p>
      </section>
    );
  }

  const acmayan = davetliler.filter((d) => d.acilma_sayisi === 0).length;
  const yanitsiz = davetliler.filter((d) => d.durum === "bekliyor").length;

  return (
    <div className="admin-whatsapp-bolum">
      <section className="admin-kart">
        <h3 style={{ marginTop: 0 }}>📤 Gönderilenler ({davetliler.length})</h3>

        {/* Taraf: kiz tarafi ve erkek tarafi kendi listesine baksin */}
        <div className="wa-taraf-serit" style={{ marginBottom: ".8rem" }}>
          {(["hepsi", "gelin", "damat"] as const).map((t) => (
            <button
              key={t}
              type="button"
              className={`wa-taraf-btn${taraf === t ? " secili" : ""}`}
              onClick={() => setTaraf(t)}
            >
              {t === "hepsi" ? "Hepsi" : t === "gelin" ? "👰 Kız tarafı" : "🤵 Erkek tarafı"}
              <span className="sekme-rozet">
                {t === "hepsi" ? davetliler.length : davetliler.filter((d) => d.taraf === t).length}
              </span>
            </button>
          ))}
        </div>

        <div className="sekme-serit" style={{ marginBottom: "1rem", borderBottom: "none" }}>
          <button
            type="button"
            className={`sekme-btn${suzgec === "hepsi" ? " secili" : ""}`}
            onClick={() => setSuzgec("hepsi")}
          >
            Hepsi <span className="sekme-rozet">{davetliler.length}</span>
          </button>
          <button
            type="button"
            className={`sekme-btn${suzgec === "acmayan" ? " secili" : ""}`}
            onClick={() => setSuzgec("acmayan")}
          >
            Açmayan <span className="sekme-rozet">{acmayan}</span>
          </button>
          <button
            type="button"
            className={`sekme-btn${suzgec === "yanitsiz" ? " secili" : ""}`}
            onClick={() => setSuzgec("yanitsiz")}
          >
            Yanıtsız <span className="sekme-rozet">{yanitsiz}</span>
          </button>
        </div>

        <input
          type="search"
          className="admin-input"
          placeholder="İsim veya telefon ara…"
          value={ara}
          onChange={(e) => setAra(e.target.value)}
          style={{ marginBottom: "1rem" }}
        />

        <div className="admin-davetli-tablo-kaydir">
          <table className="admin-davetli-tablo">
            <thead>
              <tr>
                <th>Davetli</th>
                <th>Taraf</th>
                <th>Açılma</th>
                <th>RSVP</th>
                <th>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {liste.map((d) => (
                <tr key={d.id}>
                  <td data-etiket="Davetli">
                    <div>
                      <strong>{d.ad_soyad}</strong>
                      <div className="kucuk" style={{ color: "#777" }}>
                        {d.masa_no && `Masa ${d.masa_no}`}
                        {d.masa_no && d.telefon && " · "}
                        {d.telefon}
                      </div>
                    </div>
                  </td>
                  <td data-etiket="Taraf">
                    <select
                      className="admin-input taraf-sec"
                      value={d.taraf ?? ""}
                      aria-label={`${d.ad_soyad} için taraf`}
                      onChange={(e) =>
                        tarafDegistir(d.id, (e.target.value || null) as DavetliTaraf | null)
                      }
                    >
                      <option value="">Belirsiz</option>
                      <option value="gelin">Kız tarafı</option>
                      <option value="damat">Erkek tarafı</option>
                    </select>
                  </td>
                  <td data-etiket="Açılma">
                    {d.acilma_sayisi > 0 ? (
                      <span style={{ color: "#2e7d32", fontWeight: 600 }}>
                        Açtı ({d.acilma_sayisi} kez)
                      </span>
                    ) : (
                      <span style={{ color: "#999" }}>Henüz açmadı</span>
                    )}
                  </td>
                  <td data-etiket="RSVP">{durumRozet(d)}</td>
                  <td data-etiket="İşlem">
                    <button
                      type="button"
                      className="btn"
                      style={{ padding: "0.2rem 0.5rem", fontSize: "0.78rem" }}
                      title="Gönderilmedi olarak işaretle — gönderim listesine döner"
                      disabled={islemdeki === d.id}
                      onClick={() => geriAl(d)}
                    >
                      {islemdeki === d.id ? "…" : "↩ Geri al"}
                    </button>
                  </td>
                </tr>
              ))}
              {liste.length === 0 && (
                <tr>
                  <td colSpan={5} className="kucuk" style={{ textAlign: "center", padding: "1.5rem" }}>
                    Bu süzgece uyan davetli yok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
