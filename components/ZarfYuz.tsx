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

        {/* Botanik dal.
            Onceki cizim bugday basagi gibi duruyordu: yapraklar ust uste
            binip govdeyi tamamen ortuyordu. Simdi yapraklar KARSILIKLI
            ciftler halinde ve aralarindan govde goruluyor; her yaprakta
            orta damar var, uclari sivri. */}
        <svg className="zarf-dal" viewBox="0 0 96 250" focusable="false" aria-hidden="true">
          <defs>
            <linearGradient id="zarf-altin" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="#a8822f" />
              <stop offset="45%" stopColor="#e2c882" />
              <stop offset="100%" stopColor="#b08f3c" />
            </linearGradient>
            {/* Mizrak bicimli yaprak: sapi 0'da, ucu +x yonunde */}
            <path id="zarf-yaprak"
                  d="M0 0 C 12 -13, 34 -15, 52 -4 C 34 10, 12 11, 0 0 Z" />
            {/* Orta damar — yapragi duz bir leke olmaktan cikariyor */}
            <path id="zarf-damar" d="M4 -1 C 20 -7, 36 -8, 49 -4" />
          </defs>

          <g fill="url(#zarf-altin)" stroke="url(#zarf-altin)">
            {/* Govde — yapraklarin ARASINDAN gorunecek kadar ince */}
            <path d="M48 248 C 46 190, 50 120, 48 40" fill="none"
                  strokeWidth="2.2" strokeLinecap="round" />

            {/* Tepe tomurcugu */}
            <path d="M48 40 C 41 28, 43 13, 48 3 C 53 13, 55 28, 48 40 Z"
                  strokeWidth="0" />

            {/* Karsilikli yaprak ciftleri. Ust cift kucuk, asagi indikce
                buyuyor — dogal dal boyle sivriliyor. */}
            {[
              { y: 58,  s: 0.46, a: 34 },
              { y: 92,  s: 0.60, a: 32 },
              { y: 128, s: 0.74, a: 30 },
              { y: 166, s: 0.86, a: 28 },
              { y: 206, s: 0.94, a: 26 },
            ].map((y, i) => (
              <g key={i}>
                {/* sag yaprak */}
                <g transform={`translate(48 ${y.y}) rotate(${-y.a}) scale(${y.s})`}>
                  <use href="#zarf-yaprak" strokeWidth="0" />
                  <use href="#zarf-damar" fill="none" stroke="#fdf8ec"
                       strokeWidth={2.2 / y.s} strokeLinecap="round" opacity=".75" />
                </g>
                {/* sol yaprak — aynalanmis, biraz asagida (dogal kayma) */}
                <g transform={`translate(48 ${y.y + 12}) rotate(${180 + y.a}) scale(${y.s})`}>
                  <use href="#zarf-yaprak" strokeWidth="0" />
                  <use href="#zarf-damar" fill="none" stroke="#fdf8ec"
                       strokeWidth={2.2 / y.s} strokeLinecap="round" opacity=".75" />
                </g>
              </g>
            ))}

            {/* Govde uzerinde kucuk tomurcuklar — referanstaki noktalar */}
            {[76, 112, 148, 188].map((y) => (
              <circle key={y} cx="48" cy={y} r="2.6" strokeWidth="0" />
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
