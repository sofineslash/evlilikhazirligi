"use client";

import { useRef, useState } from "react";

type Durum =
  | { t: "bos" }
  | { t: "yukleniyor"; yuzde: number }
  | { t: "tamam" }
  | { t: "hata"; mesaj: string };

export default function SahneYukle({
  ad,
  aciklama,
  yol,
  repoda,
  yuklenmis,
}: {
  ad: string;
  aciklama: string;
  yol: string | null;
  repoda: boolean;
  yuklenmis: boolean;
}) {
  const [durum, setDurum] = useState<Durum>({ t: "bos" });
  const girdi = useRef<HTMLInputElement>(null);

  function gonder(dosya: File) {
    if (dosya.size > 4 * 1024 * 1024) {
      setDurum({ t: "hata", mesaj: "Dosya 4 MB'dan büyük. Küçültüp tekrar deneyin." });
      return;
    }
    setDurum({ t: "yukleniyor", yuzde: 0 });

    // XHR — fetch ilerleme yuzdesi vermiyor, davetliye/kullaniciya ilerleme gerekiyor
    const x = new XMLHttpRequest();
    x.open("POST", `/api/sahne/${ad}`);
    x.upload.onprogress = (e) => {
      if (e.lengthComputable)
        setDurum({ t: "yukleniyor", yuzde: Math.round((e.loaded / e.total) * 100) });
    };
    x.onload = () => {
      if (x.status === 200) {
        setDurum({ t: "tamam" });
        setTimeout(() => window.location.reload(), 500);
      } else {
        let m = "Yükleme başarısız.";
        try { m = JSON.parse(x.responseText).mesaj ?? m; } catch {}
        setDurum({ t: "hata", mesaj: m });
      }
    };
    x.onerror = () => setDurum({ t: "hata", mesaj: "Bağlantı kesildi." });
    x.send(dosya);
  }

  async function sil() {
    setDurum({ t: "yukleniyor", yuzde: 100 });
    const r = await fetch(`/api/sahne/${ad}`, { method: "DELETE" });
    if (r.ok) window.location.reload();
    else setDurum({ t: "hata", mesaj: "Silinemedi." });
  }

  return (
    <div className="sahne-satir">
      <div className="sahne-onizleme">
        {yol ? (
          <img src={yol} alt="" width={108} height={135} />
        ) : (
          <div className="sahne-onizleme-bos">yok</div>
        )}
      </div>

      <div className="sahne-bilgi">
        <strong>{ad}</strong>
        <span className="kucuk">{aciklama}</span>

        {repoda ? (
          <span className="rozet">repoda kilitli — panelden değiştirilemez</span>
        ) : (
          <>
            <input
              ref={girdi}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) gonder(f);
                e.target.value = "";
              }}
            />
            <div className="butonlar" style={{ justifyContent: "flex-start", marginTop: ".4rem" }}>
              <button
                className="btn"
                style={{ minHeight: 38, padding: ".3rem .8rem", fontSize: ".9rem" }}
                onClick={() => girdi.current?.click()}
                disabled={durum.t === "yukleniyor"}
              >
                {yuklenmis ? "Değiştir" : "Yükle"}
              </button>
              {yuklenmis && (
                <button
                  className="btn"
                  style={{ minHeight: 38, padding: ".3rem .8rem", fontSize: ".9rem" }}
                  onClick={sil}
                  disabled={durum.t === "yukleniyor"}
                >
                  Kaldır
                </button>
              )}
            </div>
          </>
        )}

        {durum.t === "yukleniyor" && (
          <div className="ilerleme" role="progressbar" aria-valuenow={durum.yuzde}>
            <span style={{ width: `${durum.yuzde}%` }} />
            <em>{durum.yuzde}%</em>
          </div>
        )}
        {durum.t === "tamam" && <span className="kucuk">Yüklendi ✓</span>}
        {durum.t === "hata" && <span className="hata">{durum.mesaj}</span>}
      </div>
    </div>
  );
}
