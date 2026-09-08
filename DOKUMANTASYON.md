# Nişan Davetiyesi & Anı Paylaşım Platformu — Sistem Dökümantasyonu

**Site:** `kubranur.omuroz.com.tr`  
**Etkinlik:** Ömür Öz & Kübranur Yavaş Nişan Töreni — 29 Ekim 2026 Perşembe, 19:00  
**Salon:** Asır Davet Balo & Kına Pendik Düğün Salonu, Çınardere Mh. Ankara Cd, Akseki Sokağı No:1, Pendik/İstanbul  
**Port:** `2608` | **Stack:** Next.js 16.3 + React 19.2 + SQLite (better-sqlite3) + Node 22  

---

## 1. Mimarî Genel Bakış ve Barındırma Topolojisi

Sistem, salon ortamındaki zayıf internet ve mobil kopmalara dayanıklı olacak şekilde hibrit bir yapıda kurgulanmıştır:

```
                  kubranur.omuroz.com.tr  (TEK HOSTNAME)
                             |
                   Cloudflare Edge Yönlendirme
                  /                          \
         / ve statik varlıklar         /api/*, /an, /admin, /medya/*
                 |                                    |
          Cloudflare Pages                     Cloudflare Tunnel
          (Statik Export)                             |
        (Ev kutusu kapansa bile                 Ubuntu Sunucu
         davetiye ayakta kalır)                 localhost:2608
                                            (Docker tek konteyner)
```

### Temel Mimarî Prensipler
1. **Tek Hostname, Yol Bazlı Yönlendirme:** Çerez izolasyonunu korumak ve CORS sorunlarını sıfırlamak için alt alan adı kullanılmaz; Pages ve Tunnel aynı domain altında birleşir.
2. **Parçalı (Chunked) Yükleme:** Cloudflare ücretsiz planının 100 MB istek gövdesi sınırını aşmak ve mobil ağ kopmalarını tolere etmek için 8 MB'lık parçalar halinde yükleme yapılır.
3. **Konteyner Düşme Koruması:** Ev sunucusu düşse veya yeniden başlasa bile ana davetiye sayfası Cloudflare Pages üzerinden kesintisiz yayında kalır.

---

## 2. Teknoloji Yığını

* **Çekirdek:** Next.js 16.3.0 (App Router, Server Actions, Route Handlers, `proxy.ts`), React 19.2.0, TypeScript 5.7.2.
* **Veritabanı:** SQLite (`better-sqlite3` 11.5.0, WAL modu, `busy_timeout=5000`, `foreign_keys=ON`).
* **Medya & Transcoding:**
  * `sharp` (0.35.3): WebP formatı, 4:5 oranına akıllı kırpma (`cover`), EXIF yönelimini sabitleme, GPS/metadata temizliği.
  * `heic-convert` (2.1.0): Apple/Samsung HEIC/HEIF fotoğrafları kayıpsız JPEG tamponuna açma.
  * `ffmpeg-static` (5.3.0) & `@ffprobe-installer/ffprobe` (2.1.2): Sistemden bağımsız gömülü ikililerle 1080p H.264/AAC transcode, `+faststart` ve kapak karesi çıkarma.
* **Oturum & Güvenlik:** `jose` (JWT tabanlı imzalı cihaz ve admin çerezleri), `bcryptjs` (şifre hashleme), `crypto.timingSafeEqual` (sabit zamanlı kullanıcı adı kontrolü).
* **Test & CI/CD:** `vitest` (birim testler), Docker (`node:22-bookworm-slim`), GitHub Actions self-hosted runner.

---

## 3. Veritabanı Şeması ve Tablolar

