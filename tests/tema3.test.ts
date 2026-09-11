import { describe, it, expect } from "vitest";
import { METIN_ALANLARI } from "../lib/metin-alanlari";
import fs from "fs";
import path from "path";

describe("Tema 3 — The Sacred Garden Entegrasyonu", () => {
  it("METIN_ALANLARI içinde tema_secimi tema3 seçeneğini barındırmalıdır", () => {
    const temaSecimi = METIN_ALANLARI.find((a) => a.anahtar === "tema_secimi");
    expect(temaSecimi).toBeDefined();
    const tema3Option = temaSecimi?.secenekler?.find((s) => s.deger === "tema3");
    expect(tema3Option).toBeDefined();
    expect(tema3Option?.etiket).toContain("The Sacred Garden");
  });

  it("Tema 3'e özel metin alanları METIN_ALANLARI içinde tanımlı olmalıdır", () => {
    const keys = METIN_ALANLARI.map((a) => a.anahtar);
    expect(keys).toContain("tema3_baslik");
    expect(keys).toContain("tema3_ask_sozu");
    expect(keys).toContain("tema3_kiyafet_kodu");
    expect(keys).toContain("tema3_hediye_notu");
  });

  it("Tema 3 için gerekli tüm yerel varlıklar public/tema3 klasöründe mevcut olmalıdır", () => {
    const assets = [
      "intro.mp4",
      "swans.mp4",
      "muzik.mp3",
      "zarf.png",
      "gul.png",
      "right-element.png",
      "left-element.png",
      "acomm-decor.png",
      "cicek-buket.png",
      "muhur.png",
      "cift-kapanis.jpg",
      "cerceve.png",
      "separator.png",
    ];

    for (const a of assets) {
      const p = path.join(process.cwd(), "public/tema3", a);
      expect(fs.existsSync(p), `${a} dosyası public/tema3 klasöründe bulunmalıdır`).toBe(true);
      const stat = fs.statSync(p);
      expect(stat.size).toBeGreaterThan(100);
    }
  });
});
