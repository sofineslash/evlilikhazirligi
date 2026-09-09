import { describe, expect, it } from "vitest";
import {
  siteUrl,
  slugSanitize,
  metinSanitize,
  telefonNormalize,
  DEFAULT_DAVETIYE_SLUG,
} from "../lib/site";
import {
  misafirAdiFormatla,
  whatsappMesajiUret,
  whatsappGonderUrl,
  VARSAYILAN_WHATSAPP_SABLONU,
} from "../lib/whatsapp";
import { kriptografikTokenUret } from "../lib/davetliler";

describe("lib/site", () => {
  it("slugSanitize: turkce karakterleri ve ozel sembolleri guvenle temizler", () => {
    expect(slugSanitize("ömür-kübra")).toBe("omur-kubra");
    expect(slugSanitize("Kübranur & Ömür!")).toBe("kubranur-omur");
    expect(slugSanitize("")).toBe(DEFAULT_DAVETIYE_SLUG);
    expect(slugSanitize("---test---slug---")).toBe("test-slug");
  });

  it("metinSanitize: XSS ve tehlikeli karakterleri eler", () => {
    expect(metinSanitize("<script>alert('x')</script>Ahmet")).toBe("alertxAhmet");
    expect(metinSanitize("Ahmet \"Mehmet\" <bold>Yılmaz</bold>")).toBe("Ahmet Mehmet Yılmaz");
    expect(metinSanitize("a".repeat(100), 20).length).toBe(20);
  });

  it("telefonNormalize: Turk ve uluslararasi numaralari saf rakamlara donusturur", () => {
    expect(telefonNormalize("0532 123 45 67")).toBe("905321234567");
    expect(telefonNormalize("+90 (532) 123-4567")).toBe("905321234567");
    expect(telefonNormalize("00905321234567")).toBe("905321234567");
    expect(telefonNormalize("5321234567")).toBe("905321234567");
    expect(telefonNormalize("+49 170 1234567")).toBe("491701234567");
    expect(telefonNormalize(null)).toBe("");
  });
});

describe("lib/whatsapp", () => {
  it("misafirAdiFormatla: isimleri duzgun bas harflere cevirir", () => {
    expect(misafirAdiFormatla("ahmet-yılmaz")).toBe("Ahmet Yılmaz");
    expect(misafirAdiFormatla("ahmet-yilmaz")).toBe("Ahmet Yilmaz");
    expect(misafirAdiFormatla("ömer-faruk-öz")).toBe("Ömer Faruk Öz");
    expect(misafirAdiFormatla("mehmet_ali")).toBe("Mehmet Ali");
    expect(misafirAdiFormatla("")).toBe("");
    expect(misafirAdiFormatla(null)).toBe("");
  });

  it("whatsappMesajiUret: genel davetiyede sablonu dogru doldurur", () => {
    const mesaj = whatsappMesajiUret({
      gelin: "Kübranur",
      damat: "Ömür",
      tarih: "29 Ekim 2026, Perşembe",
      salon: "Asır Davet",
      url: "https://kubranur.omuroz.com.tr/davet/omur-kubra",
    });

    expect(mesaj).toContain("Kübranur & Ömür");
    expect(mesaj).toContain("Davetlisiniz!");
    expect(mesaj).toContain("https://kubranur.omuroz.com.tr/davet/omur-kubra");
    expect(mesaj).not.toContain("{cift}");
    expect(mesaj).not.toContain("{link}");
  });

  it("whatsappMesajiUret: misafir yoksa {misafir} gecen satiri temizler", () => {
    const sablon = "Sayın {misafir},\n{cift} davetlisiniz!\n{link}";
    const mesaj = whatsappMesajiUret({
      sablon,
      gelin: "Kübranur",
      damat: "Ömür",
      tarih: "29 Ekim",
      salon: "Asır",
      url: "https://test.com",
    });

    expect(mesaj).not.toContain("Sayın");
    expect(mesaj).toContain("Kübranur & Ömür davetlisiniz!");
  });

  it("whatsappMesajiUret: misafir varsa {misafir} alanini doldurur", () => {
    const sablon = "Sayın {misafir},\n{cift} davetlisiniz!\n{link}";
    const mesaj = whatsappMesajiUret({
      sablon,
      gelin: "Kübranur",
      damat: "Ömür",
      tarih: "29 Ekim",
      salon: "Asır",
      url: "https://test.com",
      misafir: "Ahmet Yılmaz",
    });

    expect(mesaj).toContain("Sayın Ahmet Yılmaz,");
  });

  it("whatsappGonderUrl: telefon varsa wa.me, yoksa api.whatsapp.com uretir", () => {
    const urlTel = whatsappGonderUrl({
      telefon: "0532 111 22 33",
      mesaj: "Merhaba Kübra & Ömür",
    });
    expect(urlTel).toContain("https://wa.me/905321112233?text=Merhaba");

    const urlGenel = whatsappGonderUrl({
      mesaj: "Genel Davet",
    });
    expect(urlGenel).toContain("https://api.whatsapp.com/send?text=Genel%20Davet");
  });
});

describe("lib/davetliler", () => {
  it("kriptografikTokenUret: en az 12 karakterlik URL-safe token olusturur", () => {
    const t1 = kriptografikTokenUret();
    const t2 = kriptografikTokenUret();
    expect(t1.length).toBeGreaterThanOrEqual(12);
    expect(t1).not.toBe(t2);
    expect(t1).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});
