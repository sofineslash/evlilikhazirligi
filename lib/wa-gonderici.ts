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
const GONDER_DUGMESI =
  '[data-icon*="send"], [aria-label="Send"], [aria-label="Gönder"], button[aria-label*="önder"], button[aria-label*="end"]';
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

async function onayBekle(o: Oturum, id: string): Promise<"gonder" | "atla" | "dur"> {
  o.onayBekleyen = id;
  o.onayCevabi = null;
  const basla = Date.now();
  while (!o.onayCevabi && Date.now() - basla < 10 * 60_000) await bekle(400);
  const c = o.onayCevabi ?? "dur";
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
          if (videoVar) await videoEkle(p, VIDEO_YOLU);
          else { await p.locator(YAZMA_KUTUSU).first().click(); await satirSatirYaz(p, videoMesaj); }

          if (sec.mod === "onay") {
            isaretle("onay-bekliyor");
            const c = await onayBekle(o, d.id);
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
