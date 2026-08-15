/**
 * Zarfin ON YUZU — monogram.
 *
 * Ortada altin botanik dal, iki yaninda bas harfler, altinda el yazisi
 * bir satir ve arali buyuk harfle davet satiri.
 *
 * Zarf 3:2 YATAY: referans gorsel neredeyse kare oldugu icin dal daha
 * kisa ve harfler dala daha yakin duruyor, yoksa kompozisyon tasiyor.
 *
 * Dekoratif — ayni bilgi zarftan cikan davetiyede zaten yazili.
 */
export default function ZarfYuz({
  solHarf,
  sagHarf,
  satir,
  davet,
}: {
  solHarf: string;
  sagHarf: string;
  satir?: string;
  davet?: string;
}) {
  return (
    <div className="zarf-yazi">
      <div className="zarf-monogram">
        <span className="zarf-harf">{solHarf}</span>

        <svg className="zarf-dal" viewBox="0 0 110 220" focusable="false" aria-hidden="true">
          <defs>
            <linearGradient id="zarf-altin" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="#a8822f" />
              <stop offset="45%" stopColor="#e2c882" />
              <stop offset="100%" stopColor="#b08f3c" />
            </linearGradient>
            <path id="zarf-yaprak" d="M0 0 C 16 -10, 40 -8, 50 6 C 34 19, 13 16, 0 0 Z" />
          </defs>

          {/* Govde */}
          <path d="M55 218 L55 30" fill="none" stroke="url(#zarf-altin)"
                strokeWidth="2.6" strokeLinecap="round" />
          {/* Tepe tomurcugu */}
          <path d="M55 30 C 48 19, 50 8, 55 1 C 60 8, 62 19, 55 30 Z"
                fill="url(#zarf-altin)" />

          {/* Yapraklar — asagi indikce buyur, iki yana acilir */}
          <g fill="url(#zarf-altin)">
            {[
              { y: 48, s: 0.58 }, { y: 82, s: 0.74 },
              { y: 118, s: 0.88 }, { y: 156, s: 0.96 },
            ].map((y, i) => (
              <g key={i}>
                <use href="#zarf-yaprak"
                     transform={`translate(53 ${y.y}) rotate(-30) scale(${y.s})`} />
                <use href="#zarf-yaprak"
                     transform={`translate(57 ${y.y + 16}) rotate(150) scale(${y.s})`} />
              </g>
            ))}
          </g>
        </svg>

        <span className="zarf-harf">{sagHarf}</span>
      </div>

      {satir && <span className="zarf-satir">{satir}</span>}
      {davet && <span className="zarf-davet">{davet}</span>}
    </div>
  );
}
