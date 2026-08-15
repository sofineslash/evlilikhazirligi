import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import ffmpegYolu from "ffmpeg-static";
import ffprobeStatic from "ffprobe-static";
import { CFG } from "./config";

const calistir = promisify(execFile);

/**
 * Video isleme.
 *
 * Neden ffmpeg-static: sistem ffmpeg'ine bagli kalmiyoruz. Ayni ikili
 * hem gelistirmede hem Docker'da; surum farkindan dogan "benim makinemde
 * calisiyordu" durumu olmuyor ve imaja apt-get ile ~250 MB kodek yigini
 * eklemek gerekmiyor.
 *
 * Ortam degiskeniyle sistem ikilisine gecilebilir (FFMPEG_YOLU/FFPROBE_YOLU) —
 * donanim hizlandirmasi gereken bir sunucuda ise yarar.
 */
const FFMPEG = process.env.FFMPEG_YOLU || (ffmpegYolu as unknown as string);
const FFPROBE = process.env.FFPROBE_YOLU || ffprobeStatic.path;

/**
 * "1080p" KISA kenarin 1080 olmasi demektir, uzun kenarin degil:
 *   yatay 3840x2160 -> 1920x1080
 *   dikey 2160x3840 -> 1080x1920
 * Uzun kenari 1080'e sabitleseydik yatay video 1080x608 olurdu — yani
 * 1080p degil, ondan cok daha dusuk. (Ilk denemede oyle cikti, olculdu.)
 */
const KISA_KENAR = 1080;

export type VideoBilgi = {
  sure: number;
  genislik: number;
  yukseklik: number;
};

export type VideoSonuc =
  | {
      ok: true;
      tur: "video";
      veri: Buffer;
      kapak: Buffer;
      bayt: number;
      oncekiBayt: number;
      genislik: number;
      yukseklik: number;
      sure: number;
    }
  | { ok: false; mesaj: string };

/** ffprobe ile sure/olcu okur. Cozulemeyen dosya video degildir. */
export async function videoBilgi(yol: string): Promise<VideoBilgi | null> {
  try {
    /* `stream_side_data` ISTEME — ffprobe 4.4'te boyle bir bolum YOK ve
       komutun TAMAMI reddediliyor ("No match for section"), yani her video
       "acilamadi" hatasi aliyordu. Donme bilgisine zaten ihtiyac yok:
       ffmpeg -autorotate varsayilan olarak acik ve donmeyi transcode
       sirasinda kendisi uyguluyor. */
    const { stdout } = await calistir(FFPROBE, [
      "-v", "error",
      "-select_streams", "v:0",
      "-show_entries", "stream=width,height:format=duration",
      "-of", "json",
      yol,
    ], { maxBuffer: 4 * 1024 * 1024 });

    const j = JSON.parse(stdout);
    const s = j.streams?.[0];
    if (!s?.width || !s?.height) return null;

    return {
      sure: Number(j.format?.duration ?? 0),
      genislik: s.width,
      yukseklik: s.height,
    };
  } catch (e) {
    // Sessiz yutma HATA GIZLIYOR: "video acilamadi" mesaji her sebebi
    // ayni gosteriyordu. Sebep loga yazilsin.
    console.error("videoBilgi hatasi", { FFPROBE, hata: (e as Error).message });
    return null;
  }
}

/**
 * Videoyu 1080p'ye indirir ve bir kapak karesi cikarir.
 *
 * scale filtresi KISA kenari 1080'e sabitler, uzun kenari orana gore
 * hesaplar ve 2'ye bolunebilir yapar (-2). H.264 tek sayili boyut kabul
 * etmiyor; -2 olmadan dikey videolarin yarisi hata veriyor.
 * `min(1080, ...)` kalibi: zaten kucuk olan video BUYUTULMEZ.
 */
export async function videoIsle(ham: Buffer): Promise<VideoSonuc> {
  const gecici = path.join(os.tmpdir(), `nisan-${crypto.randomUUID()}`);
  const girdi = `${gecici}-girdi`;
  const cikti = `${gecici}-cikti.mp4`;
  const kapakYol = `${gecici}-kapak.jpg`;

  try {
    await fsp.writeFile(girdi, new Uint8Array(ham));

    const bilgi = await videoBilgi(girdi);
    if (!bilgi) return { ok: false, mesaj: "Bu video açılamadı. Başka bir dosya deneyin." };

    if (bilgi.sure > CFG.VIDEO_MAX_SANIYE) {
      return {
        ok: false,
        mesaj: `Video çok uzun (${Math.round(bilgi.sure)} sn). En fazla ${CFG.VIDEO_MAX_SANIYE} saniye.`,
      };
    }

    await calistir(FFMPEG, [
      "-y", "-i", girdi,
      // Yatay: yukseklik 1080'e sabit, genislik orana gore (-2).
      // Dikey : genislik 1080'e sabit, yukseklik orana gore.
      "-vf", `scale='if(gt(iw,ih),-2,min(${KISA_KENAR},iw))':'if(gt(iw,ih),min(${KISA_KENAR},ih),-2)',format=yuv420p`,
      "-c:v", "libx264",
      "-preset", "veryfast",
      "-crf", "24",                 // gorsel olarak kayipsiza yakin, dosya kucuk
      "-movflags", "+faststart",    // tarayici indirmeden oynatmaya baslasin
      "-c:a", "aac", "-b:a", "128k",
      "-map_metadata", "-1",        // GPS ve cihaz bilgisi dusurulur
      cikti,
    ], { maxBuffer: 8 * 1024 * 1024, timeout: 10 * 60_000 });

    // Kapak karesi: 1. saniye (0. kare cogu videoda siyah geliyor)
    await calistir(FFMPEG, [
      "-y", "-ss", bilgi.sure > 1.5 ? "1" : "0", "-i", cikti,
      "-frames:v", "1",
      "-vf", `scale='if(gt(iw,ih),min(720,iw),-2)':'if(gt(iw,ih),-2,min(720,ih))'`,
      "-q:v", "4",
      kapakYol,
    ], { maxBuffer: 4 * 1024 * 1024, timeout: 60_000 });

    const veri = await fsp.readFile(cikti);
    const kapak = await fsp.readFile(kapakYol);
    const son = await videoBilgi(cikti);

    return {
      ok: true,
      tur: "video",
      veri,
      kapak,
      bayt: veri.length,
      oncekiBayt: ham.length,
      genislik: son?.genislik ?? 0,
      yukseklik: son?.yukseklik ?? 0,
      sure: Math.round(son?.sure ?? bilgi.sure),
    };
  } catch (e) {
    console.error("video isleme hatasi", e);
    return { ok: false, mesaj: "Video işlenemedi. Başka bir dosya deneyin." };
  } finally {
    // Gecici dosyalar HER durumda silinsin — hata yolunda birakirsak
    // /tmp yavas yavas doluyor ve sunucu bir gun yaziyamaz hale geliyor.
    for (const f of [girdi, cikti, kapakYol]) {
      await fsp.rm(f, { force: true }).catch(() => {});
    }
  }
}