Veritabanı dosyası `data/nisan.db` (Docker'da `/srv/data/nisan.db`) altında barınır.

### Tablolar
1. **`katilimlar`**: LCV kayıtları.
   * `id` (TEXT PK): UUID.
   * `ad_soyad` (TEXT): Misafirin girdiği ham ad.
   * `ad_soyad_norm` (TEXT): Arama ve mükerrer kontrol anahtarı (NFD normalize).
   * `geliyor` (INTEGER): 1 = Geliyor, 0 = Gelemiyor.
   * `kisi_sayisi` (INTEGER): Kendisi dahil toplam kişi sayısı.
   * `dilek` (TEXT): İsteğe bağlı not.
   * `dilek_yayinda` (INTEGER): Admin onaylı dilek duvarı bayrağı.
   * `cihaz_jetonu` (TEXT): İmzalı cihaz tanımlayıcısı.
   * `cift_isaretli` (INTEGER): "Farklı kişiyim" akışından gelen kayıtlar.
   * `tek_kelime` (INTEGER): Tek kelimelik isimler için tekillik muafiyet bayrağı.
   * `ip_hash` (TEXT): SHA-256 IP özeti.
   * `olusturuldu` (TEXT): ISO 8601 zaman damgası.
   * *Kısmi Tekil İndeks:* `CREATE UNIQUE INDEX ux_katilim_norm ON katilimlar(ad_soyad_norm) WHERE cift_isaretli = 0 AND tek_kelime = 0;`
2. **`ayarlar`**: Dinamik ayarlar ve metinler (`metin.*` önekiyle saklanır).
3. **`anlar`**: Misafir fotoğraf ve videoları.
   * `id` (TEXT PK), `dosya` (TEXT UK), `yukleyen` (TEXT), `bayt` (INTEGER), `genislik` (INTEGER), `yukseklik` (INTEGER), `gizli` (INTEGER), `tur` (TEXT: foto/video), `sure` (INTEGER), `kapak` (TEXT), `olusturuldu` (TEXT).
4. **`kullanicilar`**: Ek yönetici hesapları (`kullanici_adi`, `sifre_hash`, `olusturuldu`).
5. **`_migrations`**: Uygulanan SQL migration dosyaları tablosu.

---

## 4. Rota ve API Belirtimi

### Sayfalar (Frontend)
* `/` (`app/page.tsx`): 3B Zarf animasyonlu ana davetiye sayfası.
* `/an` (`app/an/page.tsx`): Masa karekodlarının hedefi olan yükleme sayfası.
* `/admin/giris` (`app/admin/giris/page.tsx`): Sabit zamanlı yönetici giriş ekranı.
* `/admin` (`app/admin/page.tsx`): Kayıtlar, Fotoğraflar, Galeri, Davetiye, Metinler ve Kullanıcı sekmeli yönetim paneli.

### API Uçları (Backend)
* `POST /api/katilim`: LCV formu işleme, mükerrerlik ve tek kelime kontrolü.
* `POST /api/an`: 8 MB altındaki medya dosyalarını tek istekte işleme ve kaydetme.
* `POST /api/an/parca`: 8 MB'lık parçalar halinde yükleme (`x-yukleme-id`, parça numarası ve devam desteği).
* `GET /api/an/parca`: Yarım kalan bir yüklemenin mevcut bayt ofsetini döner.
* `GET /api/an/[id]`: Fotoğraf/video sunumu (HTTP 206 Range akış desteği, `?kapak=1` ve `?indir=1`).
* `GET /api/an/liste`: Misafir galerisi için canlı an listesini tazeler.
* `POST /api/an/zip`: Seçilen veya tüm anıları sıfır sıkıştırmalı (store) ZIP olarak paketler (yalnızca admin).
* `GET, POST, DELETE /api/sahne/[ad]`: Sahne görsellerini okuma, yükleme ve silme.
* `GET /api/ics`: Apple/Google Takvim uyumlu `.ics` davetiye dosyası üretimi.

---

## 5. Kritik İş Mantığı ve Güvenlik Mekanizmaları

### 5.1. Türkçe İsim Normalizasyonu (`lib/normalizeAd.ts`)
* `toLocaleLowerCase("tr")` + `normalize("NFD")` + diakritik temizliği + `ı -> i` dönüşümü uygulanır.
* `ÖMÜR ÖZ`, `Ömür Öz`, `omur oz` aynı arama anahtarında (`omur oz`) birleştirilir.
* Tek kelimeli isimler ("Fatma", "Anneannem") kabul edilir ancak tekillik indeksine sokulmaz (`tek_kelime=1`).

### 5.2. Scroll-Driven 3B Zarf Açılışı (`components/Zarf.tsx`)
* Scroll hijacking yapılmaz; sayfa normal kayarken 100vh sticky sahnede `--ilerleme` değişkeni (0.00 - 1.00) üzerinden aşamalı olarak açılır:
  * 0.00 - 0.30: Zarf arkasını döner (rotateY 180°).
  * 0.00 - 0.17: Zarf üzerindeki monogram/yazı silinir.
  * 0.27 - 0.62: Zarf kapağı menteşesinden yukarı katlanır.
  * 0.58 - 1.00: Davetiye kartı öne büyür, zarf geri çekilir.
* `<noscript>` desteğiyle JS kapalıyken davetiye kartı doğrudan düzleştirilerek gösterilir.

### 5.3. Medya ve Video İşleme Boru Hattı (`lib/yukleme-isle.ts` & `lib/video.ts`)
* Dosya uzantısı yerine ilk baytlara (`magic bytes`) bakılarak tür doğrulanır.
* HEIC/HEIF fotoğraflar `heic-convert` ile kayıpsız JPEG tamponuna çevrilir; ardından `sharp` ile WebP'ye dönüştürülüp EXIF/GPS bilgileri tamamen silinir.
* Videolar 600 MB / 60 saniye tavanına tabidir. FFmpeg ile kısa kenarı 1080p olacak şekilde H.264/AAC kodlanır, `+faststart` eklenir ve 1. saniyeden JPEG kapak karesi oluşturulur.
* iOS Safari uyumluluğu için HTTP 206 `Range` akışı desteklenir.

### 5.4. Yönetici ve Oturum Güvenliği (`lib/admin.ts` & `lib/session.ts`)
* `.env` dosyasındaki `ADMIN_KULLANICI` ana hesaptır; veritabanı bozulsa bile kilitlenmez.
* Sabit zamanlı karakter kontrolü (`crypto.timingSafeEqual`) ile timing attack önlenir.
* İki kademeli rate-limit uygulanır: IP başına (5 deneme/15 dk) ve global (30 deneme/15 dk).
* JWT jetonundaki `nesil` claim'i ile `oturum_nesli` artırılarak tüm aktif admin oturumları tek tıkla düşürülebilir.

---

## 6. CI/CD Dağıtım Süreci (`.github/workflows/main.yml`)

1. `git push main` tetiklemesiyle self-hosted runner devreye girer.
2. Zorunlu sırlar (`ADMIN_KULLANICI`, `ADMIN_PASSWORD_HASH_B64`, `AUTH_SECRET >= 32`) doğrulanır.
3. `.env` dosyası güvenli izinlerle (`umask 077`) yazılır.
4. Kalıcı `/srv/data` ve `/srv/medya` klasörleri Docker içinde `chown 1000:1000` ile hazırlanır.
5. `docker compose down --remove-orphans` ile eski servis durdurulur; `docker compose up -d --build` ile başlatılır.
6. Sağlık kontrolü döngüsü (`curl -s http://127.0.0.1:2608/`) 200 kodu alana kadar bekler.
7. İşlem bitiminde sunucudaki geçici `.env` temizlenir.
