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
        padding: "24px 22px",
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

      {/* DEV OVERLAY GİZLEME CSS VE FONT TANIMLARI */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap');
        @font-face {
          font-family: "Nisan Script";
          font-style: normal;
          font-weight: 400;
          src: url("/fonts/great-vibes-latin-ext.woff2") format("woff2");
        }
        @font-face {
          font-family: "Nisan Script";
          font-style: normal;
          font-weight: 400;
          src: url("/fonts/great-vibes-latin.woff2") format("woff2");
        }
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

      {/* KRALİYET DÜĞÜN KARTI (1280px içine ferah ve dengeli yayılmış, alt ve üst kenar yumuşatmalarıyla) */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          width: "100%",
          height: "100%",
          boxSizing: "border-box",
          background:
            "linear-gradient(175deg, rgba(254, 252, 248, 0.96) 0%, rgba(249, 243, 234, 0.94) 50%, rgba(242, 233, 219, 0.97) 100%)",
          border: "2px solid rgba(197, 160, 89, 0.85)",
          borderRadius: "32px",
          padding: "8px",
          boxShadow:
            "0 25px 70px rgba(0,0,0,0.65), 0 8px 24px rgba(0,0,0,0.35), inset 0 1px 2px rgba(255,255,255,0.9)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* İÇ ÇERÇEVE */}
        <div
          style={{
            border: "1.5px solid rgba(197, 160, 89, 0.5)",
            borderRadius: "26px",
            padding: "36px 26px 40px 26px",
            textAlign: "center",
            background:
              "radial-gradient(circle at 50% 18%, rgba(255, 255, 255, 0.55) 0%, transparent 80%)",
            height: "100%",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          {/* 1. BLOK: ÜST MOTİF VE NİŞANLANIYORUZ */}
          <div>
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
                  width: "80px",
                  height: "1px",
                  background: "linear-gradient(to left, rgba(197, 160, 89, 0.9), transparent)",
                }}
              />
              <span style={{ color: "#967126", fontSize: "20px" }}>❖</span>
              <div
                style={{
                  width: "80px",
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
              }}
            >
              N İ Ş A N L A N I Y O R U Z
            </div>
          </div>

          {/* 2. BLOK: ÇİFT KESME FİGÜRLERİ VE İSİMLER */}
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "170px",
              margin: "8px 0",
            }}
          >
            {(gelinPng || damatPng) && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  justifyContent: "center",
                  gap: "170px",
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
                      height: "165px",
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
                      height: "165px",
                      objectFit: "contain",
                      filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.22))",
                    }}
                  />
                )}
              </div>
            )}

            {/* İSİMLER — SİTEDEKİ ORİJİNAL EL YAZISI */}
            <h1
              className="isimler isimler-script tema2-isimler"
              style={{
                position: "relative",
                zIndex: 2,
                fontFamily: '"Snell Roundhand", "Nisan Script", "Great Vibes", cursive, Georgia, serif',
                fontSize: "66px",
                color: "#241a10",
                lineHeight: 1.15,
                fontWeight: 400,
                margin: "0",
                padding: "10px 0",
                textShadow:
                  "0 0 16px rgba(253, 249, 242, 0.95), 0 0 8px rgba(253, 249, 242, 0.85)",
                whiteSpace: "nowrap",
              }}
            >
              <span>{gelin}</span>
              <span
                className="ve"
                style={{
                  fontFamily: '"Hoefler Text", Georgia, serif',
                  fontSize: "0.65em",
                  fontStyle: "italic",
                  color: "#9e7520",
                  margin: "0 8px",
                  display: "inline-block",
                  verticalAlign: "middle",
                }}
              >
                &amp;
              </span>
              <span>{damat}</span>
            </h1>
          </div>

          {/* 3. BLOK: SÜTUNLU ŞIK TARİH BLOĞU */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-around",
              background: "rgba(255, 255, 255, 0.75)",
              borderTop: "1.5px solid rgba(197, 160, 89, 0.65)",
              borderBottom: "1.5px solid rgba(197, 160, 89, 0.65)",
              borderRadius: "16px",
              padding: "20px 24px",
              margin: "6px 0",
              boxShadow: "0 4px 16px rgba(197, 160, 89, 0.12)",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
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

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
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

          {/* 4. BLOK: AYRAÇ VE DAVET CÜMLESİ */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "14px",
                margin: "8px 0 12px 0",
              }}
            >
              <div
                style={{
                  width: "45px",
                  height: "1px",
                  background: "rgba(197, 160, 89, 0.5)",
                }}
              />
              <span style={{ color: "#967126", fontSize: "15px" }}>▼</span>
              <div
                style={{
                  width: "45px",
                  height: "1px",
                  background: "rgba(197, 160, 89, 0.5)",
                }}
              />
            </div>

            <p
              style={{
                fontSize: "24px",
                fontStyle: "italic",
                color: "#261d14",
                lineHeight: 1.6,
                margin: "0 14px",
                fontWeight: 500,
              }}
            >
              Nişan törenimizde sizleri de aramızda görmekten mutluluk duyarız.
            </p>
          </div>

          {/* 5. BLOK: AİLELER (Yan Yana Şık Sütunlar) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "28px",
              borderTop: "1.5px solid rgba(197, 160, 89, 0.4)",
              borderBottom: "1.5px solid rgba(197, 160, 89, 0.4)",
              padding: "20px 12px",
              margin: "6px 0",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: "21px", fontWeight: 700, color: "#2d2319" }}>
                Satu &amp; Akif
              </span>
              <span
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "#8c651e",
                  letterSpacing: "1.2px",
                }}
              >
                YAVAŞ
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: "21px", fontWeight: 700, color: "#2d2319" }}>
                Nurten KAZANASMAZ
              </span>
              <span
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "#8c651e",
                  letterSpacing: "1.2px",
                }}
              >
                Cemal ÖZ
              </span>
            </div>
          </div>

          {/* 6. BLOK: TÖREN VE SALON BÖLÜMÜ (İkram ve Kokteyl kaldırıldı, ferah butonlar) */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.75)",
              border: "1.5px solid rgba(197, 160, 89, 0.55)",
              borderRadius: "20px",
              padding: "24px 20px 26px 20px",
              boxShadow: "0 6px 20px rgba(197, 160, 89, 0.12)",
            }}
          >
            <div
              style={{
                fontSize: "26px",
                fontWeight: 700,
                color: "#20170f",
                marginBottom: "10px",
                lineHeight: 1.3,
              }}
            >
              {CFG.SALON_AD}
            </div>

            <p
              style={{
                fontSize: "20px",
                color: "#463a2d",
                margin: "0 0 18px 0",
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
                gap: "16px",
              }}
            >
              <span
                style={{
                  background: "#fdfaf4",
                  border: "1px solid rgba(197, 160, 89, 0.65)",
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
                  border: "1px solid rgba(197, 160, 89, 0.65)",
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
          </div>
        </div>
      </div>
    </div>
  );
}
