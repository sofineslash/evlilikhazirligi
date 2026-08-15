import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { db } from "./db";

/**
 * Ek yonetici hesaplari.
 *
 * SAHIP hesabi (.env'deki ADMIN_KULLANICI) bu tabloda DEGIL ve olmamali:
 * veritabani bozulsa ya da bu tablodaki son kayit silinse bile sahip
 * panele girebilmeli. Kilitlenmeye karsi tek garanti bu.
 *
 * Buradaki hesaplar sahiple AYNI yetkiye sahip — davetiyeyi duzenler,
 * fotograflari gorur. Amac yetki kademesi degil, sahibin kendi
 * kullanici adi/sifresini paylasmadan baskasina erisim verebilmesi.
 */

export type Kullanici = {
  id: string;
  kullanici_adi: string;
  olusturuldu: string;
};

/**
 * Kullanici adini karsilastirilabilir tek bir bicime indirger.
 *
 * DUZ toLocaleLowerCase("tr") YETMIYOR — olculdu: "TESTKULLANICI" ->
 * "testkullanıcı" (noktasiz ı) cikiyor ve "testkullanici" ile eslesmiyordu,
 * yani adini buyuk harfle yazan kullanici giris YAPAMIYORDU. Duz
 * toLowerCase() ise ters yonde bozuyor: "İ" -> "i" + birlesik nokta.
 *
 * Cozum normalizeAd ile ayni: Turkce kucult, NFD'ye ac, aksanlari at,
 * ayrismayan 'ı'yi elle 'i' yap. Boylece I/İ/i/ı hepsi 'i'de bulusuyor.
 * Yan etki: "kübranur" ile "kubranur" ayni hesap sayilir — kullanici
 * adlarinda bu istenen davranis, karistirilabilir hesap acilamaz.
 */
export function adNormalize(s: string): string {
  return s
    .trim()
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/ı/g, "i")
    .replace(/[^a-z0-9._-]/g, "");
}

export function kullanicilariListele(): Kullanici[] {
  return db()
    .prepare("SELECT id, kullanici_adi, olusturuldu FROM kullanicilar ORDER BY olusturuldu")
    .all() as Kullanici[];
}

export function kullaniciVarMi(ad: string): boolean {
  const r = db()
    .prepare("SELECT 1 FROM kullanicilar WHERE kullanici_adi = ?")
    .get(adNormalize(ad));
  return r !== undefined;
}

export function kullaniciEkleHam(ad: string, sifre: string): void {
  db()
    .prepare(
      "INSERT INTO kullanicilar (id, kullanici_adi, sifre_hash, olusturuldu) VALUES (?, ?, ?, ?)",
    )
    .run(crypto.randomUUID(), adNormalize(ad), bcrypt.hashSync(sifre, 12), new Date().toISOString());
}

export function kullaniciSilHam(id: string): void {
  db().prepare("DELETE FROM kullanicilar WHERE id = ?").run(id);
}

/**
 * Sifre dogrulama.
 *
 * Kullanici bulunamasa bile bcrypt CALISTIRILIR: aksi halde yanit suresi
 * "bu kullanici adi var mi" sorusunu cevaplar ve saldirgan gecerli
 * kullanici adlarini toplayabilir.
 */
const SAHTE_HASH = bcrypt.hashSync("bulunamadi-yer-tutucu", 12);

export function sifreDogrula(ad: string, sifre: string): boolean {
  const r = db()
    .prepare("SELECT sifre_hash FROM kullanicilar WHERE kullanici_adi = ?")
    .get(adNormalize(ad)) as { sifre_hash: string } | undefined;
  const hash = r?.sifre_hash ?? SAHTE_HASH;
  const ok = bcrypt.compareSync(sifre, hash);
  return r !== undefined && ok;
}

/** Kullanici adi kurallari — hem eklerken hem girerken ayni. */
export function adGecerliMi(ad: string): string | null {
  const t = ad.trim();
  if (t.length < 3) return "Kullanıcı adı en az 3 karakter olmalı.";
  if (t.length > 32) return "Kullanıcı adı en fazla 32 karakter olabilir.";
  if (!/^[\p{L}\p{N}._-]+$/u.test(t))
    return "Kullanıcı adında sadece harf, rakam, nokta, alt çizgi ve tire olabilir.";
  return null;
}

export function sifreGecerliMi(s: string): string | null {
  if (s.length < 8) return "Şifre en az 8 karakter olmalı.";
  if (s.length > 200) return "Şifre çok uzun.";
  return null;
}
