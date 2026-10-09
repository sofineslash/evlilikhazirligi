/**
 * WhatsApp Web toplu gonderici (Playwright).
 *
 * API YOK — WhatsApp Web tarayicida acilir, QR bir kez okutulur, oturum
 * kalici profilde saklanir. Kardes proje "Paylasim"daki yaklasimin ayni.
 *
 * TARAF BASINA AYRI OTURUM: kiz tarafi ve erkek tarafi kendi numarasindan
 * kendi cevresine gonderiyor. Iki ayri kalici profil, iki ayri tarayici,
 * iki ayri gonderim kuyrugu. Tek oturum olsaydi iki taraf ayni numaradan
 * gonderirdi.
 *
 * Oturumlar modul duzeyinde tutulur. Next.js'te her istek ayri bir
 * fonksiyon cagrisi; her seferinde yeni tarayici acilsaydi QR her istekte
 * yeniden istenirdi.
 *
 * UYARI: toplu otomatik gonderim WhatsApp sartlarina aykiridir ve hesap
 * kisitlanabilir. Bu yuzden kisiler arasinda RASTGELE bekleme, gunluk
 * ust sinir ve "onayli" mod var; hepsi bilerek birakildi.
 */
import fs from "node:fs";
import path from "node:path";
import type { Browser, BrowserContext, Page } from "playwright";
import { CFG, TARIH_METNI, SAAT_METNI } from "./config";
import { metin } from "./metin";
import { siteUrl, DEFAULT_DAVETIYE_SLUG, telefonNormalize } from "./site";
import { whatsappVideoMesajiUret } from "./whatsapp";
import {
  davetlileriListele, davetliGonderildiGuncelle,
  TARAF_ETIKET, type Davetli, type DavetliTaraf,
} from "./davetliler";

/* Oturum profilleri VERI biriminde durur — konteyner yeniden kurulunca
   QR'in tekrar istenmemesi icin kalici bir birim sart. */
const PROFIL_KOK =
  process.env.WA_PROFIL ||
  path.join(path.dirname(process.env.DB_PATH || path.join(process.cwd(), "data", "nisan.db")), "wa-profil");

const profilYolu = (taraf: DavetliTaraf) => path.join(PROFIL_KOK, taraf);

const VIDEO_YOLU = path.join(process.cwd(), "public", "davetiye-video.mp4");

export type WaDurum = "kapali" | "baglaniyor" | "qr" | "bagli";
export type KalemDurum =
  | "bekliyor" | "gonderiliyor" | "onay-bekliyor"
  | "gonderildi" | "atlandi" | "bulunamadi" | "hata";

export type Ilerleme = {
  calisiyor: boolean;
  durum: WaDurum;
  toplam: number;
  gonderildi: number;
  kalemler: { id: string; ad: string; durum: KalemDurum; mesaj?: string }[];
  gunluk: string[];
  onayBekleyen: string | null;
  /** Kalici profil var mi — yani daha once QR okutulmus mu. */
  oturumVar: boolean;
};

const bekle = (ms: number) => new Promise((r) => setTimeout(r, ms));
const rastgele = (a: number, b: number) => Math.floor(a + Math.random() * (b - a));

/* ---------------------------------------------------------------- durum */

type Oturum = {
  taraf: DavetliTaraf;
  context: BrowserContext | null;
  page: Page | null;
  baglaniyor: boolean;
  sonDurum: WaDurum;
  calisiyor: boolean;
  durdurIstendi: boolean;
  onayBekleyen: string | null;
  onayCevabi: "gonder" | "atla" | "dur" | null;
  kalemDurumlari: Map<string, { ad: string; durum: KalemDurum; mesaj?: string }>;
  gunluk: string[];
  gonderilenSayi: number;
  toplamSayi: number;
};

const oturumlar = new Map<DavetliTaraf, Oturum>();

