import crypto from "node:crypto";
import { db } from "./db";
import { DEFAULT_DAVETIYE_ID, metinSanitize, telefonNormalize } from "./site";
import { CFG } from "./config";

export type DavetliDurum = "bekliyor" | "geliyor" | "gelemiyor" | "belirsiz";

export type Davetli = {
  id: string;
  davetiye_id: string;
  ad_soyad: string;
  telefon: string | null;
  token: string;
  kisi_sayisi: number;
  izinli_kisi_sayisi: number;
  durum: DavetliDurum;
  gonderildi_mi: number;
  whatsapp_acildi_mi: number;
  ilk_acilma: string | null;
  son_acilma: string | null;
  acilma_sayisi: number;
  rsvp_tarihi: string | null;
  masa_no: string | null;
  notlar: string | null;
  yonlendiren_davetli_id?: string | null;
  yonlendiren_ad?: string | null;
  olusturuldu: string;
  guncellendi: string;
};

/**
 * 12 karakterlik URL-safe kriptografik token uretir.
 * Tahmin edilemez, URL'de sorunsuzdur.
 */
export function kriptografikTokenUret(): string {
  return crypto.randomBytes(9).toString("base64url");
}

/**
 * Token ile davetliyi bulur.
 * ONEMLI: SALT OKUMADIR! Metadata isteklerinde ya da crawler taramalarinda
 * hicbir goruntulenme istatistigi degistirmez.
 */
export function davetliGetirToken(
  token: string,
  davetiyeId = DEFAULT_DAVETIYE_ID,
): Davetli | null {
  if (!token || typeof token !== "string") return null;
  try {
    const row = db()
      .prepare("SELECT * FROM davetliler WHERE token = ? AND davetiye_id = ?")
      .get(token.trim(), davetiyeId) as Davetli | undefined;
    return row ?? null;
  } catch (e) {
    if (e instanceof Error && /no such table/i.test(e.message)) return null;
    throw e;
  }
}

/**
 * Gercek tarayici oturumunda goruntulenmeyi kaydeder.
 * Yalnizca istemci uzerinden dedup edilerek cagirilir.
 */
export function davetliGoruntulendiIsaretle(
  token: string,
  davetiyeId = DEFAULT_DAVETIYE_ID,
): boolean {
  if (!token) return false;
  const simdi = new Date().toISOString();
  try {
    const res = db()
      .prepare(
        `UPDATE davetliler
         SET acilma_sayisi = acilma_sayisi + 1,
             son_acilma = ?,
             ilk_acilma = COALESCE(ilk_acilma, ?),
             guncellendi = ?
         WHERE token = ? AND davetiye_id = ?`,
      )
      .run(simdi, simdi, simdi, token.trim(), davetiyeId);
    return res.changes > 0;
  } catch {
    return false;
  }
}

/**
 * Yeni bir davetli kaydi olusturur.
 */
export function davetliEkle(veri: {
  adSoyad: string;
  telefon?: string | null;
  izinliKisiSayisi?: number;
  masaNo?: string | null;
  notlar?: string | null;
  davetiyeId?: string;
}): Davetli {
  const id = crypto.randomUUID();
  const token = kriptografikTokenUret();
  const simdi = new Date().toISOString();
  const davetiyeId = veri.davetiyeId || DEFAULT_DAVETIYE_ID;
  const adSoyad = metinSanitize(veri.adSoyad, 80);
  const telefon = veri.telefon ? telefonNormalize(veri.telefon) : null;
  const izinli = Math.max(1, Math.min(20, Number(veri.izinliKisiSayisi) || CFG.KISI_MAX));

  db()
    .prepare(
      `INSERT INTO davetliler (
        id, davetiye_id, ad_soyad, telefon, token,
        kisi_sayisi, izinli_kisi_sayisi, durum, gonderildi_mi,
        whatsapp_acildi_mi, masa_no, notlar, olusturuldu, guncellendi
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'bekliyor', 0, 0, ?, ?, ?, ?)`,
    )
    .run(
      id,
      davetiyeId,
      adSoyad,
      telefon,
      token,
      izinli,
      izinli,
      veri.masaNo ? metinSanitize(veri.masaNo, 30) : null,
      veri.notlar ? metinSanitize(veri.notlar, 250) : null,
      simdi,
      simdi,
    );

  return davetliGetirToken(token, davetiyeId)!;
}

