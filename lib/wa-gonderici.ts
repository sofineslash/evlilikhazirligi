/**
 * WhatsApp Web toplu gonderici (Playwright).
 *
 * API YOK — WhatsApp Web tarayicida acilir, QR bir kez okutulur, oturum
 * kalici profilde saklanir. Kardes proje "Paylasim"daki yaklasimin ayni.
 *
 * TEK ORNEK: tarayici modul duzeyinde tutulur. Next.js'te her istek ayri
 * bir fonksiyon cagrisi; her seferinde yeni tarayici acilsaydi QR her
 * istekte yeniden istenirdi.
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
import { davetlileriListele, davetliGonderildiGuncelle, type Davetli } from "./davetliler";

/* Oturum profili VERI biriminde durur — konteyner yeniden kurulunca
   QR'in tekrar istenmemesi icin kalici bir birim sart. */
const PROFIL_KLASORU =
  process.env.WA_PROFIL ||
  path.join(path.dirname(process.env.DB_PATH || path.join(process.cwd(), "data", "nisan.db")), "wa-profil");

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
};

const bekle = (ms: number) => new Promise((r) => setTimeout(r, ms));
const rastgele = (a: number, b: number) => Math.floor(a + Math.random() * (b - a));

/* ---------------------------------------------------------------- durum */

let context: BrowserContext | null = null;
let page: Page | null = null;
let baglaniyor = false;
let sonDurum: WaDurum = "kapali";

let calisiyor = false;
let durdurIstendi = false;
let onayBekleyen: string | null = null;
let onayCevabi: "gonder" | "atla" | "dur" | null = null;
const kalemDurumlari = new Map<string, { ad: string; durum: KalemDurum; mesaj?: string }>();
let gunluk: string[] = [];
let gonderilenSayi = 0;
let toplamSayi = 0;

function yaz(s: string) {
  const t = new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  gunluk.push(`${t}  ${s}`);
  if (gunluk.length > 300) gunluk = gunluk.slice(-300);
}

/* ------------------------------------------------------------- tarayici */

async function tarayiciHazirla(): Promise<Page> {
  if (context && page && !page.isClosed()) return page;
  const { chromium } = await import("playwright");
  fs.mkdirSync(PROFIL_KLASORU, { recursive: true });
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
    context = await chromium.launchPersistentContext(PROFIL_KLASORU, secenek([]));
  } catch (e) {
    /* Bazi sunucularda kullanici ad alani (user namespace) kapali olur ve
       Chromium'un kendi kum havuzu acilmaz. Varsayilan olarak kum havuzunu
       KAPATMIYORUZ; yalnizca acilmadiginda, gorunur bir not birakarak
       ikinci kez deniyoruz. Sessizce --no-sandbox ile baslamak guvenligi
       farkinda olmadan dusururdu. */
    yaz("Tarayıcı kum havuzuyla açılamadı, --no-sandbox ile tekrar deneniyor: " +
        String(e instanceof Error ? e.message : e).split("\n")[0]);
    context = await chromium.launchPersistentContext(PROFIL_KLASORU, secenek(["--no-sandbox"]));
  }
  page = context.pages()[0] || (await context.newPage());
  context.on("close", () => { context = null; page = null; sonDurum = "kapali"; });
  return page;
}

const SOHBET_LISTESI = '#pane-side, [data-icon="new-chat-outline"], [aria-label="Chat list"]';
const QR = "canvas, [data-ref]";
const YAZMA_KUTUSU = 'footer div[contenteditable="true"]';
const GONDER_DUGMESI =
  '[data-icon*="send"], [aria-label="Send"], [aria-label="Gönder"], button[aria-label*="önder"], button[aria-label*="end"]';
const ARAMA = '#side div[contenteditable="true"], [aria-label="Search input textbox"], [data-tab="3"]';