function oturum(taraf: DavetliTaraf): Oturum {
  let o = oturumlar.get(taraf);
  if (!o) {
    o = {
      taraf,
      context: null, page: null, baglaniyor: false, sonDurum: "kapali",
      calisiyor: false, durdurIstendi: false,
      onayBekleyen: null, onayCevabi: null,
      kalemDurumlari: new Map(), gunluk: [],
      gonderilenSayi: 0, toplamSayi: 0,
    };
    oturumlar.set(taraf, o);
  }
  return o;
}

function yaz(o: Oturum, s: string) {
  const t = new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  o.gunluk.push(`${t}  ${s}`);
  if (o.gunluk.length > 300) o.gunluk = o.gunluk.slice(-300);
}

/* ------------------------------------------------------------- tarayici */

async function tarayiciHazirla(o: Oturum): Promise<Page> {
  if (o.context && o.page && !o.page.isClosed()) return o.page;
  const { chromium } = await import("playwright");
  const profil = profilYolu(o.taraf);
  fs.mkdirSync(profil, { recursive: true });
  const secenek = (ekArg: string[]) => ({
    headless: process.env.WA_HEADLESS !== "0",   // sunucuda bassiz; ekran arayuze goruntu olarak akar
    viewport: { width: 1200, height: 800 },
    locale: "tr-TR",
    timezoneId: "Europe/Istanbul",
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    args: ["--disable-blink-features=AutomationControlled", ...ekArg],
  });
  try {
    o.context = await chromium.launchPersistentContext(profil, secenek([]));
  } catch (e) {
    /* Bazi sunucularda kullanici ad alani (user namespace) kapali olur ve
       Chromium'un kendi kum havuzu acilmaz. Varsayilan olarak kum havuzunu
       KAPATMIYORUZ; yalnizca acilmadiginda, gorunur bir not birakarak
       ikinci kez deniyoruz. Sessizce --no-sandbox ile baslamak guvenligi
       farkinda olmadan dusururdu. */
    yaz(o, "Tarayıcı kum havuzuyla açılamadı, --no-sandbox ile tekrar deneniyor: " +
        String(e instanceof Error ? e.message : e).split("\n")[0]);
    o.context = await chromium.launchPersistentContext(profil, secenek(["--no-sandbox"]));
  }
  o.page = o.context.pages()[0] || (await o.context.newPage());
  o.context.on("close", () => { o.context = null; o.page = null; o.sonDurum = "kapali"; });
  return o.page;
}

const SOHBET_LISTESI = '#pane-side, [data-icon="new-chat-outline"], [aria-label="Chat list"]';
const QR = "canvas, [data-ref]";
const YAZMA_KUTUSU = 'footer div[contenteditable="true"]';
/* GONDER DUGMESI — SEcici DAR tutuluyor.
   Eskiden `aria-label*="önder"` ve `*="end"` vardi; Turkce arayuzde
   MIKROFON dugmesi ("Sesli mesaj gönder") de bunlara uyuyordu. Video
   eklenemediginde mikrofon "gonder dugmesi" sanilip metin tek basina
   gonderiliyordu — video olmadan giden mesajlarin sebebi buydu. */
const GONDER_DUGMESI =
  '[data-icon="send"], [data-icon="send-light"], [data-icon="send-filled"], ' +
  '[data-icon="wds-ic-send-filled"], ' +
  'button[aria-label="Gönder"], button[aria-label="Send"], ' +
  'div[role="button"][aria-label="Gönder"], div[role="button"][aria-label="Send"]';

/* Eklenen ortamin onizlemesi: WhatsApp blob: kaynakli bir video/gorsel
   ciziyor. Sinif adlarina degil buna bakiyoruz — sinif adlari her
   guncellemede degisiyor, blob onizleme davranisi degismiyor. */
async function onizlemeAcildiMi(p: Page): Promise<boolean> {
  return p
    .evaluate(() => {
      const m = document.querySelectorAll(
        'video[src^="blob:"], img[src^="blob:"], video[src^="mediastream:"]',
      );
      return m.length > 0;
    })
    .catch(() => false);
}

