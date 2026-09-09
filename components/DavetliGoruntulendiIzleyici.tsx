"use client";

import { useEffect } from "react";

/**
 * Yalnizca gercek kullanici tarayicisinda calisan hafif goruntulenme takipcisi.
 * Sayfa acildiktan kisa bir sure sonra arka planda istek atar.
 * Session deduplication ile ayni kullanicinin yenilemelerinde sayaci sisirmez.
 */
export default function DavetliGoruntulendiIzleyici({
  token,
  davetiyeId,
}: {
  token?: string;
  davetiyeId?: string;
}) {
  useEffect(() => {
    if (!token) return;

    // Tarayici oturumu icinde bir kez sayilsin
    const anahtar = `dav_seen_${token}`;
    try {
      if (sessionStorage.getItem(anahtar)) return;
    } catch {
      // Storage engellendiyse devam et
    }

    // 1.5 saniyelik kisa gecikme (crawler'lari ve anlik terkleri filtreler)
    const timer = setTimeout(() => {
      fetch("/api/davetli/goruntulendi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, davetiyeId }),
      })
        .then((res) => {
          if (res.ok) {
            try {
              sessionStorage.setItem(anahtar, "1");
            } catch {}
          }
        })
        .catch(() => {});
    }, 1500);

    return () => clearTimeout(timer);
  }, [token, davetiyeId]);

  return null;
}