async function girisBekle(p: Page, zamanAsimi = 300_000): Promise<void> {
  await p.goto("https://web.whatsapp.com/", { waitUntil: "domcontentloaded" });
  const basla = Date.now();
  let uyarildi = false;
  while (Date.now() - basla < zamanAsimi) {
    if (await p.locator(SOHBET_LISTESI).first().isVisible().catch(() => false)) return;
    if (!uyarildi && (await p.locator(QR).first().isVisible().catch(() => false))) {
      yaz("QR kod hazır: aşağıdaki ekranı telefonunuzdan WhatsApp > Bağlı cihazlar ile okutun.");
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
async function videoEkle(p: Page, yol: string) {
  const girdi = p
    .locator('input[type="file"][accept*="video"], input[type="file"][accept*="image"], input[type="file"]')
    .first();
  await girdi.waitFor({ state: "attached", timeout: 15_000 });
  await girdi.setInputFiles(yol);
  await p.locator(GONDER_DUGMESI).first().waitFor({ state: "visible", timeout: 60_000 });
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

export async function baglan(): Promise<void> {
  baglaniyor = true;
  try {
    const p = await tarayiciHazirla();
    yaz("Tarayıcı açıldı, WhatsApp Web yükleniyor…");
    await girisBekle(p);
    yaz("WhatsApp Web bağlı.");
  } finally {
    baglaniyor = false;
  }
}

export async function durum(): Promise<WaDurum> {
  if (!page || page.isClosed()) return (sonDurum = baglaniyor ? "baglaniyor" : "kapali");
  try {
    const d = await Promise.race<WaDurum>([
      page.evaluate(() => {
        if (document.querySelector('#pane-side, [data-icon="new-chat-outline"], [aria-label="Chat list"]')) return "bagli";
        if (document.querySelector("canvas, [data-ref]")) return "qr";
        return "baglaniyor";
      }) as Promise<WaDurum>,
      new Promise<WaDurum>((r) => setTimeout(() => r(sonDurum === "bagli" ? "bagli" : "baglaniyor"), 1500)),
    ]);
    return (sonDurum = d);
  } catch {
    return sonDurum === "bagli" ? "bagli" : "baglaniyor";
  }
}

export async function ekranGoruntusu(): Promise<Buffer | null> {
  if (!page || page.isClosed()) return null;
  return page.screenshot({ type: "jpeg", quality: 60 }).catch(() => null);
}

export function ilerleme(): Ilerleme {
  return {
    calisiyor,
    durum: sonDurum,
    toplam: toplamSayi,
    gonderildi: gonderilenSayi,
    kalemler: [...kalemDurumlari.entries()].map(([id, v]) => ({ id, ...v })),
    gunluk: gunluk.slice(-120),
    onayBekleyen,
  };
}

export function durdur() {
  durdurIstendi = true;
  if (onayBekleyen) onayCevabi = "dur";
  yaz("Durdurma istendi, sıradaki kişiye geçilmeyecek.");
}

export function onayla(cevap: "gonder" | "atla" | "dur") {
  if (onayBekleyen) onayCevabi = cevap;
}

async function onayBekle(id: string): Promise<"gonder" | "atla" | "dur"> {
  onayBekleyen = id;
  onayCevabi = null;
  const basla = Date.now();
  while (!onayCevabi && Date.now() - basla < 10 * 60_000) await bekle(400);
  const c = onayCevabi ?? "dur";
  onayBekleyen = null;
  onayCevabi = null;
  return c;
}

export type GonderSecenek = {
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
  if (calisiyor) throw new Error("Gönderim zaten sürüyor.");

  const slug = metin("davetiye_slug") || DEFAULT_DAVETIYE_SLUG;
  let hedefler = davetlileriListele().filter((d) => d.gonderildi_mi !== 1 && d.telefon);
  if (sec.idler?.length) {
    const kume = new Set(sec.idler);
    hedefler = hedefler.filter((d) => kume.has(d.id));
  }
  if (!hedefler.length) throw new Error("Gönderilecek davetli yok (telefonu olan ve henüz gönderilmemiş).");

  calisiyor = true;
  durdurIstendi = false;
  gonderilenSayi = 0;
  toplamSayi = hedefler.length;
  gunluk = [];
  kalemDurumlari.clear();
  for (const d of hedefler) kalemDurumlari.set(d.id, { ad: d.ad_soyad, durum: "bekliyor" });

  // Arka planda yurur; istemci /ilerleme ucundan izler.
  void (async () => {
    try {
      const p = await tarayiciHazirla();
      await girisBekle(p);
      yaz(`WhatsApp hazır. ${hedefler.length} davetliye gönderilecek.`);

      const videoVar = sec.videoGonder && fs.existsSync(VIDEO_YOLU);
      if (sec.videoGonder && !videoVar) yaz("UYARI: davetiye videosu bulunamadı, yalnızca metin gönderilecek.");

      const basarisiz: Davetli[] = [];
      const kuyruk = [...hedefler];

      for (let i = 0; i < kuyruk.length; i++) {
        const d = kuyruk[i];
        const tekrar = i >= hedefler.length;
        if (durdurIstendi) { yaz("Durduruldu."); break; }
        if (gonderilenSayi >= sec.gunlukSinir) { yaz("Günlük üst sınıra ulaşıldı."); break; }

        const isaretle = (durum: KalemDurum, mesaj?: string) =>
          kalemDurumlari.set(d.id, { ad: d.ad_soyad, durum, mesaj });

        try {
          isaretle("gonderiliyor");
          if (!(await sohbetAc(p, d.telefon!))) {
            isaretle("bulunamadi", "Numara WhatsApp'ta bulunamadı");
            yaz(`BULUNAMADI: ${d.ad_soyad} (${d.telefon})`);
            if (!tekrar) basarisiz.push(d);
            continue;
          }

          const { videoMesaj } = mesajlariHazirla(d, slug);

          // Video onizlemesi ONAYDAN ONCE hazirlanir ki kullanici ne
          // gidecegini gorerek onaylasin.
          if (videoVar) await videoEkle(p, VIDEO_YOLU);
          else { await p.locator(YAZMA_KUTUSU).first().click(); await satirSatirYaz(p, videoMesaj); }

          if (sec.mod === "onay") {
            isaretle("onay-bekliyor");
            const c = await onayBekle(d.id);
            if (c === "dur") { isaretle("bekliyor"); yaz("Durduruldu."); break; }
            if (c === "atla") { await onizlemeyiKapat(p); isaretle("atlandi"); yaz(`Atlandı: ${d.ad_soyad}`); continue; }
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
          gonderilenSayi++;
          yaz(`Gönderildi: ${d.ad_soyad} (${gonderilenSayi}/${toplamSayi})`);

          if (sec.mod !== "onay" && i < kuyruk.length - 1) {
            const s = rastgele(sec.enAzBekleme * 1000, sec.enCokBekleme * 1000);
            yaz(`Sonraki kişi için ${Math.round(s / 1000)} sn bekleniyor…`);
            await bekle(s);
          }
        } catch (e) {
          const m = String(e instanceof Error ? e.message : e).split("\n")[0];
          isaretle("hata", m);
          yaz(`HATA (${d.ad_soyad}): ${m}`);
          if (!tekrar) basarisiz.push(d);
        }

        // Ilk tur bitti: basarisizlari bir kez daha dene, kimse sessizce atlanmasin
        if (i === hedefler.length - 1 && basarisiz.length && !durdurIstendi) {
          yaz(`${basarisiz.length} kişi ilk turda gönderilemedi, tekrar denenecek.`);
          kuyruk.push(...basarisiz);
        }
      }

      const kalan = [...kalemDurumlari.values()].filter((k) => k.durum !== "gonderildi" && k.durum !== "atlandi");
      if (kalan.length) yaz("GÖNDERİLEMEYENLER: " + kalan.map((k) => k.ad).join(", "));
      yaz(`Bitti. ${gonderilenSayi} gönderim yapıldı.`);
    } catch (e) {
      yaz("GÖNDERİM DURDU: " + String(e instanceof Error ? e.message : e).split("\n")[0]);
    } finally {
      calisiyor = false;
      onayBekleyen = null;
    }
  })();
}

export async function kapat() {
  if (context) await context.close().catch(() => {});
  context = null;
  page = null;
  sonDurum = "kapali";
}

export function oturumVarMi(): boolean {
  return fs.existsSync(path.join(PROFIL_KLASORU, "Default"));
}

export { PROFIL_KLASORU };
export type { Browser };
