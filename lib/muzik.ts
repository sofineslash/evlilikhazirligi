import fs from "node:fs";
import path from "node:path";
import { MEDYA_KOK } from "./sahneler";

export const MUZIK_KOK =
  process.env.MUZIK_KOK || path.join(path.dirname(MEDYA_KOK), "muzik");
export const REPO_MUZIK = path.join(process.cwd(), "public", "muzik", "davetiye.mp3");
export const KALICI_MUZIK = path.join(MUZIK_KOK, "davetiye.mp3");

// Geriye dönük uyumluluk için:
export const MUZIK_YOLU = REPO_MUZIK;

/**
 * Müzik dosyasını öncelik sırasına göre bulur:
 * 1) Kalıcı disk / medya/muzik/davetiye.mp3
 * 2) public/muzik/davetiye.mp3
 */
export function muzikDosyaYolu(): string | null {
  if (fs.existsSync(KALICI_MUZIK)) return KALICI_MUZIK;
  if (fs.existsSync(REPO_MUZIK)) return REPO_MUZIK;
  return null;
}

export type MuzikDurumu = {
  var: boolean;
  boyutBayt?: number;
  mtime?: number;
  url?: string;
};

export function muzikDurumu(): MuzikDurumu {
  try {
    const dosya = muzikDosyaYolu();
    if (dosya) {
      const stat = fs.statSync(dosya);
      return {
        var: true,
        boyutBayt: stat.size,
        mtime: Math.floor(stat.mtimeMs),
        url: `/api/muzik/ses?v=${Math.floor(stat.mtimeMs)}`,
      };
    }
  } catch {}
  return { var: false };
}
