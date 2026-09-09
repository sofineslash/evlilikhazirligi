"use server";

import crypto from "node:crypto";
import { cookies, headers } from "next/headers";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db, ayarOku, ayarYaz } from "./db";
import { METIN_ALANLARI } from "./metin-alanlari";
import { metinYaz } from "./metin";
import { anSil } from "./anlar";
import { adminJetonuUret, adminJetonuDogrula } from "./session";
import { hizKontrol } from "./ratelimit";
import { CFG } from "./config";
import {
  adGecerliMi, adNormalize, kullaniciEkleHam, kullaniciSilHam,
  kullaniciVarMi, sifreDogrula, sifreGecerliMi,
} from "./kullanicilar";
import {
  davetliEkle,
  davetliSil,
  davetliTokenYenile,
  davetliGonderildiGuncelle,
  davetliWhatsappAcildiGuncelle,
} from "./davetliler";
import { slugSanitize, DEFAULT_DAVETIYE_SLUG } from "./site";

const CEREZ = "nisan_admin";

function nesil(): number {
  return Number(ayarOku("oturum_nesli", "1")) || 1;
}

export async function adminMi(): Promise<boolean> {
  const c = await cookies();
  return (await adminJetonuDogrula(c.get(CEREZ)?.value, nesil())) !== null;
}

/** Sabit zamanli dizge karsilastirmasi — kullanici adi zamanlamadan sizmasin. */
function esitMi(a: string, b: string): boolean {
  const x = Buffer.from(a, "utf8");
  const y = Buffer.from(b, "utf8");
  if (x.length !== y.length) {
    // Uzunluk farkinda bile sabit is yap, sonra reddet
    crypto.timingSafeEqual(x, x);
    return false;
  }
  return crypto.timingSafeEqual(x, y);
}

export async function girisYap(_prev: unknown, form: FormData) {
  // Iki katmanli hiz siniri: IP basina VE global.
  // Global olmadan bir saldirgan IP degistirerek sinirsiz deneyebilir;
  // sadece global olsa bir saldirgan cifti kendi panelinden kilitleyebilir.
  const bas = await headers();
  const ip =
    bas.get("cf-connecting-ip") ??
    bas.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "yerel";
  const ipHiz = hizKontrol(`giris-ip:${ip}`, CFG.GIRIS_HIZ);
  if (!ipHiz.ok) return { hata: ipHiz.mesaj };
  const genelHiz = hizKontrol("giris-genel", CFG.GIRIS_HIZ_GENEL);
  if (!genelHiz.ok) return { hata: genelHiz.mesaj };

  const b64 = process.env.ADMIN_PASSWORD_HASH_B64;
  const beklenenKullanici = process.env.ADMIN_KULLANICI;
  if (!b64 || !beklenenKullanici)
    return { hata: "Sunucu yapılandırılmamış (ADMIN_KULLANICI / ADMIN_PASSWORD_HASH_B64)." };
  const hash = Buffer.from(b64, "base64").toString("utf8");

  const kullanici = String(form.get("kullanici") ?? "").trim();
  const sifre = String(form.get("sifre") ?? "");

  // Kullanici adi yanlis olsa bile bcrypt'i CALISTIR — yoksa yanit suresi
  // "bu kullanici adi var mi" sorusunu cevaplar.
  const kullaniciOk = esitMi(kullanici.toLocaleLowerCase("tr"), beklenenKullanici.toLocaleLowerCase("tr"));
  const sifreOk = bcrypt.compareSync(sifre, hash);
  const sahipOk = kullaniciOk && sifreOk;

  /* Sahip degilse veritabanindaki ek hesaplara bak. sifreDogrula kullanici
     bulunamasa bile bcrypt calistirir, yani buradaki ikinci deneme de
     "bu ad var mi" sorusunu zamanlamayla cevaplamaz.
     SIRA ONEMLI: sahip HER ZAMAN once ve .env'den — tablo bozulsa bile
     sahip kilitlenip disarida kalmaz. */
  const ekOk = !sahipOk && sifreDogrula(kullanici, sifre);

  // Tek ve ayni mesaj: hangisinin yanlis oldugunu sizdirma.
  if (!sahipOk && !ekOk) return { hata: "Kullanıcı adı veya şifre hatalı." };

  const c = await cookies();
  c.set(CEREZ, await adminJetonuUret(nesil()), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CFG.OTURUM_GUN * 24 * 60 * 60,
  });
  redirect("/admin");
}

export async function cikisYap() {
  const c = await cookies();
  c.delete(CEREZ);
  redirect("/admin/giris");
}

export async function tumOturumlariDusur() {
  if (!(await adminMi())) return;
  ayarYaz("oturum_nesli", String(nesil() + 1));
  redirect("/admin/giris");
}

