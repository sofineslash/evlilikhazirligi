/**
 * Davetliyi hangi tarafin cagirdigi.
 *
 * AYRI DOSYADA: lib/davetliler.ts better-sqlite3 cekiyor ve bu sabitler
 * istemci bilesenlerinde de kullaniliyor. Oradan almak butun veritabani
 * katmanini tarayici paketine sokuyor ve derleme "Can't resolve 'fs'"
 * ile kiriliyordu.
 *
 * null = henuz atanmamis. Bilerek serbest: mevcut davetlileri zorla bir
 * tarafa atamak, yanlis tarafin numarasindan davet gitmesine yol acardi.
 */
export type DavetliTaraf = "gelin" | "damat";

export const TARAF_ETIKET: Record<DavetliTaraf, string> = {
  gelin: "Kız tarafı",
  damat: "Erkek tarafı",
};

export function tarafDogrula(v: unknown): DavetliTaraf | null {
  return v === "gelin" || v === "damat" ? v : null;
}