async function onizlemeBekle(p: Page, enFazlaMs = 45_000): Promise<boolean> {
  const basla = Date.now();
  while (Date.now() - basla < enFazlaMs) {
    if (await onizlemeAcildiMi(p)) return true;
    await bekle(500);
  }
  return false;
}
const ARAMA = '#side div[contenteditable="true"], [aria-label="Search input textbox"], [data-tab="3"]';

async function girisBekle(o: Oturum, p: Page, zamanAsimi = 300_000): Promise<void> {
  await p.goto("https://web.whatsapp.com/", { waitUntil: "domcontentloaded" });
  const basla = Date.now();
  let uyarildi = false;
  while (Date.now() - basla < zamanAsimi) {
    if (await p.locator(SOHBET_LISTESI).first().isVisible().catch(() => false)) return;
    if (!uyarildi && (await p.locator(QR).first().isVisible().catch(() => false))) {
      yaz(o, "QR kod hazır: aşağıdaki ekranı telefonunuzdan WhatsApp > Bağlı cihazlar ile okutun.");
      uyarildi = true;
    }
    await bekle(1500);
  }
  throw new Error("WhatsApp Web girişi zaman aşımına uğradı.");
}

/* -------------------------------------------------------------- sohbet */

async function onizlemeyiKapat(p: Page) {
  await p.keyboard.press("Escape").catch(() => {});
  const yoksay = p.getByRole("button", { name: /Yok say|Discard/i }).first();
  if (await yoksay.isVisible().catch(() => false)) await yoksay.click().catch(() => {});
  await bekle(300);
}

/** Arama kutusuna numarayi yazip ilk sonucu acar. */
async function araVeAc(p: Page, terim: string): Promise<boolean> {
  const kutu = p.locator(ARAMA).first();
  await kutu.waitFor({ state: "visible", timeout: 20_000 });
  await onizlemeyiKapat(p);
  await kutu.click();
  await p.keyboard.press(process.platform === "darwin" ? "Meta+A" : "Control+A");
  await p.keyboard.press("Backspace");
  await p.keyboard.insertText(terim);
  await bekle(1800);
  await p.keyboard.press("Enter");
  const basla = Date.now();
  while (Date.now() - basla < 8000) {
    if (await p.locator(YAZMA_KUTUSU).first().isVisible().catch(() => false)) return true;
    await bekle(400);
  }
  return false;
}

/**
 * Sohbeti YALNIZCA TELEFONLA acar.
 *
 * Ada gore aramak bilerek yapilmiyor: "Ahmet" diye arayinca rehberdeki
 * baska bir Ahmet'e davetiye gidebilir. Yanlis kisiye nisan daveti
 * gondermek geri alinamaz.
 */
async function sohbetAc(p: Page, telefon: string): Promise<boolean> {
  const rakam = telefonNormalize(telefon);
  if (!rakam) return false;
  for (const bicim of [...new Set(["+" + rakam, rakam.replace(/^90/, "")])]) {
    if (await araVeAc(p, bicim)) return true;
  }
  return false;
}

async function satirSatirYaz(p: Page, yazi: string) {
  const satirlar = yazi.split("\n");
  for (let i = 0; i < satirlar.length; i++) {
    if (satirlar[i]) await p.keyboard.insertText(satirlar[i]);
    if (i < satirlar.length - 1) await p.keyboard.press("Shift+Enter");
  }
}

/** Videoyu gizli dosya girdisine verir, onizleme acilir. */
/** Sohbette hangi dosya girdileri var — gunluge yazmak icin. */
async function girdiDokumu(p: Page): Promise<string> {
  return p
    .evaluate(() => {
      const g = [...document.querySelectorAll('input[type="file"]')].map(
        (e) => (e as HTMLInputElement).accept || "(accept yok)",
      );
      const a = [...document.querySelectorAll("[data-icon]")]
        .map((e) => e.getAttribute("data-icon"))
        .filter((x) => x && /plus|clip|attach|paperclip/i.test(x));
      return `dosya girdisi: ${g.length ? g.join(" | ") : "YOK"} · ataç ikonu: ${a.join(",") || "YOK"}`;
    })
    .catch(() => "(dökum alınamadı)");
}

