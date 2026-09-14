import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import ffmpegPath from "ffmpeg-static";

const execAsync = promisify(exec);

export const VARSAYILAN_VIDEO_YOLU = "public/davetiye-video.mp4";
export const VARSAYILAN_VIDEO_URL = "/davetiye-video.mp4";

/**
 * Davetiye tanıtım videosunun hazır olup olmadığını kontrol eder.
 */
export function davetiyeVideosuVarMi(videoYolu = VARSAYILAN_VIDEO_YOLU): {
  varMi: boolean;
  url: string;
  boyutBytes: number;
  sonGuncellemeMs: number;
} {
  const tamYol = path.join(process.cwd(), videoYolu);
  if (fs.existsSync(tamYol)) {
    const stat = fs.statSync(tamYol);
    if (stat.size > 1000) {
      return {
        varMi: true,
        url: VARSAYILAN_VIDEO_URL,
        boyutBytes: stat.size,
        sonGuncellemeMs: stat.mtimeMs,
      };
    }
  }
  return {
    varMi: false,
    url: VARSAYILAN_VIDEO_URL,
    boyutBytes: 0,
    sonGuncellemeMs: 0,
  };
}

/**
 * FFmpeg ve yerel varlıkları kullanarak 720x1280 dikey MP4 videosu üretir:
 * 1. 0s - 2s: Sabit zarf kapağı (dokunun yazısız)
 * 2. 2s - 6.8s: Mühür açılış videosu
 * 3. 6.8s - 15s: Davetiye sayfasının akıcı aşağı kayışı
 * 4. Fon müziği miksi (giriş ve çıkışta yumuşak fade)
 */
export async function davetiyeVideosuUret(secenekler?: {
  misafirAd?: string;
  guncelle?: boolean;
}): Promise<{ ok: boolean; url: string; dosyaBoyutu: number; hata?: string }> {
  try {
    const cwd = process.cwd();
    const ciktiYol = path.join(cwd, VARSAYILAN_VIDEO_YOLU);

    if (!secenekler?.guncelle && fs.existsSync(ciktiYol)) {
      const stat = fs.statSync(ciktiYol);
      if (stat.size > 10000) {
        return { ok: true, url: VARSAYILAN_VIDEO_URL, dosyaBoyutu: stat.size };
      }
    }

    if (!ffmpegPath) {
      throw new Error("FFmpeg ikili dosyası bulunamadı.");
    }

    const tmpDir = path.join(cwd, "tmp_video");
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    const coverImg = path.join(cwd, "public/tema3/zarf_cover.jpg");
    const introVideo = path.join(cwd, "public/tema3/orijinal_intro_20260911223616.mp4");
    const sesDosyasi = path.join(cwd, "public/tema3/muzik.mp3");

    const part1Cover = path.join(tmpDir, "part1_cover.mp4");
    const part2Intro = path.join(tmpDir, "part2_intro.mp4");
    const part3Scroll = path.join(tmpDir, "part3_scroll.mp4");
    const concatList = path.join(tmpDir, "concat.txt");

    // 1. ADIM: 2 saniyelik sabit kapak videosu üret
    await execAsync(
      `"${ffmpegPath}" -y -loop 1 -t 2 -i "${coverImg}" -vf "scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280" -r 24 -pix_fmt yuv420p "${part1Cover}"`,
    );

    // 2. ADIM: Mühür açılış videosunu 24fps 720x1280 H.264 standardına getir
    await execAsync(
      `"${ffmpegPath}" -y -i "${introVideo}" -vf "scale=720:1280,fps=24" -c:v libx264 -pix_fmt yuv420p -an "${part2Intro}"`,
    );

    // 3. ADIM: Davetiye sayfasının akıcı ve okunaklı kaydırma videosunu hazırla (23 saniye)
    const sayfaGorsel = path.join(cwd, "public/tema3/davetiye-kart-uzun.png");

    // Chrome varsa ve yeniden üretim istenmişse kartı en güncel haliyle yakala
    const chromeYolu = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
    if (secenekler?.guncelle && fs.existsSync(chromeYolu)) {
      try {
        await execAsync(
          `"${chromeYolu}" --headless --disable-gpu --screenshot="${sayfaGorsel}" --window-size=720,1560 --hide-scrollbars "http://localhost:2608/video-karti"`,
        );
      } catch (e) {
        console.warn("Kart görseli güncelleme atlandı:", e);
      }
    }

    const scrollFilter =
      "crop=720:1280:0:'if(lt(t,3.0), 0, if(gt(t,19.0), in_h-1280, (t-3.0)*(in_h-1280)/16.0))'";

    await execAsync(
      `"${ffmpegPath}" -y -loop 1 -t 23 -i "${sayfaGorsel}" -vf "${scrollFilter}" -r 24 -pix_fmt yuv420p "${part3Scroll}"`,
    );

    // 4. ADIM: Parçaları birleştir ve fon müziği miksi ekle (~29.8 saniye toplam süre)
    fs.writeFileSync(
      concatList,
      `file '${part1Cover}'\nfile '${part2Intro}'\nfile '${part3Scroll}'\n`,
    );

    await execAsync(
      `"${ffmpegPath}" -y -f concat -safe 0 -i "${concatList}" -i "${sesDosyasi}" -c:v libx264 -preset fast -crf 22 -pix_fmt yuv420p -c:a aac -b:a 128k -shortest -af "afade=t=in:ss=0:d=1.5,afade=t=out:st=27.5:d=2.3" "${ciktiYol}"`,
    );

    // Geçici dosyaları temizle
    try {
      [part1Cover, part2Intro, part3Scroll, concatList].forEach((f) => {
        if (fs.existsSync(f)) fs.unlinkSync(f);
      });
      fs.rmdirSync(tmpDir);
    } catch {}

    const sonStat = fs.statSync(ciktiYol);
    return { ok: true, url: VARSAYILAN_VIDEO_URL, dosyaBoyutu: sonStat.size };
  } catch (err) {
    const mesaj = err instanceof Error ? err.message : String(err);
    console.error("Video üretim hatası:", mesaj);
    return { ok: false, url: VARSAYILAN_VIDEO_URL, dosyaBoyutu: 0, hata: mesaj };
  }
}
