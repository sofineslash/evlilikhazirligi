import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { metin } from "@/lib/metin";
import { CFG, TARIH_METNI, SAAT_METNI } from "@/lib/config";
import { davetliGetirToken } from "@/lib/davetliler";
import { misafirAdiFormatla } from "@/lib/whatsapp";

export const runtime = "nodejs";

/**
 * Dinamik 1200x630 Open Graph (OG) ve Twitter Card gorsel ureticisi.
 * WhatsApp, Telegram, Facebook ve iMessage onizlemeleri icin tam uyumlu PNG uretir.
 *
 * ONEMLI: SALT OKUMADIR!
 * Veritabaninda hicbir sayac, ilk_acilma veya state degistirmez.
 * Hata durumunda asla 500 firlatmaz; yedek (fallback) kart dondurur.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const guestParam = searchParams.get("guest") || searchParams.get("misafir");
    const tokenParam = searchParams.get("g");

    // Misafir adi cozumleme: once token varsa veritabanindan, yoksa query'den
    let misafirAd = "";
    if (tokenParam) {
      const davetli = davetliGetirToken(tokenParam);
      if (davetli?.ad_soyad) misafirAd = davetli.ad_soyad;
    }
    if (!misafirAd && guestParam) {
      misafirAd = misafirAdiFormatla(guestParam);
    }

    const gelin = metin("gelin_ad") || CFG.GELIN;
    const damat = metin("damat_ad") || CFG.DAMAT;

    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            background: "linear-gradient(135deg, #16110a 0%, #281e10 50%, #120e08 100%)",
            color: "#ffffff",
            fontFamily: "serif",
            padding: "40px",
            position: "relative",
          }}
        >
          {/* Dis Zarif Altin Cerceve */}
          <div
            style={{
              position: "absolute",
              top: "24px",
              left: "24px",
              right: "24px",
              bottom: "24px",
              border: "2px solid rgba(197, 160, 89, 0.75)",
              borderRadius: "16px",
              display: "flex",
            }}
          />

          {/* Ic Ince Cerceve */}
          <div
            style={{
              position: "absolute",
              top: "32px",
              left: "32px",
              right: "32px",
              bottom: "32px",
              border: "1px solid rgba(197, 160, 89, 0.35)",
              borderRadius: "12px",
              display: "flex",
            }}
          />

          {/* Altin Muhur / Monogram */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "72px",
              height: "72px",
              borderRadius: "36px",
              background: "linear-gradient(135deg, #d4af37 0%, #9e7520 100%)",
              border: "2px solid #f9edd2",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
              marginBottom: "16px",
            }}
          >
            <span
              style={{
                fontSize: "24px",
                fontWeight: 700,
                color: "#2a1b05",
                letterSpacing: "1px",
              }}
            >
              K · Ö
            </span>
          </div>

          {/* Ust Baslik / Kicker */}
          <div
            style={{
              fontSize: "15px",
              letterSpacing: "6px",
              color: "#c5a059",
              textTransform: "uppercase",
              marginBottom: "12px",
              fontWeight: 600,
            }}
          >
            NİŞAN DAVETİYESİ
          </div>

          {/* Kisiye Ozel Misafir Karsilama Rozeti (Varsa) */}
          {misafirAd ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "8px 24px",
                background: "rgba(197, 160, 89, 0.18)",
                border: "1px solid rgba(212, 175, 55, 0.6)",
                borderRadius: "30px",
                marginBottom: "16px",
                fontSize: "20px",
                color: "#fcf6e8",
              }}
            >
              <span>Sayın {misafirAd}, Davetlisiniz 💌</span>
            </div>
          ) : null}

          {/* Cift Isimleri */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "58px",
              fontWeight: 600,
              color: "#ffffff",
              letterSpacing: "1.5px",
              marginBottom: "16px",
              textAlign: "center",
              textShadow: "0 2px 10px rgba(0,0,0,0.6)",
            }}
          >
            <span>{gelin}</span>
            <span style={{ color: "#d4af37", margin: "0 20px", fontSize: "46px" }}>&amp;</span>
            <span>{damat}</span>
          </div>

          {/* Altin Ayrac */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              width: "360px",
              marginBottom: "18px",
            }}
          >
            <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, transparent, rgba(197, 160, 89, 0.8))" }} />
            <span style={{ color: "#d4af37", margin: "0 12px", fontSize: "14px" }}>✦</span>
            <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, rgba(197, 160, 89, 0.8), transparent)" }} />
          </div>

          {/* Tarih ve Saat */}
          <div
            style={{
              fontSize: "22px",
              color: "#f5e6ca",
              fontWeight: 500,
              marginBottom: "8px",
              letterSpacing: "1px",
            }}
          >
            {TARIH_METNI} · {SAAT_METNI}
          </div>

          {/* Salon Bilgisi */}
          <div
            style={{
              fontSize: "17px",
              color: "#c2ab87",
              letterSpacing: "0.5px",
            }}
          >
            {CFG.SALON_AD} — Pendik / İstanbul
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  } catch (err) {
    // Guvenli Fallback: Hata durumunda asla 500 dondurme, sade bir kart sun
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            background: "#1c150c",
            color: "#d4af37",
            fontFamily: "serif",
            fontSize: "42px",
          }}
        >
          <div style={{ marginBottom: "16px" }}>💌 NİŞAN DAVETİYESİ</div>
          <div style={{ fontSize: "28px", color: "#ffffff" }}>Kübranur &amp; Ömür</div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          "Cache-Control": "public, max-age=3600",
        },
      },
    );
  }
}