/** Ataç (+) menusunu acar — dosya girdileri cogu surumde ancak bundan sonra olusuyor. */
async function atacMenusunuAc(p: Page): Promise<boolean> {
  const adaylar = [
    '[data-icon="plus-rounded"]',
    '[data-icon="attach-menu-plus"]',
    '[data-icon="plus"]',
    '[data-icon="clip"]',
    '[data-icon="paperclip"]',
    'button[aria-label="Ekle"]',
    'button[aria-label="Attach"]',
    'div[role="button"][aria-label="Ekle"]',
    'div[role="button"][aria-label="Attach"]',
    'button[title="Ekle"]',
    'button[title="Attach"]',
  ];
  for (const sec of adaylar) {
    const d = p.locator(sec).first();
    if (!(await d.count().catch(() => 0))) continue;
    try {
      await d.click({ timeout: 5000 });
      await bekle(900);
      return true;
    } catch { /* sonraki aday */ }
  }
  return false;
}

/** Ortam kabul eden gizli girdiye dosyayi verir; onizleme acilirsa true. */
async function girdiyeVer(p: Page, yol: string): Promise<boolean> {
  for (const sec of [
    'input[type="file"][accept*="video"]',
    'input[type="file"][accept*="image"]',
    'input[type="file"]',
  ]) {
    const girdi = p.locator(sec).first();
    if (!(await girdi.count().catch(() => 0))) continue;
    try {
      await girdi.setInputFiles(yol, { timeout: 20_000 });
      if (await onizlemeBekle(p)) return true;
    } catch { /* sonraki aday */ }
  }
  return false;
}

/**
 * Videoyu sohbete ekler ve ONIZLEMENIN ACILDIGINI DOGRULAR.
 *
 * Dogrulama sart: eskiden yalnizca "bir gonder dugmesi gorundu mu" diye
 * bakiliyordu. Turkce arayuzde MIKROFON dugmesi de o seciciye uyuyordu,
 * video hic eklenmeden basarili sayilip mesaj metin olarak gidiyordu.
 *
 * UC YOL sirayla denenir, cunku WhatsApp Web surumleri farkli davraniyor:
 *   1) Dogrudan gizli dosya girdisi
 *   2) Atac (+) menusunu acip girdiyi ortaya cikarmak — cogu surumde
 *      girdi menu acilmadan DOM'da YOK, birinci yol bu yuzden bos donuyor
 *   3) Yapistirma olayi (kardes proje "Paylasim"da calisan yontem)
 *
 * Hicbiri tutmazsa HATA verilir. Videosuz sessizce gondermektense o
 * kisiyi atlamak yeg — sessiz gonderim zaten bir kez yasandi.
 */
async function videoEkle(o: Oturum, p: Page, yol: string) {
  // 1) Dogrudan girdi
  if (await girdiyeVer(p, yol)) return;

  // 2) Atac menusu
  yaz(o, "Dosya girdisi bulunamadı — ataç (+) menüsü açılıyor. " + (await girdiDokumu(p)));
  if (await atacMenusunuAc(p)) {
    if (await girdiyeVer(p, yol)) {
      yaz(o, "Video ataç menüsünden eklendi.");
      return;
    }
  } else {
    yaz(o, "Ataç (+) düğmesi bulunamadı.");
  }

  // 3) Yapistirma
  yaz(o, "Yapıştırma yöntemi deneniyor… " + (await girdiDokumu(p)));
  const veri = await fs.promises.readFile(yol);
  await p.locator(YAZMA_KUTUSU).first().click().catch(() => {});
  await p.evaluate(
    async ({ b64, ad }) => {
      const ikili = atob(b64);
      const dizi = new Uint8Array(ikili.length);
      for (let i = 0; i < ikili.length; i++) dizi[i] = ikili.charCodeAt(i);
      const dosya = new File([dizi], ad, { type: "video/mp4" });
      const dt = new DataTransfer();
      dt.items.add(dosya);
      const hedef =
        document.querySelector('footer div[contenteditable="true"]') ?? document.body;
      hedef.dispatchEvent(
        new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true }),
      );
    },
    { b64: veri.toString("base64"), ad: path.basename(yol) },
  );
  if (await onizlemeBekle(p)) {
    yaz(o, "Video yapıştırma ile eklendi.");
    return;
  }

  throw new Error(
    "Video önizlemesi açılmadı (üç yöntem de denendi) — videosuz göndermemek için atlandı. " +
      (await girdiDokumu(p)),
  );
}

