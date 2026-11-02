import { CFG, haritaLinkleri, gunModu, type GunModu } from "./config";
import { nisanOlayi, type TakvimOlayi } from "./takvim";
import { metin } from "./metin";
import { adminMi } from "./admin";
import {
  type Asama, type EtkinlikTur, VARSAYILAN_ASAMA, asamaDogrula, dugunMu, sonrasiMi, turu,
} from "./asama";
import { type TarihParcalari, isoCoz, tarihCoz } from "./tarih-tr";

/**
 * AKTİF ETKİNLİK — davetiyede gösterilecek tarih, salon, harita.
 *
 * Nişan için değerler config.ts'ten AYNEN gelir (tek gerçek kaynak, hiçbir şey
 * değişmedi). Düğün için admin panelinden girilen alanlardan okunur.
 *
 * SUNUCU TARAFI (veritabanı okur) — istemci bileşenlerine prop olarak geçilir.
 */
export type Harita = { google: string; apple: string };

export type KinaBilgisi = {
  tarih: TarihParcalari;
  yer: string;
  adres: string;
  harita: Harita | null;
};

export type Etkinlik = {
  tur: EtkinlikTur;
  /** "Nişan" | "Düğün" — cümle içinde kullanılır */
  adi: string;
  /** Davetiyenin tepe başlığı: "NİŞANLANIYORUZ" | "EVLENİYORUZ" */
  kicker: string;
  /** Tarih girilmemişse null (yalnızca düğünde mümkün) */
  tarih: TarihParcalari | null;
  salonAd: string;
  salonAdres: string;
  harita: Harita | null;
  kina: KinaBilgisi | null;
  /** Düğün bilgilerinden eksik olanlar — yönetici uyarısı için */
  eksik: string[];
};

/** Ad + adres'ten harita bağlantıları. Koordinat yok: aramayla açılır. */
export function haritaIcin(ad: string, adres: string): Harita | null {
  const q = [ad, adres].map((s) => s.trim()).filter(Boolean).join(", ");
  if (!q) return null;
  const e = encodeURIComponent(q);
  return {
    google: `https://www.google.com/maps/search/?api=1&query=${e}`,
    apple: `https://maps.apple.com/?q=${e}`,
  };
}

function nisanEtkinligi(): Etkinlik {
  // Mevcut davetiye: config'teki değerler, hiçbiri değişmedi.
  // (Bu eşleşme tests/tarih-tr.test.ts'te sabit blokla birebir doğrulanıyor.)
  return {
    tur: "nisan",
    adi: "Nişan",
    kicker: "NİŞANLANIYORUZ",
    tarih: isoCoz(CFG.TARIH),
    salonAd: CFG.SALON_AD,
    salonAdres: CFG.SALON_ADRES,
    // Orijinal harita mantığı (koordinat varsa onu kullanır) aynen korunuyor.
    harita: haritaLinkleri(),
    kina: null,
    eksik: [],
  };
}

function dugunEtkinligi(): Etkinlik {
  const tarih = tarihCoz(metin("dugun_tarih"), metin("dugun_saat"));
  const salonAd = metin("dugun_salon");
  const salonAdres = metin("dugun_adres");

  const eksik: string[] = [];
  if (!tarih) eksik.push("düğün tarihi (GG.AA.YYYY)");
  if (!salonAd && !salonAdres) eksik.push("düğün salonu");

  // Kına isteğe bağlı: tarih geçerliyse gösterilir.
  const kinaTarih = tarihCoz(metin("kina_tarih"), metin("kina_saat"));
  const kinaYer = metin("kina_yer");
  const kinaAdres = metin("kina_adres");
  const kina: KinaBilgisi | null = kinaTarih
    ? { tarih: kinaTarih, yer: kinaYer, adres: kinaAdres, harita: haritaIcin(kinaYer, kinaAdres) }
    : null;

  return {
    tur: "dugun",
    adi: "Düğün",
    kicker: "EVLENİYORUZ",
    tarih,
    salonAd,
    salonAdres,
    harita: haritaIcin(salonAd, salonAdres),
    kina,
    eksik,
  };
}

export function etkinlikOku(asama: Asama): Etkinlik {
  return dugunMu(asama) ? dugunEtkinligi() : nisanEtkinligi();
}

/** Kayıtlı aşama. Hiçbir şey ayarlanmamışsa nişan öncesi — bugünkü site. */
export function kayitliAsama(): Asama {
  return asamaDogrula(metin("asama")) ?? VARSAYILAN_ASAMA;
}

/**
 * Sayfada hangi aşama gösterilecek.
 *
 * `?asama=` ile ÖNİZLEME: yalnızca geliştirmede ya da giriş yapmış yönetici
 * için. Üretimde herhangi bir ziyaretçi adrese ekleyip henüz yayınlanmamış
 * aşamayı göremez (düğün bilgileri henüz açıklanmadan sızabilirdi).
 */
export async function asamaCoz(
  onizleme?: string | null,
): Promise<{ asama: Asama; onizleme: boolean }> {
  const istenen = asamaDogrula(onizleme);
  if (istenen && (process.env.NODE_ENV !== "production" || (await adminMi()))) {
    return { asama: istenen, onizleme: true };
  }
  return { asama: kayitliAsama(), onizleme: false };
}

/* ------------------------------------------------------------------ */
/* Sayfa başlığı / açıklama / paylaşım kartı metinleri                 */
/* ------------------------------------------------------------------ */

