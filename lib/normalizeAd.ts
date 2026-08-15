import { CFG } from "./config";

/**
 * Turkce isim normalizasyonu. Projedeki tek gercekten kolay yanlis
 * yapilabilecek ve SESSIZCE bozulacak mantik. Birim testi zorunlu.
 *
 * Bu fonksiyonun ciktisi katilimlar.ad_soyad_norm kolonuna yazilir ve
 * kismi tekil indeks ONUN uzerindedir. SQLite'in yerlesik lower()'i
 * ASCII-only oldugu icin indeks ASLA lower(ad) uzerine kurulmaz.
 */
export function normalizeAd(s: string): string {
  return s
    .trim()
    // ZORUNLU: ciplak toLowerCase() 'İ'yi iki kod noktasina cevirir ("i" + U+0307).
    .toLocaleLowerCase("tr")
    // KALDIRMA. ş ğ ç ü ö â î hepsi burada ayrisir ve bir sonraki satirda duser.
    // NFD olmadan "Ömür Öz" -> "m r z" olur (gercek Node ile dogrulandi).
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    // TEK acik gereken: 'ı' (U+0131) ayrismaz. Turkce kucultme 'I' -> 'ı'
    // verdigi icin "IBRAHIM" da buradan dogru katlanir.
    .replace(/ı/g, "i")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export type AdKontrol =
  | { ok: true; norm: string; tekKelime: boolean }
  | { ok: false; mesaj: string };

/**
 * Girdi korumasi.
 *
 * Tek kelimeli isimler KABUL EDILIR (D9): "Fatma", "Anneannem" gercek
 * davetlilerdir. Ama tekillik kontrolune girmezler — aksi halde her "Ayşe"
 * birbiriyle cakisir ve ikincisi haksiz yere "zaten kayitlisiniz" alir.
 * Tek kelimeli kayitlar her zaman yeni satir olarak yazilir ve admin
 * panelinde isaretlenir.
 */
export function adKontrol(ham: string): AdKontrol {
  const kirpik = ham.trim();
  if (kirpik.length === 0) return { ok: false, mesaj: "Lütfen adınızı yazın." };
  if (kirpik.length > CFG.AD_MAX_KARAKTER)
    return { ok: false, mesaj: `Ad en fazla ${CFG.AD_MAX_KARAKTER} karakter olabilir.` };

  const norm = normalizeAd(kirpik);
  if (norm.length < CFG.AD_MIN_KARAKTER)
    return { ok: false, mesaj: "Adınızı harflerle yazabilir misiniz?" };

  return { ok: true, norm, tekKelime: norm.split(" ").length < 2 };
}