async function gonderTikla(p: Page) {
  const d = p.locator(GONDER_DUGMESI).first();
  try { await d.click({ timeout: 6000 }); }
  catch { await p.keyboard.press("Enter"); }
}

/** Saat ikonu (gonderiliyor) kaybolana kadar bekler — en iyi caba. */
async function teslimBekle(p: Page, enFazlaMs = 120_000) {
  await bekle(1200);
  const basla = Date.now();
  while (Date.now() - basla < enFazlaMs) {
    const bekleyen = await p.locator('span[data-icon="msg-time"]').count().catch(() => 0);
    if (!bekleyen) return;
    await bekle(700);
  }
}

/* --------------------------------------------------------------- disari */

export async function baglan(taraf: DavetliTaraf): Promise<void> {
  const o = oturum(taraf);
  o.baglaniyor = true;
  try {
    const p = await tarayiciHazirla(o);
    yaz(o, `Tarayıcı açıldı (${TARAF_ETIKET[taraf]}), WhatsApp Web yükleniyor…`);
    await girisBekle(o, p);
    yaz(o, "WhatsApp Web bağlı.");
  } finally {
    o.baglaniyor = false;
  }
}

export async function durum(taraf: DavetliTaraf): Promise<WaDurum> {
  const o = oturum(taraf);
  if (!o.page || o.page.isClosed()) return (o.sonDurum = o.baglaniyor ? "baglaniyor" : "kapali");
  try {
    const d = await Promise.race<WaDurum>([
      o.page.evaluate(() => {
        if (document.querySelector('#pane-side, [data-icon="new-chat-outline"], [aria-label="Chat list"]')) return "bagli";
        if (document.querySelector("canvas, [data-ref]")) return "qr";
        return "baglaniyor";
      }) as Promise<WaDurum>,
      new Promise<WaDurum>((r) => setTimeout(() => r(o.sonDurum === "bagli" ? "bagli" : "baglaniyor"), 1500)),
    ]);
    return (o.sonDurum = d);
  } catch {
    return o.sonDurum === "bagli" ? "bagli" : "baglaniyor";
  }
}

export async function ekranGoruntusu(taraf: DavetliTaraf): Promise<Buffer | null> {
  const o = oturum(taraf);
  if (!o.page || o.page.isClosed()) return null;
  return o.page.screenshot({ type: "jpeg", quality: 60 }).catch(() => null);
}

export function ilerleme(taraf: DavetliTaraf): Ilerleme {
  const o = oturum(taraf);
  return {
    calisiyor: o.calisiyor,
    durum: o.sonDurum,
    toplam: o.toplamSayi,
    gonderildi: o.gonderilenSayi,
    kalemler: [...o.kalemDurumlari.entries()].map(([id, v]) => ({ id, ...v })),
    gunluk: o.gunluk.slice(-120),
    onayBekleyen: o.onayBekleyen,
    oturumVar: fs.existsSync(path.join(profilYolu(taraf), "Default")),
  };
}

export function durdur(taraf: DavetliTaraf) {
  const o = oturum(taraf);
  o.durdurIstendi = true;
  if (o.onayBekleyen) o.onayCevabi = "dur";
  yaz(o, "Durdurma istendi, sıradaki kişiye geçilmeyecek.");
}

