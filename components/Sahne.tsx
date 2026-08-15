import { sahneYolu, ORAN, type SahneAd } from "@/lib/sahneler";

/**
 * Bir Pixar sahnesi. Dosya yoksa yer tutucu cizer — kirik kutu gorunmez.
 * next/image KULLANILMAZ: varliklar zaten elle sabit boyutta ve bayt
 * butcesinde; runtime'da yeniden kodlamak bos yere sharp'i sicak yola sokar.
 */
export default function Sahne({
  ad,
  alt,
  aciklama,
  oncelikli = false,
}: {
  ad: SahneAd;
  alt: string;
  aciklama: string;
  oncelikli?: boolean;
}) {
  const yol = sahneYolu(ad);

  if (!yol) {
    return (
      <div className="sahne sahne-bos" style={{ aspectRatio: `${ORAN.w} / ${ORAN.h}` }}>
        <span className="sahne-etiket">
          <strong>{ad}</strong>
          <span>{aciklama}</span>
          <span className="sahne-olcu">
            {ORAN.w}×{ORAN.h} · 4:5 dikey
          </span>
        </span>
      </div>
    );
  }

  return (
    <img
      className="sahne"
      src={yol}
      alt={alt}
      width={ORAN.w}
      height={ORAN.h}
      loading={oncelikli ? "eager" : "lazy"}
      fetchPriority={oncelikli ? "high" : "auto"}
      decoding="async"
    />
  );
}
