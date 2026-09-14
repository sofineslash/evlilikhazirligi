import { describe, expect, it } from "vitest";
import { davetiyeVideosuVarMi, VARSAYILAN_VIDEO_URL } from "../lib/video-uretici";

describe("lib/video-uretici", () => {
  it("davetiyeVideosuVarMi: var olan video dosyasini tespit eder", () => {
    const durum = davetiyeVideosuVarMi();
    expect(durum).toHaveProperty("varMi");
    expect(durum.url).toBe(VARSAYILAN_VIDEO_URL);
    if (durum.varMi) {
      expect(durum.boyutBytes).toBeGreaterThan(1000);
      expect(durum.sonGuncellemeMs).toBeGreaterThan(0);
    }
  });

  it("davetiyeVideosuVarMi: var olmayan dosya icin false doner", () => {
    const durum = davetiyeVideosuVarMi("public/olmayan-video.mp4");
    expect(durum.varMi).toBe(false);
    expect(durum.boyutBytes).toBe(0);
  });
});