export function onayla(taraf: DavetliTaraf, cevap: "gonder" | "atla" | "dur") {
  const o = oturum(taraf);
  if (o.onayBekleyen) o.onayCevabi = cevap;
}

/** Onay beklerken bu sureden sonra vazgecilir. */
const ONAY_ZAMAN_ASIMI_MS = 30 * 60_000;

/**
 * Kullanicinin "Gonder / Atla / Durdur" karari beklenir.
 *
 * Bekleme GUNLUGE YAZILIR: eskiden hicbir satir dusmuyordu ve gonderim
 * on dakika boyunca sessizce bekleyip "Durduruldu." diyerek bitiyordu —
 * kullanici kendisinden onay beklendigini hic anlamadan.
 */
async function onayBekle(o: Oturum, id: string, ad: string): Promise<"gonder" | "atla" | "dur"> {
  o.onayBekleyen = id;
  o.onayCevabi = null;
  yaz(o, `${ad} için ONAYINIZ BEKLENİYOR — "Gönder", "Atla" ya da "Durdur" seçin.`);
  const basla = Date.now();
  let hatirlatildi = false;
  while (!o.onayCevabi && Date.now() - basla < ONAY_ZAMAN_ASIMI_MS) {
    await bekle(400);
    if (!hatirlatildi && Date.now() - basla > 5 * 60_000) {
      yaz(o, "Hâlâ onay bekleniyor. Yanıt verilmezse 30 dakikada durdurulacak.");
      hatirlatildi = true;
    }
  }
  const zamanAsimi = !o.onayCevabi;
  const c = o.onayCevabi ?? "dur";
  if (zamanAsimi) {
    yaz(o, `ONAY GELMEDİ (${Math.round(ONAY_ZAMAN_ASIMI_MS / 60_000)} dk) — gönderim durduruldu. ` +
           "Onaylı modda her kişi için panelden onay vermeniz gerekiyor.");
  }
  o.onayBekleyen = null;
  o.onayCevabi = null;
  return c;
}

export type GonderSecenek = {
  /** Hangi tarafın numarasından gönderiliyor. */
  taraf: DavetliTaraf;
  /** Tarafı atanmamış davetliler de bu gönderime katılsın mı? */
  belirsizlerDahil: boolean;
  /** "onay": her kişide bekler. "otomatik": aralarda rastgele bekleyip devam eder. */
  mod: "onay" | "otomatik";
  /** Saniye. */
  enAzBekleme: number;
  enCokBekleme: number;
  gunlukSinir: number;
  /** Video da gonderilsin mi? Kapaliysa yalnizca metin gider. */
  videoGonder: boolean;
  /** Yalnizca bu id'ler; bos ise gonderilmemis tum davetliler. */
  idler?: string[];
};

/* Panelde elle basilan "Video ile Paylas" ile AYNI metin gonderilir —
   iki yerde iki farkli metin olursa hangisinin gittigi belirsizlesir. */
function mesajlariHazirla(d: Davetli, slug: string) {
  const gelinAd = metin("gelin_ad") || CFG.GELIN;
  const damatAd = metin("damat_ad") || CFG.DAMAT;
  const url = siteUrl(`/davet/${slug}?g=${d.token}`);
  return {
    url,
    videoMesaj: whatsappVideoMesajiUret({
      gelin: gelinAd, damat: damatAd,
      tarih: TARIH_METNI, saat: SAAT_METNI, salon: CFG.SALON_AD,
      url,
    }),
  };
}

/**
 * Toplu gonderimi baslatir. Zaten calisiyorsa hata verir.
 *
 * GONDERILMIS davetlilere TEKRAR GONDERILMEZ — `gonderildi_mi` isaretli
 * olanlar listeye hic alinmaz. Yanlislikla ikinci kez davet gitmesi,
 * otomatik gonderimde en kolay yapilan ve en utandiran hata.
 */
