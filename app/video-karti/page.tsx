import { CFG, TARIH_METNI, SAAT_METNI } from "@/lib/config";
import { metin } from "@/lib/metin";
import { sahneYolu } from "@/lib/sahneler";

export const dynamic = "force-dynamic";

export default function VideoKartiSayfasi() {
  const gelin = metin("gelin_ad") || CFG.GELIN.replace(/\s+.*$/, "");
  const damat = metin("damat_ad") || CFG.DAMAT.replace(/\s+.*$/, "");

  const ciftGorsel = sahneYolu("02-cift") || "/tema3/cift-kapanis.jpg";
  const gelinPng = sahneYolu("06-gelin");
  const damatPng = sahneYolu("07-damat");

  // Kalan gün hesabı (29 Ekim 2026)
  const hedefTarih = new Date(CFG.TARIH).getTime();
  const simdi = Date.now();
  const farkMs = Math.max(0, hedefTarih - simdi);
  const kalanGun = Math.floor(farkMs / (1000 * 60 * 60 * 24));
  const kalanSaat = Math.floor((farkMs / (1000 * 60 * 60)) % 24);
  const kalanDakika = Math.floor((farkMs / (1000 * 60)) % 60);

  return (
    <div
      style={{
        width: "720px",
        minHeight: "1720px",
        margin: "0",
        padding: "16px 18px 24px 18px",
        boxSizing: "border-box",
        position: "relative",
        background: "#16120d",
        fontFamily: "'Cinzel', Georgia, 'Times New Roman', serif",
        overflow: "hidden",
      }}
    >
      {/* SİNEMATİK DERİN ARKA PLAN (Flu çift fotoğrafı + sıcak altın degrade) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${ciftGorsel})`,
          backgroundSize: "cover",
          backgroundPosition: "center top",
          filter: "blur(24px) brightness(0.40)",
          transform: "scale(1.1)",
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 25%, rgba(197, 160, 89, 0.28) 0%, rgba(18, 14, 10, 0.85) 85%)",
          zIndex: 1,
        }}
      />

      {/* DEV OVERLAY GİZLEME CSS */}
      <style>{`
        nextjs-portal, [data-nextjs-toast], [data-nextjs-dialog] {
          display: none !important;
          visibility: hidden !important;
        }
        body {
          margin: 0 !important;
          padding: 0 !important;
          background: #16120d !important;
        }
      `}</style>

      {/* KRALİYET DÜĞÜN KARTI (720px genişlik için optimize) */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          width: "100%",
          boxSizing: "border-box",
          background:
            "linear-gradient(175deg, rgba(254, 252, 248, 0.96) 0%, rgba(249, 243, 234, 0.94) 50%, rgba(242, 233, 219, 0.97) 100%)",
          border: "2px solid rgba(197, 160, 89, 0.85)",
          borderRadius: "30px",
          padding: "10px",
          boxShadow:
            "0 25px 70px rgba(0,0,0,0.65), 0 8px 24px rgba(0,0,0,0.35), inset 0 1px 2px rgba(255,255,255,0.9)",
        }}
      >
        {/* İÇ ÇERÇEVE */}
        <div
          style={{
            border: "1.5px solid rgba(197, 160, 89, 0.5)",
            borderRadius: "22px",
            padding: "40px 28px 44px 28px",
            textAlign: "center",
            background:
              "radial-gradient(circle at 50% 18%, rgba(255, 255, 255, 0.55) 0%, transparent 80%)",
          }}
        >
          {/* ÜST MOTİF VE SÜSLEME */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "16px",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                width: "90px",
                height: "1px",
                background: "linear-gradient(to left, rgba(197, 160, 89, 0.9), transparent)",
              }}
            />
            <span style={{ color: "#967126", fontSize: "20px" }}>❖</span>
            <div
              style={{
                width: "90px",
                height: "1px",
                background: "linear-gradient(to right, rgba(197, 160, 89, 0.9), transparent)",
              }}
            />
          </div>

          <div
            style={{
              fontSize: "21px",
              fontWeight: 700,
              letterSpacing: "8px",
              color: "#8c651e",
              textTransform: "uppercase",
              marginBottom: "24px",
            }}
          >
            N İ Ş A N L A N I Y O R U Z
          </div>

          {/* ÇİFT KESME FİGÜRLERİ (SOL & SAĞ) */}
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "160px",
              marginBottom: "20px",
            }}
          >
            {(gelinPng || damatPng) && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  justifyContent: "center",
                  gap: "160px",
                  alignItems: "flex-end",
                  pointerEvents: "none",
                  opacity: 0.95,
                }}
              >
                {gelinPng && (
                  <img
                    src={gelinPng}
                    alt="Kübranur"
                    style={{
                      height: "155px",
                      objectFit: "contain",
                      filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.22))",
                    }}
                  />
                )}
                {damatPng && (
                  <img
                    src={damatPng}
                    alt="Ömür"
                    style={{
                      height: "155px",
                      objectFit: "contain",
                      filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.22))",
                    }}
                  />
                )}
              </div>
            )}

            {/* İSİMLER — DEV VE NET ROMANTİK YAZI */}
            <div
              style={{
                position: "relative",
                zIndex: 2,
                fontFamily: "'Great Vibes', cursive",
                fontSize: "66px",
                color: "#22170f",
                lineHeight: 1.15,
                textShadow:
                  "0 2px 5px rgba(255,255,255,0.95), 0 1px 2px rgba(197, 160, 89, 0.45)",
                padding: "10px 0",
              }}
            >
              <span>{gelin}</span>
              <span
                style={{
                  display: "inline-block",
                  margin: "0 16px",
                  color: "#c5a059",
                  fontSize: "50px",
                  verticalAlign: "middle",
                }}
              >
                &amp;
              </span>
              <span>{damat}</span>
            </div>
          </div>

          {/* SÜTUNLU ŞIK TARİH BLOĞU */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-around",
              background: "rgba(255, 255, 255, 0.75)",
              border: "1.5px solid rgba(197, 160, 89, 0.55)",
              borderRadius: "18px",
              padding: "20px 24px",
              margin: "24px 0 30px 0",
              boxShadow: "0 6px 20px rgba(197, 160, 89, 0.15)",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              <span
                style={{
                  fontSize: "21px",
                  fontWeight: 700,
                  color: "#967126",
                  letterSpacing: "2.5px",
                }}
              >
                EKİM
              </span>
              <span style={{ fontSize: "17px", color: "#665a4c", fontWeight: 600 }}>2026</span>
            </div>

            <div
              style={{
                width: "2px",
                height: "60px",
                background: "rgba(197, 160, 89, 0.45)",
              }}
            />

            <div>
              <span
                style={{
                  fontSize: "68px",
                  fontWeight: 700,
                  color: "#8c651e",
                  lineHeight: 1,
                  fontFamily: "Georgia, serif",
                  display: "block",
                }}
              >
                29
              </span>
            </div>

            <div
              style={{
                width: "2px",
                height: "60px",
                background: "rgba(197, 160, 89, 0.45)",
              }}
            />

            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              <span
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "#967126",
                  letterSpacing: "2.5px",
                }}
              >
                PERŞEMBE
              </span>
              <span style={{ fontSize: "19px", color: "#665a4c", fontWeight: 700 }}>19:00</span>
            </div>
          </div>

          {/* AŞAĞI KAYDIR İNCE OK / AYRAÇ */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "14px",
              margin: "20px 0",
            }}
          >
            <div
              style={{
                width: "50px",
                height: "1px",
                background: "rgba(197, 160, 89, 0.55)",
              }}
            />
            <span style={{ color: "#967126", fontSize: "16px" }}>▼</span>
            <div
              style={{
                width: "50px",
                height: "1px",
                background: "rgba(197, 160, 89, 0.55)",
              }}
            />
          </div>

          {/* DAVET CÜMLESİ */}
          <p
            style={{
              fontSize: "25px",
              fontStyle: "italic",
              color: "#261d14",
              lineHeight: 1.65,
              margin: "24px 16px 30px 16px",
              fontWeight: 500,
            }}
          >
            Nişan törenimizde sizleri de aramızda görmekten mutluluk duyarız.
          </p>

          {/* AİLELER (Yan Yana Şık Sütunlar) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "28px",
              borderTop: "1.5px solid rgba(197, 160, 89, 0.4)",
              borderBottom: "1.5px solid rgba(197, 160, 89, 0.4)",
              padding: "24px 12px",
              margin: "24px 0 32px 0",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <span style={{ fontSize: "22px", fontWeight: 700, color: "#2d2319" }}>
                Satu &amp; Akif
              </span>
              <span
                style={{
                  fontSize: "20px",
                  fontWeight: 600,
                  color: "#8c651e",
                  letterSpacing: "1.5px",
                }}
              >
                Yavaş
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <span style={{ fontSize: "22px", fontWeight: 700, color: "#2d2319" }}>
                Nurten Kazanasmaz
              </span>
              <span
                style={{
                  fontSize: "20px",
                  fontWeight: 600,
                  color: "#8c651e",
                  letterSpacing: "1.5px",
                }}
              >
                Cemal Öz
              </span>
            </div>
          </div>

          {/* TÖREN VE SALON BÖLÜMÜ */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.75)",
              border: "1.5px solid rgba(197, 160, 89, 0.55)",
              borderRadius: "20px",
              padding: "28px 24px",
              margin: "28px 0 34px 0",
              boxShadow: "0 8px 24px rgba(197, 160, 89, 0.14)",
            }}
          >
            <div
              style={{
                fontSize: "27px",
                fontWeight: 700,
                color: "#20170f",
                marginBottom: "12px",
                lineHeight: 1.35,
              }}
            >
              {CFG.SALON_AD}
            </div>

            <p
              style={{
                fontSize: "21px",
                color: "#463a2d",
                margin: "0 0 20px 0",
                lineHeight: 1.55,
              }}
            >
              {CFG.SALON_ADRES}
            </p>

            {/* HARİTA ETİKETLERİ */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "16px",
                marginTop: "16px",
              }}
            >
              <span
                style={{
                  background: "#fdfaf4",
                  border: "1.5px solid rgba(197, 160, 89, 0.65)",
                  borderRadius: "999px",
                  padding: "10px 22px",
                  fontSize: "18px",
                  fontWeight: 600,
                  color: "#8c651e",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span>📍</span> Google Haritalar
              </span>
              <span
                style={{
                  background: "#fdfaf4",
                  border: "1.5px solid rgba(197, 160, 89, 0.65)",
                  borderRadius: "999px",
                  padding: "10px 22px",
                  fontSize: "18px",
                  fontWeight: 600,
                  color: "#8c651e",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span>🧭</span> Apple Haritalar
              </span>
            </div>

            <div
              style={{
                marginTop: "18px",
                fontSize: "19px",
                color: "#8c651e",
                fontStyle: "italic",
                fontWeight: 600,
              }}
            >
              İkram ve Kokteyl
            </div>
          </div>

          {/* GERİ SAYIM SAYACI */}
          <div style={{ margin: "32px 0 20px 0" }}>
            <div
              style={{
                fontFamily: "'Great Vibes', cursive",
                fontSize: "44px",
                color: "#241a10",
                marginBottom: "16px",
              }}
            >
              Geri Sayım
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "12px",
                margin: "0 auto",
                maxWidth: "520px",
              }}
            >
              {[
                { sayi: kalanGun, birim: "GÜN" },
                { sayi: kalanSaat, birim: "SAAT" },
                { sayi: kalanDakika, birim: "DAKİKA" },
                { sayi: "00", birim: "SANİYE" },
              ].map((k, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "rgba(255, 255, 255, 0.8)",
                    border: "1.5px solid rgba(197, 160, 89, 0.5)",
                    borderRadius: "14px",
                    padding: "14px 6px",
                    boxShadow: "0 4px 12px rgba(197, 160, 89, 0.1)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "36px",
                      fontWeight: 700,
                      color: "#8c651e",
                      lineHeight: 1.1,
                      fontFamily: "Georgia, serif",
                    }}
                  >
                    {String(k.sayi).padStart(2, "0")}
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      letterSpacing: "1.8px",
                      color: "#6b5e50",
                      marginTop: "4px",
                    }}
                  >
                    {k.birim}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* KAPANIŞ SÖZÜ & ALT SÜS */}
          <div style={{ marginTop: "34px" }}>
            <p
              style={{
                fontSize: "21px",
                fontStyle: "italic",
                color: "#4a3c2e",
                margin: "0 0 16px 0",
              }}
            >
              Sizleri aramızda görmek bizim için çok kıymetli.
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "16px",
              }}
            >
              <div
                style={{
                  width: "70px",
                  height: "1px",
                  background: "rgba(197, 160, 89, 0.65)",
                }}
              />
              <span style={{ color: "#967126", fontSize: "18px" }}>❖</span>
              <div
                style={{
                  width: "70px",
                  height: "1px",
                  background: "rgba(197, 160, 89, 0.65)",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

