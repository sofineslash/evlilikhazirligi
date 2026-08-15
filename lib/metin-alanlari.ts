/**
 * SADECE sabitler — veritabanina DOKUNMAZ.
 *
 * Ayri dosyada, cunku istemci bileseni (MetinDuzenle) bunlari kullaniyor.
 * lib/metin.ts icinde birakilsaydi better-sqlite3 -> fs zinciri istemci
 * paketine surukleniyordu ve build kiriliyordu.
 */
export const METIN_ALANLARI = [
  { anahtar: "gelin_ad", etiket: "Gelinin adı", ipucu: "Davetiyede görünecek — soyisim yazma", cok_satir: false },
  { anahtar: "damat_ad", etiket: "Damadın adı", ipucu: "Davetiyede görünecek — soyisim yazma", cok_satir: false },
  { anahtar: "davet_cumlesi", etiket: "Davet cümlesi", ipucu: "Davetiyenin ana cümlesi", cok_satir: true },
  { anahtar: "zarf_notu",     etiket: "Zarfın üstündeki not",
    ipucu: "El yazısıyla görünür. Satır sonu koyduğun yerden kırılır.", cok_satir: true },

  { anahtar: "damat_bicim", etiket: "Damadın ailesi nasıl yazılsın?", ipucu: "", cok_satir: false,
    secenekler: [
      { deger: "birlikte", etiket: "Birlikte — İsim & İsim / Soyisim" },
      { deger: "ayri",     etiket: "Ayrı — İsim Soyisim / İsim Soyisim" },
    ] },
  { anahtar: "damat_anne_ad",    etiket: "Damadın annesi — adı",    ipucu: "", cok_satir: false },
  { anahtar: "damat_anne_soyad", etiket: "Damadın annesi — soyadı", ipucu: "", cok_satir: false },
  { anahtar: "damat_baba_ad",    etiket: "Damadın babası — adı",    ipucu: "", cok_satir: false },
  { anahtar: "damat_baba_soyad", etiket: "Damadın babası — soyadı", ipucu: "", cok_satir: false },

  { anahtar: "gelin_bicim", etiket: "Gelinin ailesi nasıl yazılsın?", ipucu: "", cok_satir: false,
    secenekler: [
      { deger: "birlikte", etiket: "Birlikte — İsim & İsim / Soyisim" },
      { deger: "ayri",     etiket: "Ayrı — İsim Soyisim / İsim Soyisim" },
    ] },
  { anahtar: "gelin_anne_ad",    etiket: "Gelinin annesi — adı",    ipucu: "", cok_satir: false },
  { anahtar: "gelin_anne_soyad", etiket: "Gelinin annesi — soyadı", ipucu: "", cok_satir: false },
  { anahtar: "gelin_baba_ad",    etiket: "Gelinin babası — adı",    ipucu: "", cok_satir: false },
  { anahtar: "gelin_baba_soyad", etiket: "Gelinin babası — soyadı", ipucu: "", cok_satir: false },

  { anahtar: "kart_beyaz", etiket: "Kartın beyazlığı", ipucu: "", cok_satir: false,
    sayi: { min: 40, max: 100, adim: 1, birim: "%", guvenliAlt: 62,
            uyari: "62'nin altında, fotoğrafın koyu bölgelerinde yazı okunmaz hale gelebilir." } },
  { anahtar: "kart_blur", etiket: "Arka fotoğrafın bulanıklığı", ipucu: "", cok_satir: false,
    sayi: { min: 0, max: 30, adim: 1, birim: "px", guvenliAlt: 0, uyari: "" } },
  { anahtar: "iletisim_tel",  etiket: "İletişim telefonu", ipucu: "Formu doldurmak istemeyenler için", cok_satir: false },
  { anahtar: "yemek_notu",    etiket: "Yemek notu",        ipucu: "örn. Yemekli / Kokteyl ikramlı", cok_satir: false },
  { anahtar: "otopark_notu",  etiket: "Otopark notu",      ipucu: "örn. Kapalı otopark mevcuttur", cok_satir: false },
  { anahtar: "kapanis",       etiket: "Kapanış cümlesi",   ipucu: "Formun altında görünür", cok_satir: true },
  { anahtar: "foto_notu",     etiket: "Fotoğraf yükleme notu",
    ipucu: "Fotoğraf yükle butonunun hemen altında, küçük puntoyla görünür", cok_satir: true },

  { anahtar: "galeri_acik", etiket: "Galeri (misafirler görsün mü?)", cok_satir: false,
    ipucu: "Kapalıyken galeri SADECE bu panelde. Davetiyede hiçbir iz olmaz.",
    secenekler: [
      { deger: "kapali", etiket: "Kapalı — galeriyi sadece biz görelim" },
      { deger: "acik",   etiket: "Açık — davetiyenin arkasında herkes görsün" },
    ] },
  { anahtar: "yukleme_modu", etiket: "Fotoğraf yükleme", cok_satir: false,
    ipucu: "Kapalıyken butona basan misafire açılış saati yazısı gösterilir",
    secenekler: [
      { deger: "otomatik", etiket: "Otomatik — nişan saatinde açılır (29 Ekim 19:00)" },
      { deger: "acik",     etiket: "Açık — şimdiden yüklenebilsin" },
      { deger: "kapali",   etiket: "Kapalı — tarih geçse bile kapalı kalsın" },
    ] },
] as const;

export type MetinAlan = (typeof METIN_ALANLARI)[number];
export type Bicim = "birlikte" | "ayri";

export type MetinAnahtar = (typeof METIN_ALANLARI)[number]["anahtar"];
