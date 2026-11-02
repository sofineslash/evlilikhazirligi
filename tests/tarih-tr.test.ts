import { describe, it, expect } from "vitest";
import { tarihCoz, isoCoz, buyuk } from "../lib/tarih-tr";
import { CFG, TARIH_METNI, TARIH_KISA, SAAT_METNI } from "../lib/config";

describe("lib/tarih-tr", () => {
  it("nişan tarihi config'tekiyle BİREBİR aynı çıkar (nişan öncesi değişmesin)", () => {
    const p = isoCoz(CFG.TARIH)!;
    expect(p.metin).toBe(TARIH_METNI);          // "29 Ekim 2026, Perşembe"
    expect(p.kisa).toBe(TARIH_KISA);
    expect(p.saatMetni).toBe(SAAT_METNI);
    // Tema 2'deki sabit blokla aynı olmalı
    expect(buyuk(p.ayAdi)).toBe("EKİM");
    expect(String(p.yil)).toBe("2026");
    expect(String(p.gun)).toBe("29");
    expect(buyuk(p.gunAdi)).toBe("PERŞEMBE");
    expect(p.iso).toBe(CFG.TARIH);
  });

  it("farklı yazımları kabul eder", () => {
    for (const t of ["12.09.2027", "12/09/2027", "12-09-2027", "2027-09-12", " 12.9.2027 "]) {
      expect(tarihCoz(t)?.metin, t).toBe("12 Eylül 2027, Pazar");
    }
  });

  it("gün adını elle yazılana bırakmaz, hesaplar", () => {
    expect(tarihCoz("01.01.2027")?.gunAdi).toBe("Cuma");
  });

  it("saat: 19:00 ve 19.00 aynı; boşsa 19:00; geçersizse null", () => {
    expect(tarihCoz("12.09.2027", "20.30")?.iso).toBe("2027-09-12T20:30:00+03:00");
    expect(tarihCoz("12.09.2027")?.saatMetni).toBe("19:00");
    expect(tarihCoz("12.09.2027", "25:00")).toBeNull();
    expect(tarihCoz("12.09.2027", "abc")).toBeNull();
  });

  it("olmayan ya da saçma tarihleri reddeder", () => {
    for (const t of ["31.02.2027", "00.01.2027", "12.13.2027", "yarın", "", "12.09.27", "12.09.1900"]) {
      expect(tarihCoz(t), t).toBeNull();
    }
  });

  it("Türkçe büyük harf: i → İ", () => {
    expect(buyuk("ekim")).toBe("EKİM");
    expect(buyuk("Ağustos")).toBe("AĞUSTOS");
  });
});
