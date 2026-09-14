import { describe, expect, it } from "vitest";
import {
  davetliEkle,
  davetliGetirToken,
  davetliRsvpIsle,
} from "../lib/davetliler";
import { db } from "../lib/db";

describe("Yönlendirilen Davetli RSVP ve Asıl Davetli Koruma", () => {
  it("Asıl davetli kendi adıyla yanıt verince kendi kaydını günceller", () => {
    const asil = davetliEkle({
      adSoyad: "Test Asil Davetli",
      telefon: "05551112233",
      izinliKisiSayisi: 4,
    });

    const sonuc = davetliRsvpIsle({
      token: asil.token,
      adSoyad: "Test Asil Davetli",
      durum: "geliyor",
      kisiSayisi: 2,
    });

    expect(sonuc).not.toBeNull();
    expect(sonuc?.tur).toBe("guncellendi");
    expect(sonuc?.davetli.durum).toBe("geliyor");
    expect(sonuc?.davetli.kisi_sayisi).toBe(2);

    // Veritabanından tekrar çekip teyit edelim
    const guncelAsil = davetliGetirToken(asil.token);
    expect(guncelAsil?.durum).toBe("geliyor");
    expect(guncelAsil?.kisi_sayisi).toBe(2);
  });

  it("Asıl davetlinin linkiyle başka biri (yönlendirilen) cevap verirse asıl davetlinin cevabı EZİLMEZ, yeni kayıt açılır", () => {
    // 1. Asıl davetli yanıt vermiş olsun
    const asil = davetliEkle({
      adSoyad: "Caner Yılmaz",
      telefon: "05552223344",
      izinliKisiSayisi: 2,
    });

    davetliRsvpIsle({
      token: asil.token,
      adSoyad: "Caner Yılmaz",
      durum: "geliyor",
      kisiSayisi: 2,
    });

    // 2. Caner bu linki arkadaşı "Selin Demir"e yönlendirsin
    const yonlendirmeSonuc = davetliRsvpIsle({
      token: asil.token,
      adSoyad: "Selin Demir",
      durum: "gelemiyor",
      kisiSayisi: 0,
    });

    expect(yonlendirmeSonuc).not.toBeNull();
    expect(yonlendirmeSonuc?.tur).toBe("yonlendirildi_eklendi");
    expect(yonlendirmeSonuc?.davetli.ad_soyad).toBe("Selin Demir");
    expect(yonlendirmeSonuc?.davetli.yonlendiren_davetli_id).toBe(asil.id);
    expect(yonlendirmeSonuc?.davetli.yonlendiren_ad).toBe("Caner Yılmaz");
    expect(yonlendirmeSonuc?.davetli.durum).toBe("gelemiyor");

    // 3. KRİTİK KONTROL: Caner Yılmaz'ın önceki cevabı (geliyor, 2 kişi) KORUNDU MU?
    const kontrolAsil = davetliGetirToken(asil.token);
    expect(kontrolAsil?.ad_soyad).toBe("Caner Yılmaz");
    expect(kontrolAsil?.durum).toBe("geliyor");
    expect(kontrolAsil?.kisi_sayisi).toBe(2);
    expect(kontrolAsil?.yonlendiren_davetli_id).toBeNull();

    // 4. Selin Demir tekrar aynı linke girip durumunu güncellerse kendi kaydı güncellenmeli
    const guncellemeSonuc = davetliRsvpIsle({
      token: asil.token,
      adSoyad: "Selin Demir",
      durum: "geliyor",
      kisiSayisi: 1,
    });

    expect(guncellemeSonuc?.tur).toBe("yonlendirildi_guncellendi");
    expect(guncellemeSonuc?.davetli.id).toBe(yonlendirmeSonuc?.davetli.id);
    expect(guncellemeSonuc?.davetli.durum).toBe("geliyor");
    expect(guncellemeSonuc?.davetli.kisi_sayisi).toBe(1);

    // Caner hala korunuyor mu?
    const kontrolAsilHala = davetliGetirToken(asil.token);
    expect(kontrolAsilHala?.durum).toBe("geliyor");
    expect(kontrolAsilHala?.kisi_sayisi).toBe(2);
  });
});
