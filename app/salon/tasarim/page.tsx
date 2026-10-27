import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { CFG, TARIH_METNI, SAAT_METNI } from "@/lib/config";
import { metin } from "@/lib/metin";
import { sahneYolu } from "@/lib/sahneler";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

/**
 * SALON EKRANI — 1920×1080 "Nişanımıza Hoş Geldiniz" görseli.
 *
 * Salondaki ekranda gösterilmek üzere; aile isimleri YOK, yalnızca çift,
 * karşılama ve sitenin QR'ı. Bu sayfa görseli ÜRETMEK içindir; kullanıcıya
 * giden sayfa /salon (önizleme + indirme).
 *
 * CANLIDA KAPALI: üretimde 404 döner, yalnızca yerelde açılır. Yeniden
 * üretmek için yerelde `npm run dev` çalışırken /salon/tasarim çekilir ve
 * çıktılar public/salon/ altına konur.
 *
 * QR sunucuda üretilip SVG olarak çiziliyor (görüntü değil): ekran ne kadar
 * büyük olursa olsun kenarları keskin kalır, bulanıklaşıp okunmaz hâle gelmez.
 */
export default async function SalonEkrani() {
  if (process.env.NODE_ENV === "production") notFound();

  const gelin = metin("gelin_ad") || CFG.GELIN.replace(/\s+.*$/, "");
  const damat = metin("damat_ad") || CFG.DAMAT.replace(/\s+.*$/, "");

  const adres = siteUrl();
  const gorunenAdres = adres.replace(/^https?:\/\//, "");

  const fotoCift = sahneYolu("02-cift");
  const zemin = sahneYolu("01-kapak") ?? fotoCift;

  /* Hata düzeltme "Q" (~%25): salon ekranında parlama, uzaklık ve hafif
     açı QR'ı bozabilir; yüksek düzeltme okunabilirliği korur. Modül sayısı
     yine de az kalır (29×29), yani her modül iri. */
  const qr = QRCode.create(adres, { errorCorrectionLevel: "Q" });
  const n = qr.modules.size;
  const veri = qr.modules.data;
  let yol = "";
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (veri[y * n + x]) yol += `M${x} ${y}h1v1h-1z`;
    }
  }

  const tarih = TARIH_METNI.toLocaleUpperCase("tr").replace(",", " ·");

  /* Süs ışıkları — sabit konumlar (rastgele değil): çıktı her çekimde aynı. */
  const isiklar: [number, number, number, number][] = [
    [860, 90, 7, 0.55], [905, 170, 4, 0.4], [1810, 120, 6, 0.5], [1760, 230, 3, 0.35],
    [880, 960, 5, 0.45], [1845, 930, 7, 0.5], [1790, 1010, 4, 0.35], [940, 40, 3, 0.3],
    [1500, 60, 4, 0.4], [1640, 990, 5, 0.4], [870, 560, 3, 0.3], [1860, 520, 4, 0.35],
  ];

  return (
    <div className="sl">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700;800&display=swap');
        @font-face { font-family: "Nisan Script"; font-style: normal; font-weight: 400;
          src: url("/fonts/great-vibes-latin-ext.woff2") format("woff2"); }
        @font-face { font-family: "Nisan Script"; font-style: normal; font-weight: 400;
          src: url("/fonts/great-vibes-latin.woff2") format("woff2"); }

        nextjs-portal, [data-nextjs-toast], [data-nextjs-dialog] { display: none !important; }
        html, body { margin: 0 !important; padding: 0 !important; background: #0f0a06 !important; overflow: hidden !important; }

        .sl {
          position: fixed; left: 0; top: 0; width: 1920px; height: 1080px; overflow: hidden;
          font-family: 'Cinzel', Georgia, 'Times New Roman', serif;
          color: #f6e9c9; background: #0f0a06;
        }

        /* ---- ZEMİN: kapak sahnesi, bulanık ve karartılmış ---- */
        .sl-zemin {
          position: absolute; inset: -60px;
          background-size: cover; background-position: center 36%;
          filter: blur(20px) brightness(.46) saturate(1.2);
        }
        .sl-isik {
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse 52% 78% at 70% 46%, rgba(224,178,88,.26) 0%, transparent 72%),
            radial-gradient(ellipse 40% 60% at 22% 52%, rgba(214,120,70,.20) 0%, transparent 70%),
            linear-gradient(90deg, rgba(10,6,3,.10) 0%, rgba(10,6,3,.50) 46%, rgba(10,6,3,.72) 100%);
        }
        .sl-vinyet {
          position: absolute; inset: 0;
          background: radial-gradient(ellipse 120% 105% at 50% 50%, transparent 55%, rgba(0,0,0,.55) 100%);
        }

        /* ---- ÇERÇEVE ---- */
        .sl-cerceve-1 { position: absolute; inset: 24px; border: 2px solid rgba(214,174,92,.78); border-radius: 8px; }
        .sl-cerceve-2 { position: absolute; inset: 38px; border: 1px solid rgba(214,174,92,.32); border-radius: 4px; }
        .sl-koseler span {
          position: absolute; color: #d6ae5c; font-size: 22px; line-height: 1;
          text-shadow: 0 0 12px rgba(214,174,92,.55);
        }

        /* ---- SOL: KEMER ÇERÇEVELİ FOTOĞRAF ---- */
        .sl-kemer {
          position: absolute; left: 112px; top: 92px; width: 716px; height: 896px;
          border-radius: 358px 358px 26px 26px; overflow: hidden;
          border: 3px solid #d6ae5c;
          box-shadow:
            0 0 0 12px rgba(214,174,92,.12),
            0 0 0 13px rgba(214,174,92,.55),
            0 34px 100px rgba(0,0,0,.75),
            0 0 140px rgba(224,178,88,.30);
          background: #1a1209;
        }
        .sl-kemer img { width: 100%; height: 100%; object-fit: cover; object-position: 50% 34%; display: block; }
        .sl-kemer::after {
          content: ""; position: absolute; inset: 0;
          background:
            linear-gradient(180deg, rgba(255,226,160,.10) 0%, transparent 30%),
            linear-gradient(0deg, rgba(10,6,3,.45) 0%, transparent 26%);
        }

        /* ---- SAĞ: METİN ---- */
        .sl-sag {
          position: absolute; left: 900px; right: 66px; top: 0; bottom: 0;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          text-align: center;
        }
        .sl-orn { display: flex; align-items: center; justify-content: center; gap: 22px; margin-bottom: 14px; }
        .sl-orn i { display: block; width: 150px; height: 2px; }
        .sl-orn i:first-child { background: linear-gradient(90deg, transparent, #d6ae5c); }
        .sl-orn i:last-child  { background: linear-gradient(270deg, transparent, #d6ae5c); }
        .sl-orn b { color: #e3bf6c; font-size: 26px; font-weight: 400; }

        .sl-nisan {
          font-size: 38px; font-weight: 600; letter-spacing: .5em; padding-left: .5em;
          color: #e6c476; text-shadow: 0 2px 18px rgba(0,0,0,.6);
        }

        /* Altın degrade yazı: background-clip kutuyla sınırlı olduğu için üst ve alt
           boşluk bırakılıyor — yoksa İ ve Ş'nin noktası/çengeli kesilir. */
        .sl-hos {
          margin: 6px 0 0; font-weight: 800; font-size: 108px; letter-spacing: .05em; padding-left: .05em;
          line-height: 1.2; padding-top: .16em; padding-bottom: .1em; white-space: nowrap;
          background: linear-gradient(180deg, #fff3cf 0%, #f0d286 38%, #d5a84a 72%, #aa7a2c 100%);
          -webkit-background-clip: text; background-clip: text; color: transparent;
          filter: drop-shadow(0 6px 22px rgba(0,0,0,.6));
        }

        .sl-isimler {
          font-family: 'Nisan Script', 'Great Vibes', cursive; font-weight: 400;
          font-size: 146px; line-height: 1.34; margin: -6px 0 0; white-space: nowrap;
          color: #fff6df; text-shadow: 0 4px 30px rgba(0,0,0,.65), 0 0 60px rgba(224,178,88,.35);
        }
        .sl-isimler em { font-style: normal; color: #e6c476; font-size: .62em; padding: 0 .16em; }

        .sl-ayrac { display: flex; align-items: center; justify-content: center; gap: 22px; margin: 2px 0 14px; }
        .sl-ayrac i { display: block; width: 110px; height: 2px; }
        .sl-ayrac i:first-child { background: linear-gradient(90deg, transparent, #d6ae5c); }
        .sl-ayrac i:last-child  { background: linear-gradient(270deg, transparent, #d6ae5c); }
        .sl-ayrac b { color: #e3bf6c; font-size: 18px; font-weight: 400; }

        .sl-tarih {
          font-size: 33px; font-weight: 600; letter-spacing: .24em; padding-left: .24em;
          color: #f2dba0; text-shadow: 0 2px 14px rgba(0,0,0,.6);
        }
        .sl-tarih span { color: #d6ae5c; padding: 0 .35em; }

        /* ---- QR KARTI ---- */
        .sl-qr {
          margin-top: 28px; display: flex; align-items: center; gap: 36px;
          padding: 20px 40px 20px 22px; border-radius: 28px;
          background: linear-gradient(135deg, #fffbf1 0%, #f4e8cd 100%);
          border: 3px solid #d6ae5c; text-align: left;
          box-shadow: 0 0 0 7px rgba(214,174,92,.16), 0 24px 60px rgba(0,0,0,.6), 0 0 80px rgba(224,178,88,.22);
        }
        .sl-qr-kutu {
          flex: none; width: 252px; height: 252px; padding: 14px; box-sizing: border-box;
          background: #fff; border-radius: 16px; box-shadow: inset 0 0 0 2px rgba(150,110,40,.25);
        }
        .sl-qr-kutu svg { display: block; width: 100%; height: 100%; }
        .sl-qr-baslik { font-size: 27px; font-weight: 800; letter-spacing: .14em; color: #8c651e; line-height: 1.25; }
        .sl-qr-yazi { font-size: 21px; font-weight: 500; line-height: 1.5; color: #3b2a14; margin-top: 12px; max-width: 410px; text-wrap: balance; }
        .sl-qr-adres {
          margin-top: 16px; padding-top: 14px; border-top: 2px solid rgba(197,160,89,.55);
          font-size: 21px; font-weight: 700; letter-spacing: .06em; color: #8c651e;
        }

        .sl-nokta { position: absolute; border-radius: 50%; background: radial-gradient(circle, #ffe3a0 0%, rgba(255,214,130,.0) 70%); }
      `}</style>

      {zemin && <div className="sl-zemin" style={{ backgroundImage: `url(${zemin})` }} />}
      <div className="sl-isik" />
      <div className="sl-vinyet" />

      {isiklar.map(([x, y, r, o], i) => (
        <div
          key={i}
          className="sl-nokta"
          style={{ left: x - r * 3, top: y - r * 3, width: r * 6, height: r * 6, opacity: o }}
        />
      ))}

      <div className="sl-cerceve-1" />
      <div className="sl-cerceve-2" />
      <div className="sl-koseler" aria-hidden="true">
        <span style={{ left: 54, top: 52 }}>❖</span>
        <span style={{ right: 54, top: 52 }}>❖</span>
        <span style={{ left: 54, bottom: 52 }}>❖</span>
        <span style={{ right: 54, bottom: 52 }}>❖</span>
      </div>

      {fotoCift && (
        <div className="sl-kemer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={fotoCift} alt="" />
        </div>
      )}

      <div className="sl-sag">
        <div className="sl-orn"><i /><b>❖</b><i /></div>
        <div className="sl-nisan">NİŞANIMIZA</div>
        <h1 className="sl-hos">HOŞ GELDİNİZ</h1>

        <div className="sl-isimler">
          {gelin} <em>&amp;</em> {damat}
        </div>

        <div className="sl-ayrac"><i /><b>◆</b><i /></div>
        <div className="sl-tarih">
          {tarih}<span>·</span>{SAAT_METNI}
        </div>

        <div className="sl-qr">
          <div className="sl-qr-kutu">
            <svg viewBox={`0 0 ${n} ${n}`} shapeRendering="crispEdges" role="img" aria-label={`QR kod: ${gorunenAdres}`}>
              <rect width={n} height={n} fill="#ffffff" />
              <path d={yol} fill="#1f1608" />
            </svg>
          </div>
          <div>
            <div className="sl-qr-baslik">DAVETİYEMİZE<br />ULAŞIN</div>
            <div className="sl-qr-yazi">
              Kameranızı okutun, davetiyemizi görün ve fotoğraf
              ile videolarınızı bizimle paylaşın.
            </div>
            <div className="sl-qr-adres">{gorunenAdres}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
