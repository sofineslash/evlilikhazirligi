/**
 * Bellek ici sabit pencereli hiz siniri. Tek surec icin dogru yer.
 * FTP/src/ratelimit.js'ten uyarlandi.
 *
 * KRITIK (E1): anahtar ASLA socket adresi olamaz. cloudflared / ters vekil
 * arkasinda her istek tunelin yerel socket'inden gelir; socket'e anahtarlarsak
 * TUM davetliler tek kovayi paylasir ve ilk birkac istek herkesi 429'lar.
 * Yerel testlerin hepsini gecer, yalnizca 100 kisi ayni andayken gorunur.
 */
type Kova = { sayi: number; sifirlanma: number };
const kovalar = new Map<string, Kova>();

/** Istekten gercek istemci anahtarini cikarir. Oncelik: cihaz jetonu > CF IP. */
export function istemciAnahtari(req: Request, cihazJetonu?: string | null): string {
  if (cihazJetonu) return `c:${cihazJetonu}`;
  const cf = req.headers.get("cf-connecting-ip");
  if (cf) return `ip:${cf}`;
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return `ip:${xff.split(",")[0]!.trim()}`;
  // Yerel gelistirme icin son care. Uretimde buraya DUSMEMELI.
  return "ip:yerel";
}

export type HizSonuc = { ok: true } | { ok: false; saniye: number; mesaj: string };

export function hizKontrol(
  anahtar: string,
  { adet, pencere_dk }: { adet: number; pencere_dk: number },
): HizSonuc {
  const simdi = Date.now();
  const pencere = pencere_dk * 60_000;
  let k = kovalar.get(anahtar);
  if (!k || k.sifirlanma <= simdi) {
    k = { sayi: 0, sifirlanma: simdi + pencere };
    kovalar.set(anahtar, k);
  }
  k.sayi += 1;
  if (k.sayi > adet) {
    const saniye = Math.ceil((k.sifirlanma - simdi) / 1000);
    const dakika = Math.ceil(saniye / 60);
    return {
      ok: false,
      saniye,
      mesaj: `Çok fazla deneme. ${dakika} dakika sonra tekrar deneyin.`,
    };
  }
  return { ok: true };
}

// Periyodik temizlik
setInterval(() => {
  const simdi = Date.now();
  for (const [k, v] of kovalar) if (v.sifirlanma <= simdi) kovalar.delete(k);
}, 60_000).unref?.();