export async function gonderimBaslat(sec: GonderSecenek): Promise<void> {
  const o = oturum(sec.taraf);
  if (o.calisiyor) throw new Error("Bu taraf için gönderim zaten sürüyor.");

  const slug = metin("davetiye_slug") || DEFAULT_DAVETIYE_SLUG;
  /* TARAF SUZGECI: kiz tarafinin numarasindan erkek tarafinin davetlisine
     mesaj gitmesi, davetlinin tanimadigi bir numaradan davet almasi demek. */
  let hedefler = davetlileriListele().filter(
    (d) =>
      d.gonderildi_mi !== 1 &&
      d.telefon &&
      (d.taraf === sec.taraf || (sec.belirsizlerDahil && !d.taraf)),
  );
  if (sec.idler?.length) {
    const kume = new Set(sec.idler);
    hedefler = hedefler.filter((d) => kume.has(d.id));
  }
  if (!hedefler.length) {
    throw new Error(
      `${TARAF_ETIKET[sec.taraf]} için gönderilecek davetli yok (telefonu olan ve henüz gönderilmemiş).`,
    );
  }

  o.calisiyor = true;
  o.durdurIstendi = false;
  o.gonderilenSayi = 0;
  o.toplamSayi = hedefler.length;
  o.gunluk = [];
  o.kalemDurumlari.clear();
  for (const d of hedefler) o.kalemDurumlari.set(d.id, { ad: d.ad_soyad, durum: "bekliyor" });

  // Arka planda yurur; istemci /ilerleme ucundan izler.
  void (async () => {
    try {
      const p = await tarayiciHazirla(o);
      await girisBekle(o, p);
      yaz(o, `WhatsApp hazır (${TARAF_ETIKET[sec.taraf]}). ${hedefler.length} davetliye gönderilecek.`);

      const videoVar = sec.videoGonder && fs.existsSync(VIDEO_YOLU);
      if (sec.videoGonder && !videoVar) yaz(o, "UYARI: davetiye videosu bulunamadı, yalnızca metin gönderilecek.");

      const basarisiz: Davetli[] = [];
      const kuyruk = [...hedefler];

      for (let i = 0; i < kuyruk.length; i++) {
        const d = kuyruk[i];
        const tekrar = i >= hedefler.length;
        if (o.durdurIstendi) { yaz(o, "Durduruldu."); break; }
        if (o.gonderilenSayi >= sec.gunlukSinir) { yaz(o, "Günlük üst sınıra ulaşıldı."); break; }

        const isaretle = (durum: KalemDurum, mesaj?: string) =>
          o.kalemDurumlari.set(d.id, { ad: d.ad_soyad, durum, mesaj });

        try {
          isaretle("gonderiliyor");
          if (!(await sohbetAc(p, d.telefon!))) {
            isaretle("bulunamadi", "Numara WhatsApp'ta bulunamadı");
            yaz(o, `BULUNAMADI: ${d.ad_soyad} (${d.telefon})`);
            if (!tekrar) basarisiz.push(d);
            continue;
          }

          const { videoMesaj } = mesajlariHazirla(d, slug);

          // Video onizlemesi ONAYDAN ONCE hazirlanir ki kullanici ne
          // gidecegini gorerek onaylasin.
          if (videoVar) {
            await videoEkle(o, p, VIDEO_YOLU);
            yaz(o, `${d.ad_soyad}: video eklendi, önizleme açık.`);
          }
          else { await p.locator(YAZMA_KUTUSU).first().click(); await satirSatirYaz(p, videoMesaj); }

          if (sec.mod === "onay") {
            isaretle("onay-bekliyor");
            const c = await onayBekle(o, d.id, d.ad_soyad);
            if (c === "dur") { isaretle("bekliyor"); yaz(o, "Durduruldu."); break; }
            if (c === "atla") { await onizlemeyiKapat(p); isaretle("atlandi"); yaz(o, `Atlandı: ${d.ad_soyad}`); continue; }
          }

          if (videoVar) {
            await gonderTikla(p);                 // 1) video
            await teslimBekle(p);
            await p.locator(YAZMA_KUTUSU).first().click();
            await satirSatirYaz(p, videoMesaj);   // 2) metin (link önizlemesi burada çıkar)
            await p.keyboard.press("Enter");
          } else {
            await p.keyboard.press("Enter");
          }
          await teslimBekle(p);

          davetliGonderildiGuncelle(d.id, true);  // "Gönderilenler"e taşınır
          isaretle("gonderildi");
          o.gonderilenSayi++;
          yaz(o, `Gönderildi: ${d.ad_soyad} (${o.gonderilenSayi}/${o.toplamSayi})`);

          if (sec.mod !== "onay" && i < kuyruk.length - 1) {
            const s = rastgele(sec.enAzBekleme * 1000, sec.enCokBekleme * 1000);
            yaz(o, `Sonraki kişi için ${Math.round(s / 1000)} sn bekleniyor…`);
            await bekle(s);
          }
        } catch (e) {
          const m = String(e instanceof Error ? e.message : e).split("\n")[0];
          isaretle("hata", m);
          yaz(o, `HATA (${d.ad_soyad}): ${m}`);
          if (!tekrar) basarisiz.push(d);
        }

        // Ilk tur bitti: basarisizlari bir kez daha dene, kimse sessizce atlanmasin
        if (i === hedefler.length - 1 && basarisiz.length && !o.durdurIstendi) {
          yaz(o, `${basarisiz.length} kişi ilk turda gönderilemedi, tekrar denenecek.`);
          kuyruk.push(...basarisiz);
        }
      }

      const kalan = [...o.kalemDurumlari.values()].filter((k) => k.durum !== "gonderildi" && k.durum !== "atlandi");
      if (kalan.length) yaz(o, "GÖNDERİLEMEYENLER: " + kalan.map((k) => k.ad).join(", "));
      yaz(o, `Bitti. ${o.gonderilenSayi} gönderim yapıldı.`);
    } catch (e) {
      yaz(o, "GÖNDERİM DURDU: " + String(e instanceof Error ? e.message : e).split("\n")[0]);
    } finally {
      o.calisiyor = false;
      o.onayBekleyen = null;
    }
  })();
}

