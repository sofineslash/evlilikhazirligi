import { db } from "./db";

export type HatiraNotu = {
  id: string;
  adSoyad: string;
  dilek: string;
};

/**
 * Admin tarafindan 'yayinla' denmis, ici dolu hatira notlarini getirir.
 */
export function yayindakiHatiraNotlari(): HatiraNotu[] {
  try {
    const rows = db()
      .prepare(
        `SELECT id, ad_soyad as adSoyad, dilek 
         FROM katilimlar 
         WHERE dilek_yayinda = 1 AND dilek IS NOT NULL AND TRIM(dilek) != '' 
         ORDER BY olusturuldu DESC`
      )
      .all() as HatiraNotu[];
    return rows;
  } catch {
    return [];
  }
}
