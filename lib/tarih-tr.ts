/**
 * Türkçe tarih yardımcıları — SAF, veritabanı yok, istemcide de kullanılabilir.
 *
 * Neden elle: Intl.DateTimeFormat("tr-TR") sunucudaki ICU verisine bağlı
 * (küçük Node derlemelerinde "tr" yoksa İngilizce ay adı çıkar). Ay ve gün
 * adları sabit dizi; çıktı her makinede aynı.
 *
 * Türkiye 2016'dan beri sabit UTC+3 (yaz saati yok), bu yüzden ISO'ya +03:00
 * yazmak doğru.
 */
export const AYLAR = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
] as const;
export const GUNLER = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"] as const;

export type TarihParcalari = {
  yil: number;
  ay: number;      // 1-12
  gun: number;     // 1-31
  saat: number;
  dakika: number;
  gunAdi: string;  // "Perşembe"
  ayAdi: string;   // "Ekim"
  /** 2026-10-29T19:00:00+03:00 */
  iso: string;
  /** "29 Ekim 2026, Perşembe" */
  metin: string;
  /** "29 Ekim 2026" */
  kisa: string;
  /** "19:00" */
  saatMetni: string;
};

const iki = (n: number) => String(n).padStart(2, "0");

/**
 * "29.10.2026", "29/10/2026", "29-10-2026" ya da "2026-10-29" + "19:00"/"19.00".
 * Geçersiz ya da var olmayan tarih (31.02.2027) → null. Saat boşsa 19:00.
 */
export function tarihCoz(tarih: string, saat = ""): TarihParcalari | null {
  const t = tarih.trim();
  let g: number, a: number, y: number;
  let m = t.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (m) {
    g = Number(m[1]); a = Number(m[2]); y = Number(m[3]);
  } else if ((m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/))) {
    y = Number(m[1]); a = Number(m[2]); g = Number(m[3]);
  } else {
    return null;
  }

  let sa = 19, dk = 0;
  const s = saat.trim();
  if (s) {
    const sm = s.match(/^(\d{1,2})[:.](\d{2})$/);
    if (!sm) return null;
    sa = Number(sm[1]); dk = Number(sm[2]);
  }
  if (sa > 23 || dk > 59) return null;

  // Var olan bir gün mü? (31 Şubat gibi tarihleri yakala)
  const d = new Date(Date.UTC(y, a - 1, g));
  if (d.getUTCFullYear() !== y || d.getUTCMonth() !== a - 1 || d.getUTCDate() !== g) return null;
  if (y < 2000 || y > 2100) return null;

  const gunAdi = GUNLER[d.getUTCDay()];
  const ayAdi = AYLAR[a - 1];
  return {
    yil: y, ay: a, gun: g, saat: sa, dakika: dk, gunAdi, ayAdi,
    iso: `${y}-${iki(a)}-${iki(g)}T${iki(sa)}:${iki(dk)}:00+03:00`,
    metin: `${g} ${ayAdi} ${y}, ${gunAdi}`,
    kisa: `${g} ${ayAdi} ${y}`,
    saatMetni: `${iki(sa)}:${iki(dk)}`,
  };
}

/** ISO (+03:00) dizesinden aynı parçalar — nişan tarihi CFG.TARIH'ten gelir. */
export function isoCoz(iso: string): TarihParcalari | null {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return null;
  return tarihCoz(`${m[3]}.${m[2]}.${m[1]}`, `${m[4]}:${m[5]}`);
}

/** Türkçe büyük harf: "ekim" → "EKİM", "perşembe" → "PERŞEMBE". */
export const buyuk = (s: string) => s.toLocaleUpperCase("tr");