/** Tarayiciyi kapatir; oturum (profil) KALIR, tekrar QR istemez. */
export async function kapat(taraf: DavetliTaraf) {
  const o = oturum(taraf);
  if (o.context) await o.context.close().catch(() => {});
  o.context = null;
  o.page = null;
  o.sonDurum = "kapali";
}

/**
 * WhatsApp OTURUMUNU KAPATIR: tarayiciyi kapatir ve kalici profili siler.
 *
 * Boylece bir sonraki baglanmada QR yeniden istenir ve BASKA BIR NUMARA
 * baglanabilir. Geri alinamaz — bu yuzden arayuzde onay isteniyor.
 * Gonderim surerken calismaz: ortasinda profili silmek tarayiciyi
 * yarim birakirdi.
 */
export async function cikisYap(taraf: DavetliTaraf): Promise<void> {
  const o = oturum(taraf);
  if (o.calisiyor) throw new Error("Gönderim sürerken çıkış yapılamaz. Önce durdurun.");
  await kapat(taraf);
  const profil = profilYolu(taraf);
  await fs.promises.rm(profil, { recursive: true, force: true }).catch(() => {});
  o.kalemDurumlari.clear();
  o.gunluk = [];
  o.gonderilenSayi = 0;
  o.toplamSayi = 0;
  yaz(o, "Oturum kapatıldı. Yeniden bağlanırken QR istenecek, farklı bir numara bağlayabilirsiniz.");
}

export function oturumVarMi(taraf: DavetliTaraf): boolean {
  return fs.existsSync(path.join(profilYolu(taraf), "Default"));
}

export { PROFIL_KOK };
export type { Browser };
