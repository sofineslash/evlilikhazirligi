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

  return (
    <div
      style={{
        width: "720px",
        height: "1280px",
        margin: "0",
        padding: "36px 28px",
        boxSizing: "border-box",
        position: "relative",
        background: "#16120d",
        fontFamily: "'Cinzel', Georgia, 'Times New Roman', serif",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* SİNEMATİK DERİN ARKA PLAN (Flu çift fotoğrafı + sıcak altın degrade) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${ciftGorsel})`,
          backgroundSize: "cover",
          backgroundPosition: "center 20%",
          filter: "blur(26px) brightness(0.38)",
          transform: "scale(1.1)",
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 30%, rgba(197, 160, 89, 0.25) 0%, rgba(16, 12, 8, 0.88) 85%)",
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
          overflow: hidden !important;
        }
      `}</style>

      {/* KRALİYET DÜĞÜN KARTI (Tam 720x1280 içinde alt ve üst kenar yumuşatmalarıyla eksiksiz) */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          width: "100%",
          maxHeight: "1208px",
          boxSizing: "border-box",
          background:
            "linear-gradient(175deg, rgba(254, 252, 248, 0.96) 0%, rgba(249, 243, 234, 0.94) 50%, rgba(242, 233, 219, 0.97) 100%)",
          border: "2px solid rgba(197, 160, 89, 0.85)",
          borderRadius: "28px",
          padding: "8px",
          boxShadow:
            "0 25px 70px rgba(0,0,0,0.65), 0 8px 24px rgba(0,0,0,0.35), inset 0 1px 2px rgba(255,255,255,0.9)",
        }}
      >
        {/* İÇ ÇERÇEVE */}
        <div
          style={{
            border: "1.5px solid rgba(197, 160, 89, 0.5)",
            borderRadius: "22px",
            padding: "32px 24px 34px 24px",
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
              marginBottom: "12px",
            }}
          >
            <div
              style={{
                width: "70px",
                height: "1px",
                background: "linear-gradient(to left, rgba(197, 160, 89, 0.9), transparent)",
              }}
            />
            <span style={{ color: "#967126", fontSize: "18px" }}>❖</span>
            <div
              style={{
                width: "70px",
                height: "1px",
                background: "linear-gradient(to right, rgba(197, 160, 89, 0.9), transparent)",
              }}
            />
          </div>

          <div
            style={{
              fontSize: "19px",
              fontWeight: 700,
              letterSpacing: "7px",
              color: "#8c651e",
              textTransform: "uppercase",
              marginBottom: "16px",
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
              minHeight: "155px",
              marginBottom: "16px",
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
                  opacity: 0.96,
                }}
              >
                {gelinPng && (
                  <img
                    src={gelinPng}
                    alt="Kübranur"
                    style={{
                      height: "150px",
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
                      height: "150px",
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
                fontSize: "64px",
                color: "#22170f",
                lineHeight: 1.15,
                textShadow:
                  "0 2px 5px rgba(255,255,255,0.95), 0 1px 2px rgba(197, 160, 89, 0.45)",
                padding: "8px 0",
              }}
            >
              <span>{gelin}</span>
              <span
                style={{
                  display: "inline-block",
                  margin: "0 14px",
                  color: "#c5a059",
                  fontSize: "48px",
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
              borderTop: "1.5px solid rgba(197, 160, 89, 0.6)",
              borderBottom: "1.5px solid rgba(197, 160, 89, 0.6)",
              borderRadius: "14px",
              padding: "16px 20px",
              margin: "18px 0 20px 0",
              boxShadow: "0 4px 16px rgba(197, 160, 89, 0.12)",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <span
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "#967126",
                  letterSpacing: "2.5px",
                }}
              >
                EKİM
              </span>
              <span style={{ fontSize: "16px", color: "#665a4c", fontWeight: 600 }}>2026</span>
            </div>

            <div
              style={{
                width: "2px",
                height: "54px",
                background: "rgba(197, 160, 89, 0.45)",
              }}
            />

            <div>
              <span
                style={{
                  fontSize: "64px",
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
                height: "54px",
                background: "rgba(197, 160, 89, 0.45)",
              }}
            />

            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <span
                style={{
                  fontSize: "19px",
                  fontWeight: 700,
                  color: "#967126",
                  letterSpacing: "2.5px",
                }}
              >
                PERŞEMBE
              </span>
              <span style={{ fontSize: "18px", color: "#665a4c", fontWeight: 700 }}>19:00</span>
            </div>
          </div>

          {/* AŞAĞI İNCE OK / AYRAÇ */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              margin: "14px 0",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "1px",
                background: "rgba(197, 160, 89, 0.5)",
              }}
            />
            <span style={{ color: "#967126", fontSize: "14px" }}>▼</span>
            <div
              style={{
                width: "40px",
                height: "1px",
                background: "rgba(197, 160, 89, 0.5)",
              }}
            />
          </div>

          {/* DAVET CÜMLESİ */}
          <p
            style={{
              fontSize: "23px",
              fontStyle: "italic",
              color: "#261d14",
              lineHeight: 1.55,
              margin: "16px 12px 20px 12px",
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
              gap: "24px",
              borderTop: "1.5px solid rgba(197, 160, 89, 0.4)",
              borderBottom: "1.5px solid rgba(197, 160, 89, 0.4)",
              padding: "16px 10px",
              margin: "16px 0 22px 0",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              <span style={{ fontSize: "20px", fontWeight: 700, color: "#2d2319" }}>
                Satu &amp; Akif
              </span>
              <span
                style={{
                  fontSize: "19px",
                  fontWeight: 700,
                  color: "#8c651e",
                  letterSpacing: "1px",
                }}
              >
                YAVAŞ
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              <span style={{ fontSize: "20px", fontWeight: 700, color: "#2d2319" }}>
                Nurten KAZANASMAZ
              </span>
              <span
                style={{
                  fontSize: "19px",
                  fontWeight: 700,
                  color: "#8c651e",
                  letterSpacing: "1px",
                }}
              >
                Cemal ÖZ
              </span>
            </div>
          </div>

          {/* TÖREN VE SALON BÖLÜMÜ */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.75)",
              border: "1.5px solid rgba(197, 160, 89, 0.55)",
              borderRadius: "18px",
              padding: "22px 18px",
              margin: "18px 0 6px 0",
              boxShadow: "0 6px 20px rgba(197, 160, 89, 0.12)",
            }}
          >
            <div
              style={{
                fontSize: "25px",
                fontWeight: 700,
                color: "#20170f",
                marginBottom: "8px",
                lineHeight: 1.3,
              }}
            >
              {CFG.SALON_AD}
            </div>

            <p
              style={{
                fontSize: "19px",
                color: "#463a2d",
                margin: "0 0 16px 0",
                lineHeight: 1.5,
              }}
            >
              {CFG.SALON_ADRES}
            </p>

            {/* HARİTA ETİKETLERİ */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "14px",
                marginTop: "12px",
              }}
            >
              <span
                style={{
                  background: "#fdfaf4",
                  border: "1px solid rgba(197, 160, 89, 0.65)",
                  borderRadius: "999px",
                  padding: "9px 20px",
                  fontSize: "17px",
                  fontWeight: 600,
                  color: "#8c651e",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                }}
              >
                <span>📍</span> Google Haritalar
              </span>
              <span
                style={{
                  background: "#fdfaf4",
                  border: "1px solid rgba(197, 160, 89, 0.65)",
                  borderRadius: "999px",
                  padding: "9px 20px",
                  fontSize: "17px",
                  fontWeight: 600,
                  color: "#8c651e",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                }}
              >
                <span>🧭</span> Apple Haritalar
              </span>
            </div>

            <div
              style={{
                marginTop: "14px",
                fontSize: "17px",
                color: "#8c651e",
                fontStyle: "italic",
                fontWeight: 600,
              }}
            >
              İkram ve Kokteyl
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
