"use client";
import { useActionState } from "react";
import { girisYap } from "@/lib/admin";

export default function Giris() {
  const [state, action, bekliyor] = useActionState(girisYap, null as { hata?: string } | null);
  return (
    <main>
      <h1 className="isimler" style={{ fontSize: "1.75rem", textAlign: "left" }}>
        Yönetim
      </h1>
      <div className="kart" style={{ maxWidth: "24rem" }}>
        <form action={action}>
          <label htmlFor="kullanici">Kullanıcı adı</label>
          <input
            id="kullanici"
            name="kullanici"
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
          />

          <label htmlFor="sifre">Şifre</label>
          <input
            id="sifre"
            name="sifre"
            type="password"
            autoComplete="current-password"
            required
          />

          {state?.hata && (
            <p className="hata" role="alert" style={{ marginTop: ".8rem" }}>
              {state.hata}
            </p>
          )}

          <div className="butonlar" style={{ justifyContent: "flex-start", marginTop: "1.2rem" }}>
            <button className="btn btn-birincil" disabled={bekliyor}>
              {bekliyor ? "Kontrol ediliyor…" : "Giriş"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
