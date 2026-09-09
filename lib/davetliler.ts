import crypto from "node:crypto";
import { db } from "./db";
import { DEFAULT_DAVETIYE_ID, metinSanitize, telefonNormalize } from "./site";

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
  const izinli = Math.max(1, Math.min(20, Number(veri.izinliKisiSayisi) || 1));

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

/**
 * Misafir tarafindan bildirilen RSVP durumunu senkronize eder.
 */
export function davetliRsvpGuncelle(
  davetiyeId: string,
  token: string,
  durum: DavetliDurum,
  kisiSayisi = 1,
): boolean {
  const davetli = davetliGetirToken(token, davetiyeId);
  if (!davetli) return false;

  const simdi = new Date().toISOString();
  const izinli = davetli.izinli_kisi_sayisi || 1;
  const gercekKisi = Math.max(1, Math.min(izinli, kisiSayisi));

  const res = db()
    .prepare(
      `UPDATE davetliler
       SET durum = ?, kisi_sayisi = ?, rsvp_tarihi = ?, guncellendi = ?
       WHERE token = ? AND davetiye_id = ?`,
    )
    .run(durum, gercekKisi, simdi, simdi, token, davetiyeId);

  return res.changes > 0;
}
