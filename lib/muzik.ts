import fs from "node:fs";
import path from "node:path";

export const MUZIK_YOLU = path.join(process.cwd(), "public", "muzik", "davetiye.mp3");

export type MuzikDurumu = {
  var: boolean;
  boyutBayt?: number;
  mtime?: number;
  url?: string;
};

export function muzikDurumu(): MuzikDurumu {
  try {
    if (fs.existsSync(MUZIK_YOLU)) {
      const stat = fs.statSync(MUZIK_YOLU);
      return {
        var: true,
        boyutBayt: stat.size,
        mtime: Math.floor(stat.mtimeMs),
        url: `/muzik/davetiye.mp3?v=${Math.floor(stat.mtimeMs)}`,
      };
    }
  } catch {}
  return { var: false };
}
