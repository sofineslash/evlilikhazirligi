import { describe, it, expect } from "vitest";
import { hatiraAdSoyadFormatla } from "../lib/hatira";

describe("hatiraAdSoyadFormatla", () => {
  it("kullanicinin verdigi ornek: Ahmet Mehmet Feyzi -> A. Mehmet FEYZİ", () => {
    expect(hatiraAdSoyadFormatla("Ahmet Mehmet Feyzi")).toBe("A. Mehmet FEYZİ");
    expect(hatiraAdSoyadFormatla("ahmet mehmet feyzi")).toBe("A. Mehmet FEYZİ");
    expect(hatiraAdSoyadFormatla("AHMET MEHMET FEYZİ")).toBe("A. Mehmet FEYZİ");
  });

  it("iki kelimeli isimlerde ilk isim title case, soyisim buyuk", () => {
    expect(hatiraAdSoyadFormatla("ahmet yılmaz")).toBe("Ahmet YILMAZ");
    expect(hatiraAdSoyadFormatla("ÖMÜR ÖZ")).toBe("Ömür ÖZ");
    expect(hatiraAdSoyadFormatla("kübranur yavaş")).toBe("Kübranur YAVAŞ");
  });

  it("dort kelimeli isimler", () => {
    expect(hatiraAdSoyadFormatla("ali kemal mehmet demir")).toBe("A. K. Mehmet DEMİR");
  });

  it("tek kelimeli isimler", () => {
    expect(hatiraAdSoyadFormatla("ahmet")).toBe("Ahmet");
    expect(hatiraAdSoyadFormatla("KÜBRA")).toBe("Kübra");
  });

  it("icinde 've' veya '&' gecen cift isimleri", () => {
    expect(hatiraAdSoyadFormatla("ali ve ayse kaya")).toBe("A. ve Ayse KAYA");
  });

  it("bos veya gecersiz girdiler", () => {
    expect(hatiraAdSoyadFormatla("")).toBe("");
    expect(hatiraAdSoyadFormatla("   ")).toBe("");
  });
});