export async function dilekYayinla(id: string, yayinda: boolean) {
  if (!(await adminMi())) return;
  db().prepare("UPDATE katilimlar SET dilek_yayinda = ? WHERE id = ?").run(yayinda ? 1 : 0, id);
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function kayitSil(id: string) {
  if (!(await adminMi())) return;
  db().prepare("DELETE FROM katilimlar WHERE id = ?").run(id);
}

/** Yeni yonetici ekle. Yalnizca giris yapmis bir yonetici cagirabilir. */
export async function kullaniciEkle(_prev: unknown, form: FormData) {
  if (!(await adminMi())) return { hata: "Oturum bitmiş. Tekrar giriş yapın." };

  const ad = String(form.get("yeni_kullanici") ?? "").trim();
  const sifre = String(form.get("yeni_sifre") ?? "");

  const adHata = adGecerliMi(ad);
  if (adHata) return { hata: adHata };
  const sifreHata = sifreGecerliMi(sifre);
  if (sifreHata) return { hata: sifreHata };

  /* Sahibin adiyla ayni hesap ACILAMAZ: acilirsa giris sirasi geregi
     sahip kontrolu once calisip bu hesabi golgeler, kullanici da
     "sifrem calismiyor" diye takilir. */
  const sahip = process.env.ADMIN_KULLANICI ?? "";
  if (sahip && adNormalize(ad) === adNormalize(sahip)) {
    return { hata: "Bu kullanıcı adı zaten kullanılıyor." };
  }
  if (kullaniciVarMi(ad)) return { hata: "Bu kullanıcı adı zaten kullanılıyor." };

  kullaniciEkleHam(ad, sifre);
  revalidatePath("/admin");
  return { ok: true, ad: adNormalize(ad) };
}

/** Yonetici sil. Sahip hesabi bu tabloda olmadigi icin silinemez. */
export async function kullaniciSil(id: string) {
  if (!(await adminMi())) return;
  kullaniciSilHam(id);
  revalidatePath("/admin");
}

/** Galeriden fotograf/video sil. Yalnizca giris yapmis yonetici. */
export async function anlariSil(idler: string[]) {
  if (!(await adminMi())) return { hata: "Oturum bitmiş. Tekrar giriş yapın." };
  let n = 0;
  for (const id of idler) {
    if (typeof id === "string" && anSil(id)) n++;
  }
  revalidatePath("/admin");
  revalidatePath("/");
  return { ok: true, sayi: n };
}

/** Admin panelinden metin kaydetme. */
export async function metinleriKaydet(_prev: unknown, form: FormData) {
  if (!(await adminMi())) return { hata: "Oturum bitmiş. Tekrar giriş yapın." };
  let n = 0;
  for (const alan of METIN_ALANLARI) {
    const v = form.get(alan.anahtar);
    if (v === null) continue;
    metinYaz(alan.anahtar, String(v).trim().slice(0, 600));
    n++;
  }
  revalidatePath("/");
  revalidatePath("/admin");
  return { ok: true, sayi: n };
}

/** Yeni davetli ekleme server action'i */
export async function davetliEkleAction(_prev: unknown, form: FormData) {
  if (!(await adminMi())) return { hata: "Oturum bitmiş. Tekrar giriş yapın." };
  const adSoyad = String(form.get("ad_soyad") ?? "").trim();
  if (!adSoyad || adSoyad.length < 2) return { hata: "Lütfen davetlinin adını ve soyadını girin." };
  const telefon = String(form.get("telefon") ?? "").trim();
  const izinliKisi = Number(form.get("izinli_kisi_sayisi") ?? 1);
  const masaNo = String(form.get("masa_no") ?? "").trim();
  const notlar = String(form.get("notlar") ?? "").trim();

  try {
    const davetli = davetliEkle({
      adSoyad,
      telefon: telefon || null,
      izinliKisiSayisi: izinliKisi,
      masaNo: masaNo || null,
      notlar: notlar || null,
    });
    revalidatePath("/admin");
    return { ok: true, davetli };
  } catch (e: any) {
    return { hata: "Davetli kaydedilemedi: " + (e?.message || "") };
  }
}

/** Davetli silme */
export async function davetliSilAction(id: string) {
  if (!(await adminMi())) return;
  davetliSil(id);
  revalidatePath("/admin");
}

/** Davetli token yenileme */
export async function davetliTokenYenileAction(id: string) {
  if (!(await adminMi())) return null;
  const yeniToken = davetliTokenYenile(id);
  revalidatePath("/admin");
  return yeniToken;
}

/** Davetli gonderildi durumunu isaretleme */
export async function davetliGonderildiAction(id: string, gonderildi: boolean) {
  if (!(await adminMi())) return;
  davetliGonderildiGuncelle(id, gonderildi);
  revalidatePath("/admin");
}

/** WhatsApp acildi durumunu isaretleme */
export async function davetliWhatsappAcildiAction(id: string, acildi: boolean) {
  if (!(await adminMi())) return;
  davetliWhatsappAcildiGuncelle(id, acildi);
  revalidatePath("/admin");
}

/** WhatsApp mesaji ve slug ayarlarini kaydetme */
export async function whatsappAyarlariKaydetAction(_prev: unknown, form: FormData) {
  if (!(await adminMi())) return { hata: "Oturum bitmiş. Tekrar giriş yapın." };
  const slug = slugSanitize(String(form.get("davetiye_slug") ?? DEFAULT_DAVETIYE_SLUG));
  const mesaj = String(form.get("whatsapp_mesaj") ?? "").trim().slice(0, 1000);
  const ogTur = String(form.get("whatsapp_og_tur") ?? "dinamik").trim();

  metinYaz("davetiye_slug", slug);
  metinYaz("whatsapp_mesaj", mesaj);
  metinYaz("whatsapp_og_tur", ogTur);

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath(`/davet/${slug}`);
  return { ok: true };
}
