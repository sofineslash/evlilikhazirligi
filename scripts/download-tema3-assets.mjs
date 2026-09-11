import fs from 'fs';
import path from 'path';
import https from 'https';

const assets = [
  { url: 'https://res.cloudinary.com/ukb8xb7m/video/upload/v1787037654/1782224012851_1_m6ww6v.mp4', dest: 'public/tema3/intro.mp4' },
  { url: 'https://res.cloudinary.com/ukb8xb7m/video/upload/v1787037092/Swans2_1_qwzsod.mp4', dest: 'public/tema3/swans.mp4' },
  { url: 'https://pub-4dc8201144ca418fb604349c73e8c724.r2.dev/Einaudi_%20Divenire%20(1)%20(1).mp3', dest: 'public/tema3/muzik.mp3' },
  { url: 'https://res.cloudinary.com/ukb8xb7m/image/upload/v1787037630/ChatGPT_Image_Jun_23_2026_04_40_29_PM_4_piptqn.png', dest: 'public/tema3/zarf.png' },
  { url: 'https://static.tildacdn.net/tild3363-3665-4330-a361-666466346532/rose_-_Copy.png', dest: 'public/tema3/gul.png' },
  { url: 'https://static.tildacdn.net/tild6131-6362-4663-b461-626531656438/right-element_1.png', dest: 'public/tema3/right-element.png' },
  { url: 'https://static.tildacdn.net/tild3638-3336-4136-a131-633463346265/left-element_1.png', dest: 'public/tema3/left-element.png' },
  { url: 'https://static.tildacdn.net/tild3232-3638-4338-a134-336230313236/acomm-decor.png', dest: 'public/tema3/acomm-decor.png' },
  { url: 'https://static.tildacdn.net/tild3637-3939-4864-a263-333836383139/ChatGPT_Image_May_25.png', dest: 'public/tema3/cicek-buket.png' },
  { url: 'https://static.tildacdn.net/tild6638-6565-4665-a361-653962303137/wax_seal_1.png', dest: 'public/tema3/muhur.png' },
  { url: 'https://static.tildacdn.net/tild6235-3237-4230-b632-326437376662/pexels-vinicius-quar.jpg', dest: 'public/tema3/cift-kapanis.jpg' },
  { url: 'https://static.tildacdn.net/tild3134-6461-4832-a236-633431616631/623915249_2629494717.png', dest: 'public/tema3/cerceve.png' },
  { url: 'https://static.tildacdn.net/tild3438-6238-4236-b537-366632636138/noroot.png', dest: 'public/tema3/separator.png' }
];

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const get = (targetUrl) => {
      https.get(targetUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return get(res.headers.location);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`Failed to download ${url}: status ${res.statusCode}`));
        }
        res.pipe(file);
        file.on('finish', () => {
          file.close(() => {
            const size = fs.statSync(dest).size;
            console.log(`✓ Downloaded ${path.basename(dest)} (${(size / 1024 / 1024).toFixed(2)} MB)`);
            resolve();
          });
        });
      }).on('error', (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });
    };
    get(url);
  });
}

async function main() {
  console.log('Downloading Tema 3 assets...');
  for (const a of assets) {
    try {
      await download(a.url, a.dest);
    } catch (e) {
      console.error(`Error downloading ${a.url}:`, e.message);
    }
  }
  console.log('All downloads completed!');
}

main();