export function metaMetinleri(p: {
  asama: Asama;
  etk: Etkinlik;
  ciftBaslik: string;
  misafirAd: string;
}): { baslik: string; aciklama: string; ogAlt: string; siteAdi: string; video: boolean } {
  const { asama, etk, ciftBaslik, misafirAd } = p;

  if (sonrasiMi(asama)) {
    const durum = etk.tur === "dugun" ? "Evlendik" : "Nişanlandık";
    return {
      baslik: `${ciftBaslik} — ${durum}`,
      aciklama: misafirAd
        ? `Sayın ${misafirAd}, bu özel günümüzde yanımızda olduğunuz için teşekkür ederiz.`
        : "Bu özel günümüzde yanımızda olduğunuz için teşekkür ederiz.",
      ogAlt: `${ciftBaslik} ${durum}`,
      siteAdi: `${ciftBaslik}`,
      video: false,
    };
  }

  // Nişan öncesi: mevcut metinlerle BİREBİR aynı.
  const yer = etk.tarih
    ? `${etk.tarih.metin}, ${etk.tarih.saatMetni}${etk.salonAd ? ` — ${etk.salonAd}` : ""}`
    : "";
  return {
    baslik: misafirAd
      ? `Sayın ${misafirAd} — Davetlisiniz 💌 | ${ciftBaslik}`
      : `${ciftBaslik} — ${etk.adi} Davetiyesi`,
    aciklama: misafirAd
      ? `Sayın ${misafirAd}, özel günümüzde sizleri de aramızda görmekten mutluluk duyarız.${yer ? " " + yer : ""}`
      : `Davetlisiniz! Özel günümüzde sizleri de aramızda görmekten onur ve mutluluk duyarız.${yer ? " " + yer : ""}`,
    ogAlt: `${ciftBaslik} ${etk.adi} Davetiyesi`,
    siteAdi: `${ciftBaslik} Davetiyesi`,
    video: true,
  };
}

export { turu };


/* ------------------------------------------------------------------ */
/* "Bugün!" modu                                                       */
/* ------------------------------------------------------------------ */

/**
 * Nişanda orijinal gunModu() aynen kullanılır. Düğünde etkinlik gününün
 * 00:00'ından ertesi gün 06:00'ya kadar "gün" sayılır (nişandaki kuralın aynısı).
 */
export function gunModuEtkinlik(etk: Etkinlik, simdi: Date = new Date()): GunModu {
  if (etk.tur === "nisan") return gunModu(simdi);
  if (!etk.tarih) return "oncesi";
  const t = simdi.getTime();
  const baslangic = Date.parse(
    `${etk.tarih.yil}-${String(etk.tarih.ay).padStart(2, "0")}-${String(etk.tarih.gun).padStart(2, "0")}T00:00:00+03:00`,
  );
  if (t < baslangic) return "oncesi";
  if (t < baslangic + 30 * 60 * 60 * 1000) return "gun";
  return "sonrasi";
}

/* ------------------------------------------------------------------ */
/* Takvim                                                              */
/* ------------------------------------------------------------------ */

const utcDamga = (iso: string) =>
  new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

/** Düğün/kına olayı; tarih yoksa null. Nişan için mevcut olay aynen döner. */
export function takvimOlayi(etk: Etkinlik, gelinAd: string, damatAd: string): TakvimOlayi | null {
  if (etk.tur === "nisan") return nisanOlayi();
  if (!etk.tarih) return null;
  const bas = Date.parse(etk.tarih.iso);
  const yer = [etk.salonAd, etk.salonAdres].filter(Boolean).join(", ");
  return {
    baslik: `${gelinAd} & ${damatAd} — Düğün`,
    detay: [yer, "", "Sizi aramızda görmekten mutluluk duyarız."].join("\n"),
    yer,
    baslangic: utcDamga(new Date(bas).toISOString()),
    bitis: utcDamga(new Date(bas + 5 * 60 * 60 * 1000).toISOString()),
  };
}

/** Düğün (+ varsa kına) için .ics içeriği. Tarih yoksa null. */
export function dugunIcs(etk: Etkinlik, gelinAd: string, damatAd: string): string | null {
  const dugun = takvimOlayi(etk, gelinAd, damatAd);
  if (!dugun || etk.tur !== "dugun") return null;

  const kacis = (m: string) => m.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
  const damga = utcDamga(new Date().toISOString());
  const olay = (uid: string, o: TakvimOlayi) => [
    "BEGIN:VEVENT",
    `UID:${uid}@kubranur.omuroz.com.tr`,
    `DTSTAMP:${damga}`,
    `DTSTART:${o.baslangic}`,
    `DTEND:${o.bitis}`,
    `SUMMARY:${kacis(o.baslik)}`,
    `DESCRIPTION:${kacis(o.detay)}`,
    `LOCATION:${kacis(o.yer)}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
  ];

  const satirlar = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Kubranur ve Omur//Dugun Davetiyesi//TR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...olay(`dugun-${dugun.baslangic}`, dugun),
  ];

  if (etk.kina) {
    const kb = Date.parse(etk.kina.tarih.iso);
    const kyer = [etk.kina.yer, etk.kina.adres].filter(Boolean).join(", ");
    satirlar.push(
      ...olay(`kina-${etk.kina.tarih.iso.slice(0, 10)}`, {
        baslik: `${gelinAd} & ${damatAd} — Kına`,
        detay: [kyer, "", "Sizi aramızda görmekten mutluluk duyarız."].join("\n"),
        yer: kyer,
        baslangic: utcDamga(new Date(kb).toISOString()),
        bitis: utcDamga(new Date(kb + 4 * 60 * 60 * 1000).toISOString()),
      }),
    );
  }
  satirlar.push("END:VCALENDAR");
  return satirlar.join("\r\n");
}
