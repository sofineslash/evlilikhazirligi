"use client";

import { useRef, useState } from "react";
import type { MuzikDurumu } from "@/lib/muzik";

type Durum =
  | { t: "bos" }
  | { t: "yukleniyor"; yuzde: number }
  | { t: "tamam" }
  | { t: "hata"; mesaj: string };

export default function MuzikYukle({
  baslangicDurumu,
}: {
  baslangicDurumu: MuzikDurumu;
}) {
  const [muzik, setMuzik] = useState<MuzikDurumu>(baslangicDurumu);
  const [durum, setDurum] = useState<Durum>({ t: "bos" });
  const dosyaGirdisi = useRef<HTMLInputElement>(null);

  function dosyaSecildi(e: React.ChangeEvent<HTMLInputElement>) {
    const dosya = e.target.files?.[0];
    if (!dosya) return;

    if (dosya.size > 25 * 1024 * 1024) {
      setDurum({ t: "hata", mesaj: "Dosya 25 MB'dan büyük olamaz." });
      return;
    }

    setDurum({ t: "yukleniyor", yuzde: 0 });

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/muzik");

    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable) {
        setDurum({
          t: "yukleniyor",
          yuzde: Math.round((evt.loaded / evt.total) * 100),
        });
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        try {
          const resp = JSON.parse(xhr.responseText);
          setMuzik(resp.durum ?? { var: true });
        } catch {
          setMuzik({ var: true });
        }
        setDurum({ t: "tamam" });
        setTimeout(() => {
          setDurum({ t: "bos" });
          window.location.reload();
        }, 600);
      } else {
        let m = "Yükleme başarısız.";
        try {
          m = JSON.parse(xhr.responseText).mesaj ?? m;
        } catch {}
        setDurum({ t: "hata", mesaj: m });
      }
    };

    xhr.onerror = () => {
      setDurum({ t: "hata", mesaj: "Bağlantı hatası oluştu." });
    };

    xhr.send(dosya);
  }

  async function sil() {
    if (!confirm("Yüklü fon müziğini silmek istediğinize emin misiniz?")) return;
    setDurum({ t: "yukleniyor", yuzde: 100 });
    try {
      const res = await fetch("/api/muzik", { method: "DELETE" });
      if (res.ok) {
        setMuzik({ var: false });
        setDurum({ t: "bos" });
        window.location.reload();
      } else {
        setDurum({ t: "hata", mesaj: "Müzik silinemedi." });
      }
    } catch {
      setDurum({ t: "hata", mesaj: "Bağlantı hatası." });
    }
  }

  const boyutMb = muzik.boyutBayt
    ? (muzik.boyutBayt / (1024 * 1024)).toFixed(2) + " MB"
    : null;

  return (
    <div
      style={{
        marginTop: "1.5rem",
        padding: "1.2rem",
        background: "var(--kagit, #f8f6f0)",
        border: "1.5px solid rgba(184, 134, 11, 0.35)",
        borderRadius: "14px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.5rem",
          marginBottom: "0.6rem",
        }}
      >
        <div>
          <h3 style={{ margin: "0 0 0.2rem", fontSize: "1.05rem" }}>
            🎵 Fon Müziği (davetiye.mp3)
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: "0.85rem",
              color: "var(--soluk, #666)",
            }}
          >
            Hem Tema 1 hem Tema 2 için açılışta çalan romantik fon müziği. MP3
            formatında (en fazla 25 MB).
          </p>
        </div>
        {muzik.var && (
          <span
            style={{
              fontSize: "0.78rem",
              padding: "0.2rem 0.6rem",
              background: "#e6f4ea",
              color: "#137333",
              borderRadius: "999px",
              fontWeight: 600,
            }}
          >
            ✓ Müzik Yüklü {boyutMb && `(${boyutMb})`}
          </span>
        )}
      </div>

      {muzik.var && muzik.url && (
        <div style={{ margin: "0.8rem 0" }}>
          <audio
            controls
            src={muzik.url}
            style={{ width: "100%", height: "36px" }}
          />
        </div>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
          flexWrap: "wrap",
          marginTop: "0.8rem",
        }}
      >
        <input
          ref={dosyaGirdisi}
          type="file"
          accept="audio/*,.mp3,.m4a,.wav,.aac"
          onChange={dosyaSecildi}
          style={{ display: "none" }}
        />

        <button
          type="button"
          className="btn btn-birincil"
          onClick={() => dosyaGirdisi.current?.click()}
          disabled={durum.t === "yukleniyor"}
          style={{ minHeight: "38px", fontSize: "0.88rem" }}
        >
          {muzik.var ? "Müziği Değiştir..." : "Müzik Dosyası Seç & Yükle"}
        </button>

        {muzik.var && (
          <button
            type="button"
            className="btn"
            onClick={sil}
            disabled={durum.t === "yukleniyor"}
            style={{
              minHeight: "38px",
              fontSize: "0.88rem",
              color: "#c5221f",
              borderColor: "rgba(197, 34, 31, 0.4)",
            }}
          >
            Müziği Sil
          </button>
        )}

        {durum.t === "yukleniyor" && (
          <span style={{ fontSize: "0.85rem", color: "var(--birincil)" }}>
            Yükleniyor: %{durum.yuzde}
          </span>
        )}

        {durum.t === "tamam" && (
          <span style={{ fontSize: "0.85rem", color: "#137333", fontWeight: 600 }}>
            ✓ Başarıyla kaydedildi!
          </span>
        )}

        {durum.t === "hata" && (
          <span style={{ fontSize: "0.85rem", color: "#c5221f" }}>
            Hata: {durum.mesaj}
          </span>
        )}
      </div>

      <div
        style={{
          marginTop: "0.8rem",
          paddingTop: "0.6rem",
          borderTop: "1px dashed rgba(0, 0, 0, 0.1)",
          fontSize: "0.78rem",
          color: "var(--soluk, #777)",
        }}
      >
        📁 İsterseniz dosyayı doğrudan proje klasörüne de atabilirsiniz:{" "}
        <code style={{ background: "rgba(0,0,0,0.06)", padding: "2px 5px", borderRadius: "4px" }}>
          public/muzik/davetiye.mp3
        </code>
      </div>
    </div>
  );
}
