/**
 * Altin varak geometrik cerceve + botanik dallar.
 *
 * SVG, CSS sekli DEGIL: gercek kalem darbeleri, degisken kalinlik, altin
 * gradyani ve yaprak yollari. Ornek davetiyedeki cerceve tam olarak bu
 * turden bir cizim — CSS ucgenleriyle yaklasilamiyordu.
 *
 * viewBox 1000x1400 (5:7, klasik davetiye orani). Icerik `children` olarak
 * cercevenin ortasina HTML akisinda yerlestirilir; SVG yalnizca dekor.
 */
export default function AltinCerceve({
  children,
  className = "",
  fon,
}: {
  children?: React.ReactNode;
  className?: string;
  /** Kartin ARKA FONU. Uzerine beyaz buzlu katman biner, yazilar okunur kalir. */
  fon?: string | null;
}) {
  return (
    <div className={`cerceve ${className}`}>
      {fon && <img className="kart-fon" src={fon} alt="" aria-hidden="true" />}
      <svg
        className="cerceve-svg"
        viewBox="0 0 1000 1400"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient id="altin" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="#f7e2a8" />
            <stop offset="18%"  stopColor="#c9a227" />
            <stop offset="38%"  stopColor="#f9edc0" />
            <stop offset="58%"  stopColor="#b8860b" />
            <stop offset="78%"  stopColor="#f2d98b" />
            <stop offset="100%" stopColor="#a4761a" />
          </linearGradient>
          <linearGradient id="altin-yaprak" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%"   stopColor="#b8860b" />
            <stop offset="45%"  stopColor="#f4dc9a" />
            <stop offset="100%" stopColor="#caa53a" />
          </linearGradient>

          {/* Tek yaprak — dallarda tekrar kullanilir */}
          <path id="yaprak" d="M0 0 C 26 -16, 62 -12, 78 10 C 54 30, 20 26, 0 0 Z" />
        </defs>

        {/* --- Cok kenarli altin cerceve: ic ve dis hat --- */}
        <polygon
          points="500,44 872,232 940,700 872,1168 500,1356 128,1168 60,700 128,232"
          fill="none" stroke="url(#altin)" strokeWidth="7" strokeLinejoin="round"
        />
        <polygon
          points="500,96 812,258 872,700 812,1142 500,1304 188,1142 128,700 188,258"
          fill="none" stroke="url(#altin)" strokeWidth="2.5" strokeLinejoin="round"
          opacity=".75"
        />
        {/* Cerceveyi kesen ince capraz hatlar — ornekteki kirik geometri */}
        <path d="M60 700 L 500 96 M940 700 L 500 1304" fill="none"
              stroke="url(#altin)" strokeWidth="2" opacity=".45" />

        {/* --- Sag ust botanik dal --- */}
        <g transform="translate(858 210) rotate(28)" fill="url(#altin-yaprak)">
          <path d="M0 0 C 60 40, 130 92, 196 176" fill="none"
                stroke="url(#altin-yaprak)" strokeWidth="4" strokeLinecap="round" />
          <use href="#yaprak" transform="translate(18 14) rotate(-24) scale(.95)" />
          <use href="#yaprak" transform="translate(56 44) rotate(-8)  scale(1.1)" />
          <use href="#yaprak" transform="translate(96 82) rotate(10)  scale(1.0)" />
          <use href="#yaprak" transform="translate(132 122) rotate(28) scale(.85)" />
          <use href="#yaprak" transform="translate(44 26)  rotate(-72) scale(.8)" />
          <use href="#yaprak" transform="translate(88 66)  rotate(-58) scale(.9)" />
          <use href="#yaprak" transform="translate(128 108) rotate(-44) scale(.75)" />
        </g>

        {/* --- Sol alt botanik dal (aynalanmis) --- */}
        <g transform="translate(142 1190) rotate(208)" fill="url(#altin-yaprak)">
          <path d="M0 0 C 60 40, 130 92, 196 176" fill="none"
                stroke="url(#altin-yaprak)" strokeWidth="4" strokeLinecap="round" />
          <use href="#yaprak" transform="translate(18 14) rotate(-24) scale(.95)" />
          <use href="#yaprak" transform="translate(56 44) rotate(-8)  scale(1.1)" />
          <use href="#yaprak" transform="translate(96 82) rotate(10)  scale(1.0)" />
          <use href="#yaprak" transform="translate(132 122) rotate(28) scale(.85)" />
          <use href="#yaprak" transform="translate(44 26)  rotate(-72) scale(.8)" />
          <use href="#yaprak" transform="translate(88 66)  rotate(-58) scale(.9)" />
          <use href="#yaprak" transform="translate(128 108) rotate(-44) scale(.75)" />
        </g>

        {/* --- Alt orta: kucuk cicekli dal --- */}
        <g transform="translate(500 1288)" fill="url(#altin-yaprak)" opacity=".95">
          <path d="M-150 0 C -80 -26, 80 -26, 150 0" fill="none"
                stroke="url(#altin-yaprak)" strokeWidth="3" strokeLinecap="round" />
          {[-118, -76, -34, 34, 76, 118].map((x, i) => (
            <use key={i} href="#yaprak"
                 transform={`translate(${x} ${-10 - (i % 2) * 6}) rotate(${x < 0 ? -150 : -30}) scale(.55)`} />
          ))}
        </g>
      </svg>

      {children && <div className="cerceve-ic">{children}</div>}
    </div>
  );
}
