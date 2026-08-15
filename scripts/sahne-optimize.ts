/**
 * Daha once yuklenmis sahne gorsellerini yerinde isler.
 *
 *   npm run sahne:optimize
 *
 * Isleme yukleme rotasina eklenmeden once yuklenen dosyalar icin. Yeni
 * yuklemeler zaten otomatik isleniyor.
 */
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { sahneIsle } from "../lib/gorsel";
import { MEDYA_KOK, UZANTILAR, SAHNELER } from "../lib/sahneler";

const kb = (n: number) => (n / 1024).toFixed(0) + " KB";

async function main() {
  if (!fs.existsSync(MEDYA_KOK)) {
    console.log("Yuklenmis sahne yok:", MEDYA_KOK);
    return;
  }
  let toplamOnce = 0, toplamSonra = 0, sayi = 0;

  for (const s of SAHNELER) {
    const mevcut = UZANTILAR.map((u) => path.join(MEDYA_KOK, s.ad + u)).find((p) =>
      fs.existsSync(p),
    );
    if (!mevcut) continue;

    const ham = await fsp.readFile(mevcut);
    const islem = await sahneIsle(ham);
    if (!islem.ok) {
      console.log(`  ${s.ad}: ATLANDI — ${islem.mesaj}`);
      continue;
    }

    const hedef = path.join(MEDYA_KOK, s.ad + ".webp");
    const gecici = path.join(MEDYA_KOK, `.${s.ad}.opt`);
    await fsp.writeFile(gecici, islem.veri);
    await fsp.rename(gecici, hedef);
    if (mevcut !== hedef) await fsp.rm(mevcut, { force: true });

    console.log(
      `  ${s.ad}: ${kb(islem.oncekiBayt)} -> ${kb(islem.bayt)}  (%${Math.round((1 - islem.bayt / islem.oncekiBayt) * 100)} kucuk)`,
    );
    toplamOnce += islem.oncekiBayt;
    toplamSonra += islem.bayt;
    sayi++;
  }

  if (sayi === 0) console.log("Islenecek dosya bulunamadi.");
  else
    console.log(
      `\nTOPLAM: ${kb(toplamOnce)} -> ${kb(toplamSonra)}  (%${Math.round((1 - toplamSonra / toplamOnce) * 100)} kucuk, ${sayi} dosya)`,
    );
}

main();
