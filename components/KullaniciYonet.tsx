"use client";

import { useActionState, useRef, useEffect } from "react";
import { kullaniciEkle, kullaniciSil } from "@/lib/admin";

export type KullaniciSatir = { id: string; kullanici_adi: string; olusturuldu: string };

const tarih = (s: string) =>
  new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(new Date(s));

/**
 * Yonetici hesaplari.
 *
 * Amac: sahibin KENDI kullanici adi/sifresini paylasmadan baska birine
 * panel erisimi verebilmesi. Eklenen hesaplar sahiple ayni yetkiye sahip.
 *
 * Sahip hesabi listede gorunur ama SILINEMEZ — .env'den geliyor, bu
 * tabloda kaydi yok. Kilitlenmeye karsi kasitli bir asimetri.
 */
export default function KullaniciYonet({
  kullanicilar,
  sahip,
}: {
  kullanicilar: KullaniciSatir[];
  sahip: string;
}) {
  const [state, action, bekliyor] = useActionState(
    kullaniciEkle,
    null as { ok?: boolean; ad?: string; hata?: string } | null,
  );
  const formRef = useRef<HTMLFormElement>(null);

  // Basarili eklemede formu temizle — sifre alani ekranda kalmasin.
  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state?.ok]);

  return (
    <div className="kullanici-yonet">
      <ul className="kullanici-liste">
        <li>
          <span className="kullanici-ad">
            {sahip} <span className="rozet">sahip</span>
          </span>
          <span className="kucuk">Sunucu ayarlarından gelir, buradan silinemez</span>
        </li>
        {kullanicilar.map((k) => (
          <li key={k.id}>
            <span className="kullanici-ad">{k.kullanici_adi}</span>
            <span className="kucuk">{tarih(k.olusturuldu)}</span>
            <form action={kullaniciSil.bind(null, k.id)}>
              <button className="btn" style={{ minHeight: 32, padding: ".2rem .6rem", fontSize: ".8rem" }}>
                Sil
              </button>
            </form>
          </li>
        ))}
      </ul>

      <form action={action} ref={formRef} className="kullanici-ekle">
        <h4>Yeni kullanıcı</h4>

        <label htmlFor="yeni_kullanici">Kullanıcı adı</label>
        <input
          id="yeni_kullanici" name="yeni_kullanici" type="text"
          autoComplete="off" required minLength={3} maxLength={32}
          placeholder="örn. kubranur"
        />

        <label htmlFor="yeni_sifre">Şifre</label>
        <input
          id="yeni_sifre" name="yeni_sifre" type="password"
          autoComplete="new-password" required minLength={8}
          placeholder="En az 8 karakter"
        />

        <div className="butonlar" style={{ justifyContent: "flex-start", marginTop: ".9rem" }}>
          <button className="btn btn-birincil" disabled={bekliyor}>
            {bekliyor ? "Ekleniyor…" : "Kullanıcı ekle"}
          </button>
          {state?.ok && <span className="kucuk">“{state.ad}” eklendi ✓</span>}
          {state?.hata && <span className="hata">{state.hata}</span>}
        </div>

        <p className="kucuk">
          Şifreyi bir kez burada yazarsın; sonra sadece şifrelenmiş hâli saklanır,
          bir daha görüntülenemez. Unutulursa kullanıcıyı silip yeniden ekle.
        </p>
      </form>
    </div>
  );
}
