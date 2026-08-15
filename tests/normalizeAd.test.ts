import { describe, it, expect } from "vitest";
import { normalizeAd, adKontrol } from "../lib/normalizeAd";

describe("normalizeAd — Turkce katlama", () => {
  const gruplar: [string, string[]][] = [
    ["omur oz", ["Ömür Öz", "ÖMÜR ÖZ", "omur oz", "  Ömür  Öz "]],
    ["ibrahim oz", ["İBRAHİM  ÖZ", "ibrahim oz", "IBRAHIM OZ", "İbrahim Öz"]],
    ["isil yavas", ["Işıl Yavaş", "IŞIL YAVAŞ", "isil yavas", "ısıl yavaş"]],
    ["cagri sahin", ["Çağrı Şahin", "ÇAĞRI ŞAHİN", "cagri sahin"]],
    ["kubranur yavas", ["Kübranur Yavaş", "KÜBRANUR YAVAŞ", "kubranur yavas"]],
    ["igdir unal", ["Iğdır Ünal", "IĞDIR ÜNAL"]],
  ];
  for (const [beklenen, girdiler] of gruplar) {
    it(`"${beklenen}" grubu ayni anahtara duser`, () => {
      for (const g of girdiler) expect(normalizeAd(g)).toBe(beklenen);
    });
  }

  it("farkli isimler AYRI kalir", () => {
    expect(normalizeAd("Ahmet Yılmaz")).not.toBe(normalizeAd("Ahmet Yıldız"));
  });

  // REGRESYON: NFD adimi kaldirilirsa "Ömür Öz" -> "m r z" olur.
  // Bu test o satirin "sadelestirilmesini" yakalar.
  it("NFD regresyonu — aksanli harfler taban harfe iner, silinmez", () => {
    expect(normalizeAd("Ömür Öz")).toBe("omur oz");
    expect(normalizeAd("Kübranur Yavaş")).toBe("kubranur yavas");
    expect(normalizeAd("Ömür Öz")).not.toContain("m r z");
  });

  it("ciplak toLowerCase tuzagi — 'İ' tek kod noktasina inmeli", () => {
    expect("İ".toLocaleLowerCase("tr")).toHaveLength(1);
    expect("İ".toLowerCase()).toHaveLength(2); // tuzagin kendisi
    expect(normalizeAd("İİİ")).toBe("iii");
  });
});

describe("adKontrol — girdi korumasi", () => {
  it("bos ve emoji reddedilir", () => {
    expect(adKontrol("").ok).toBe(false);
    expect(adKontrol("🌹").ok).toBe(false);
  });
  it("cok uzun ad reddedilir", () => {
    expect(adKontrol("a".repeat(61)).ok).toBe(false);
  });
  it("tek kelimeli gercek isim KABUL edilir ama isaretlenir", () => {
    const r = adKontrol("Fatma");
    expect(r.ok).toBe(true);
    if (r.ok) { expect(r.norm).toBe("fatma"); expect(r.tekKelime).toBe(true); }
  });
  it("iki kelimeli isim isaretlenmez", () => {
    const r = adKontrol("Ömür Öz");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.tekKelime).toBe(false);
  });
});