/**
 * Davetlileri listeler.
 */
export function davetlileriListele(davetiyeId = DEFAULT_DAVETIYE_ID): Davetli[] {
  try {
    return db()
      .prepare(
        "SELECT * FROM davetliler WHERE davetiye_id = ? ORDER BY olusturuldu DESC",
      )
      .all(davetiyeId) as Davetli[];
  } catch (e) {
    if (e instanceof Error && /no such table/i.test(e.message)) return [];
    throw e;
  }
}

/**
 * Davetliyi siler.
 */
export function davetliSil(id: string): boolean {
  const res = db().prepare("DELETE FROM davetliler WHERE id = ?").run(id);
  return res.changes > 0;
}

/**
 * Davetlinin tokenini yeniler (eski token calismaz).
 */
export function davetliTokenYenile(id: string): string | null {
  const yeniToken = kriptografikTokenUret();
  const simdi = new Date().toISOString();
  const res = db()
    .prepare("UPDATE davetliler SET token = ?, guncellendi = ? WHERE id = ?")
    .run(yeniToken, simdi, id);
  return res.changes > 0 ? yeniToken : null;
}

/**
 * WhatsApp butonuna basildiginda "hazirlandi / acildi" durumunu gunceller.
 */
export function davetliWhatsappAcildiGuncelle(id: string, acildi = true): void {
  const simdi = new Date().toISOString();
  db()
    .prepare("UPDATE davetliler SET whatsapp_acildi_mi = ?, guncellendi = ? WHERE id = ?")
    .run(acildi ? 1 : 0, simdi, id);
}

/**
 * Admin tarafindan gercek "gonderildi" onayini isaretler.
 */
export function davetliGonderildiGuncelle(id: string, gonderildi: boolean): void {
  const simdi = new Date().toISOString();
  db()
    .prepare("UPDATE davetliler SET gonderildi_mi = ?, guncellendi = ? WHERE id = ?")
    .run(gonderildi ? 1 : 0, simdi, id);
}

export type RsvpIsleSonuc = {
  tur: "guncellendi" | "yonlendirildi_eklendi" | "yonlendirildi_guncellendi";
  davetli: Davetli;
  asilDavetli?: Davetli | null;
};

/**
 * Akıllı RSVP işleme:
 * 1. Eğer formdaki isim ile linkin asıl davetlisi aynıysa:
 *    Asıl davetlinin kendi durumunu günceller.
 * 2. Eğer link başkasına yönlendirilmişse (formdaki isim asıl davetliden farklıysa):
 *    Asıl davetlinin cevabını KORUR, üzerine YAZMAZ!
 *    Yeni bir yönlendirilen davetli kaydı açar ve asıl davetlinin ID/adıyla bağlar.
 * 3. Yönlendirilen kişi tekrar girip yanıt verirse kendi yönlendirilen kaydını günceller.
 */
