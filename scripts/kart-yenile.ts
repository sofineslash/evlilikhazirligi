/**
 * Davetiye kartini ve tanitim videosunu YENIDEN URETIR.
 *
 * Neden ayri bir komut: video, canlida kod calistirilarak uretilmiyor.
 * Depoda duran iki hazir dosyadan geliyor —
 *   public/tema3/davetiye-kart-uzun.png   (kartin gorseli)
 *   public/davetiye-video.mp4             (servis edilen video)
 * Kart tasariminda bir sey degisirse (isim, renk, tarih, metin) site
 * aninda guncellenir ama VIDEO eski karti gostermeye devam eder. Bu
 * sessiz ayrisma bir kez yasandi: soyadi renkleri sitede duzeldi, videoda
 * duzelmedi.
 *
 * Kullanim:  npm run kart:yenile
 *
 * Calisan bir sunucu varsa onu kullanir, yoksa kendisi bir tane kaldirip
 * isi bitince kapatir.
 */
import { spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  davetiyeVideosuUret,
  tarayiciBul,
  VARSAYILAN_VIDEO_YOLU,
} from "../lib/video-uretici";

const PORT = 2608;
const KART_YOLU = path.join(process.cwd(), "public/tema3/davetiye-kart-uzun.png");
const ADRES = `http://127.0.0.1:${PORT}/video-karti`;

const ozet = (yol: string): string =>
  fs.existsSync(yol)
    ? crypto.createHash("sha256").update(fs.readFileSync(yol)).digest("hex").slice(0, 12)
    : "(yok)";

const mb = (yol: string) => (fs.statSync(yol).size / 1024 / 1024).toFixed(2) + " MB";

async function ayaktaMi(): Promise<boolean> {
  try {
    const c = await fetch(ADRES, { signal: AbortSignal.timeout(2000) });
    return c.ok;
  } catch {
    return false;
  }
}

async function bekle(saniye: number): Promise<boolean> {
  for (let i = 0; i < saniye; i++) {
    if (await ayaktaMi()) return true;
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

async function main() {
  /* Tarayici kontrolu EN BASTA: yoksa uretici yalnizca uyari basip eski
     kartla video kuruyor. Sunucuyu bosuna ayaga kaldirmadan duralim. */
  const tarayici = tarayiciBul();
  if (!tarayici) {
    throw new Error(
      "Kart görselini yakalayacak tarayıcı bulunamadı (Chrome ya da Chromium).\n" +
        "  Bu komut bir tarayıcı gerektiriyor; sunucuda çalıştırılamaz, yerelde çalıştırın.",
    );
  }
  console.log(`• Tarayıcı: ${tarayici}`);

  let sunucu: ReturnType<typeof spawn> | null = null;

  if (await ayaktaMi()) {
    console.log(`• Çalışan sunucu kullanılıyor (${ADRES})`);
  } else {
    console.log("• Sunucu ayakta değil, geçici olarak başlatılıyor…");
    sunucu = spawn("npm", ["run", "dev"], { stdio: "ignore", detached: false });
    if (!(await bekle(90))) {
      sunucu.kill();
      throw new Error(`Sunucu 90 saniyede ayağa kalkmadı (${ADRES}).`);
    }
    console.log("• Sunucu hazır");
  }

  try {
    const kartOnce = ozet(KART_YOLU);

    console.log("• Kart görseli ve video üretiliyor…");
    const sonuc = await davetiyeVideosuUret({ guncelle: true });
    if (!sonuc.ok) throw new Error(`Video üretilemedi: ${sonuc.hata ?? "bilinmeyen hata"}`);

    const kartSonra = ozet(KART_YOLU);
    const degisti = kartOnce !== kartSonra;

    console.log("\n✓ Bitti");
    console.log(
      `  kart : public/tema3/davetiye-kart-uzun.png  (${mb(KART_YOLU)})  ` +
        (degisti ? `${kartOnce} → ${kartSonra}` : `${kartSonra} — zaten güncel`),
    );
    console.log(`  video: ${VARSAYILAN_VIDEO_YOLU}  (${mb(path.join(process.cwd(), VARSAYILAN_VIDEO_YOLU))})`);

    if (degisti) {
      console.log("\n  İkisi de depoya işlenmeli, yoksa canlıda eski kart görünmeye devam eder:");
      console.log("  git add public/tema3/davetiye-kart-uzun.png public/davetiye-video.mp4");
    } else {
      console.log("\n  Kartta değişiklik yok; işlenecek bir şey de yok.");
    }
  } finally {
    if (sunucu) {
      console.log("• Geçici sunucu kapatılıyor");
      sunucu.kill("SIGTERM");
    }
  }
}

main().catch((e) => {
  console.error("\n✕ " + (e instanceof Error ? e.message : String(e)));
  process.exit(1);
});