export function davetliRsvpIsle(veri: {
  davetiyeId?: string;
  token: string;
  adSoyad: string;
  durum: DavetliDurum;
  kisiSayisi?: number;
}): RsvpIsleSonuc | null {
  const davetiyeId = veri.davetiyeId || DEFAULT_DAVETIYE_ID;
  const asilDavetli = davetliGetirToken(veri.token, davetiyeId);
  if (!asilDavetli) return null;

  const simdi = new Date().toISOString();
  const izinli = CFG.KISI_MAX;
  const gercekKisi = Math.max(0, Math.min(izinli, Number(veri.kisiSayisi) || 0));
  const girilenAd = metinSanitize(veri.adSoyad, 80);

  // İsim karşılaştırması (Türkçe karakter ve boşluk duyarsız)
  const normYap = (s: string) =>
    s
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLocaleLowerCase("tr");

  const ayniKisiMi = normYap(girilenAd) === normYap(asilDavetli.ad_soyad);

  // 1. DURUM: Asıl Davetli kendi yanıtını veriyor veya güncelliyor
  if (ayniKisiMi) {
    db()
      .prepare(
        `UPDATE davetliler
         SET durum = ?, kisi_sayisi = ?, rsvp_tarihi = ?, guncellendi = ?
         WHERE id = ?`,
      )
      .run(veri.durum, gercekKisi, simdi, simdi, asilDavetli.id);

    const guncel = davetliGetirToken(asilDavetli.token, davetiyeId)!;
    return { tur: "guncellendi", davetli: guncel, asilDavetli: guncel };
  }

  // 2. DURUM: Link başkasına yönlendirilmiş! (Farklı isim girdi)
  // Bu asıl davetli altında daha önce bu isimle yönlendirilen bir kayıt var mı?
  const tumYonlendirilenler = db()
    .prepare(
      `SELECT * FROM davetliler
       WHERE davetiye_id = ? AND yonlendiren_davetli_id = ?`,
    )
    .all(davetiyeId, asilDavetli.id) as Davetli[];

  const mevcutYonlendirilen = tumYonlendirilenler.find(
    (y) => normYap(y.ad_soyad) === normYap(girilenAd),
  );

  if (mevcutYonlendirilen) {
    // Daha önce bu linkle gelip cevap vermiş yönlendirilen kişi yanıtını güncelliyor
    db()
      .prepare(
        `UPDATE davetliler
         SET durum = ?, kisi_sayisi = ?, rsvp_tarihi = ?, guncellendi = ?
         WHERE id = ?`,
      )
      .run(veri.durum, gercekKisi, simdi, simdi, mevcutYonlendirilen.id);

    const guncel = davetliGetirToken(mevcutYonlendirilen.token, davetiyeId)!;
    return {
      tur: "yonlendirildi_guncellendi",
      davetli: guncel,
      asilDavetli,
    };
  }

  // Yeni bir yönlendirilen davetli kaydı aç (Asıl davetlinin cevabına ASLA dokunma!)
  const yeniId = crypto.randomUUID();
  const yeniToken = kriptografikTokenUret();

  db()
    .prepare(
      `INSERT INTO davetliler (
        id, davetiye_id, ad_soyad, telefon, token,
        kisi_sayisi, izinli_kisi_sayisi, durum, gonderildi_mi,
        whatsapp_acildi_mi, ilk_acilma, son_acilma, acilma_sayisi,
        rsvp_tarihi, masa_no, notlar, yonlendiren_davetli_id, yonlendiren_ad,
        olusturuldu, guncellendi
      ) VALUES (?, ?, ?, NULL, ?, ?, ?, ?, 1, 1, ?, ?, 1, ?, NULL, ?, ?, ?, ?, ?)`,
    )
    .run(
      yeniId,
      davetiyeId,
      girilenAd,
      yeniToken,
      gercekKisi,
      izinli,
      veri.durum,
      simdi,
      simdi,
      simdi,
      `🔗 ${asilDavetli.ad_soyad} linki üzerinden yönlendirildi`,
      asilDavetli.id,
      asilDavetli.ad_soyad,
      simdi,
      simdi,
    );

  const yeniDavetli = davetliGetirToken(yeniToken, davetiyeId)!;
  return {
    tur: "yonlendirildi_eklendi",
    davetli: yeniDavetli,
    asilDavetli,
  };
}

/**
 * Geriye uyumluluk için eski rsvp fonksiyonu
 */
export function davetliRsvpGuncelle(
  davetiyeId: string,
  token: string,
  durum: DavetliDurum,
  kisiSayisi = 1,
  adSoyad?: string,
): boolean {
  const davetli = davetliGetirToken(token, davetiyeId);
  if (!davetli) return false;
  const res = davetliRsvpIsle({
    davetiyeId,
    token,
    adSoyad: adSoyad || davetli.ad_soyad,
    durum,
    kisiSayisi,
  });
  return !!res;
}
