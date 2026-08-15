<!-- /autoplan restore point: /Users/omuroz/.gstack/projects/sofineslash-specs/main-autoplan-restore-20260815-122434.md -->
# Nişan Davetiyesi — Uygulama Planı

**Site:** kubranur.omuroz.com.tr
**Etkinlik:** Ömür Öz & Kübranur Yavaş nişanı — 29 Ekim 2026 Perşembe, 19:00
**Salon:** Asır Davet Balo & Kına Pendik Düğün Salonu, Çınardere Mh. Ankara Cd, Akseki Sokağı No:1, Pendik/İstanbul
**Dil:** Türkçe

Tam tasarım dökümanı (premisler, gerekçeler, çapraz-model bulguları, başarı kriterleri):
`~/.gstack/projects/sofineslash-specs/omuroz-main-design-20260815-112540.md`

Bu dosya o dökümanın **uygulanabilir** özeti. Çelişki olursa **bu dosya esastır** —
CEO incelemesi tasarım dökümanından sonra dört kararı değiştirdi (aşağıda).

---

## CEO incelemesi sonrası değişenler (2026-08-15)

| # | Karar | Sonuç |
|---|---|---|
| UC1 | **Video kodlaması nişandan sonraya alındı** | Gece ffmpeg kuyruğu, kurtarma, duraklatma bayrağı ve `Range`/206 oynatma yolu **kapsamdan çıktı**. Video ham olarak saklanır, Kasım'da toplu betikle 1080p'ye iner. |
| UC2 | **Davetiye Cloudflare Pages'te, form ev kutusunda** | Ev makinesi düşse bile davetiye ayakta kalır. Tek hostname, yol bazlı yönlendirme. |
| UC3 | **"Dilekler" alanı eklendi** | RSVP formunda opsiyonel metin alanı + admin görünümü + nişan sonrası dışa aktarma. |
| UC4 | **Self-hosted runner KALIYOR** (kullanıcı kararı) | 27 Ekim dondurma kuralı bu yüzden zorunlu kalır. |

Ayrıca **`FTP/` projesinden dört parça yeniden kullanılıyor** (P4 DRY):
`src/chunked.js`, `src/ratelimit.js`, `src/paths.js`, `src/audit.js`.

**Kritik keşif:** Cloudflare ücretsiz planı istek gövdesini **100 MB** ile sınırlıyor.
`client_max_body_size` ayarı buna çare değil — sınır Cloudflare'de. Bu yüzden
**parçalı yükleme zorunlu**, opsiyonel iyileştirme değil. `FTP/src/chunked.js` bunu
zaten çözmüş: istemcide 8 MB parçalar, sunucuda `.part` dosyasına sırayla ekleme,
son parçada aynı disk bölümünde atomik `rename`.

---

## Kesinleşmiş kararlar

| Konu | Karar |
|---|---|
| Stack | Next 16.3 + React 19.2, TypeScript, vitest, Node **22** (yerel/imaj/CI aynı) |
| Çıktı modu | **`standalone` DEĞİL** — `Specs` deseni (tam `node_modules`) |
| Veri | SQLite + `better-sqlite3` + `drizzle`, WAL, `busy_timeout=5000` |
| Konteyner | Tek `app` servisi, `node:22-bookworm-slim` + `ffmpeg` (sadece poster karesi için) |
| Mount | `nisan-db` (named), `nisan-medya` (named), `./yedek` (host bind) |
| **Barındırma** | `/` → **Cloudflare Pages** (statik). Geri kalan → **Cloudflare Tunnel** → ev kutusu `localhost:2608`. **Tek hostname, yol bazlı yönlendirme** (alt alan adı YOK — çerez siteler arası olmasın) |
| **Yükleme** | **Parçalı** (8 MB parça). Cloudflare 100 MB gövde sınırını atlar; kopan bağlantı sadece bir parçayı kaybettirir |
| Admin auth | **Kullanıcı adı + şifre** (`omuroz`). `bcryptjs` hash (12 tur), base64 kodlu env değişkeninde. `jose` imzalı httpOnly çerez, 30 gün. Tek hata mesajı (hangisinin yanlış olduğu sızmaz), sabit zamanlı kullanıcı adı karşılaştırması, IP başına **ve** global hız sınırı |
| Açılış | 3 sn zarf animasyonu (atlanabilir, cihaz başına bir kez) → tek uzun sayfa |
| RSVP formu | Ad soyad (zorunlu) + Geliyorum/Gelemiyorum + kişi sayısı (kendisi dahil) + **dilekler (opsiyonel)** |
| Tekrar kayıt | Yumuşak: "zaten kayıtlısınız" + "farklı kişiyim" çıkışı → çift işaretli |
| RSVP son tarih | **Yok** — nişana kadar açık |
| Medya görünürlük | Varsayılan kapalı. Kare başına `yayinda` **+** genel `galeri_acik`. **Ayrı `/galeri` sayfası YOK** — onaylanan kareler `sonrasi` modunda davetiyenin altına girer (T4) |
| Video | **Kabul tavanı 60 saniye / 100 MB** (T1 — üç bağımsız kaynak 600 MB'ın salonda yüklenemeyeceğini söyledi). **Ham saklanır**, kodlama nişandan sonra. Daha uzun videolar için masa kartındaki WhatsApp numarası |
| Dilekler | Formda opsiyonel alan **+ sayfada görünür duvar** (admin onaylı, `yayinda` bayrağı) (T3) |
| Admin erişimi | **Cloudflare Access** (email OTP) `/admin*` önünde (T5) + `jose` JWT'de `nesil` claim'i ile toplu iptal |
| Görsel işleme | **Sunucuda otomatik** (`sharp`): 4:5'e kırpar (1080×1350), WebP'ye çevirir, `.rotate()` ile EXIF yönelimini gömer, metadata/GPS düşürür. Ham baytlar diske hiç yazılmaz. Ölçülen kazanç: **%92** (4839 KB → 385 KB). Eski dosyalar için `npm run sahne:optimize` |
| Sahne görselleri | İki kaynak: `public/scenes/` (repoya commit'li, **Pages'ten servis, kutudan bağımsız — kazanır**) veya admin panelinden yükleme (kalıcı diskte, telefondan yapılabilir, **27 Ekim dondurmasından sonra da çalışır**). Dosya yoksa yer tutucu, kırık kutu asla |
| Tasarım sistemi | **Minimal `DESIGN.md`**: 2 yazı tipi, renkli nişan paleti (gül / mercan / kehribar / altın / zümrüt), boşluk ölçeği. **Tek görünüm, koyu mod yok** (T2) |
| Gün-modu | **İstemci tarafında** (statik sayfa). Metin/harita/form JS'siz çalışır |
| Repo | **Kendi GitHub reposu** (`sofineslash/nisan`), runner etiketi `[self-hosted, nisan]` |
| Dondurma | **27 Ekim 2026** — nişan günü deploy yok (runner kaldığı için zorunlu) |

---

## Barındırma topolojisi

```
                    kubranur.omuroz.com.tr   (TEK hostname)
                              |
                    Cloudflare (yol bazli yonlendirme)
                    /                        \
            /  ve statik varliklar        /api/*  /an  /admin
                    |                        /medya/*
            Cloudflare Pages                      |
            (statik export)              Cloudflare Tunnel
            Ev kutusu olse bile                   |
            davetiye AYAKTA                Ubuntu sunucu
                                           localhost:2608
                                           (Docker, tek konteyner)
```

Aynı origin olduğu için CORS yok, cihaz jetonu çerezi birinci taraf kalır.

---

## Rotalar

| Rota | Nerede | Not |
|---|---|---|
| `/` | **Pages (statik)** | Davetiye. Gün-modu + geri sayım istemcide |
| `/an` | Ev kutusu | Parçalı yükleme, QR hedefi. Kapalıysa "henüz açılmadı" (**404 değil**) |
| `/medya/[id]` | Ev kutusu | Medya servisi. Yetki (`galeri_acik` **VE** `yayinda` ANDlenmiş) + `await params` + sabit `Content-Type` + `nosniff`. *(`Range`/206 → TODOS)* |
| `/admin/giris`, `/admin` | Ev kutusu | Panel |
| `/healthz` | Ev kutusu | SQLite'a `SELECT 1` atar |
| `/api/katilim` | Ev kutusu | Route handler |
| `/api/yukle/parca` | Ev kutosu | **Parçalı yükleme** (`chunked.js` deseni). Server Action DEĞİL |
| `/api/yukle/iptal` | Ev kutusu | Yarım kalan yüklemeyi temizler |
| `/api/sahne/[ad]` | Ev kutusu | **Pixar sahnesi** — `GET` herkese açık servis, `POST`/`DELETE` sadece admin. Sihirli bayt doğrulaması, SVG reddi, atomik `rename` |
| `opengraph-image` | Pages | 1200×630 **JPEG** ≤300 KB + `metadataBase` |
| `proxy.ts` | Ev kutusu | Cihaz jetonu çerezi + `X-Robots-Tag`. Matcher `/api/yukle/*` hariç |

Admin mutasyonları Server Action. Silme dosya + küçük resim + kaynak dosyayı unlink eder.

---

## Faz 1 — Temel (15–31 Ağustos). Sonunda aileye gönderilebilir bir şey olsun.

- [ ] 1. `sofineslash/nisan` reposu, Next 16.3 + React 19.2, TS, vitest, Node 22
- [ ] 2. `lib/config.ts` — etkinlik bilgisi + **her sayısal sınır**; `SALON_KOORD.lat===0` ise `next build` FAIL
- [ ] 3. `lib/normalizeAd.ts` + birim testi (min 3 karakter, min 2 kelime, **NFD regresyon testi**) — **ilk yazılan mantık**
- [ ] 4. Şema + `scripts/migrate.ts`, WAL, `ayarlar` tohumlaması, **ayrı `CREATE UNIQUE INDEX ... WHERE`**, **`dilekler TEXT` kolonu**
- [ ] 5. `proxy.ts` — cihaz jetonu + `X-Robots-Tag`, açık matcher (`/api/yukle/*` hariç)
- [ ] 6. Davetiye sayfası **animasyonsuz** — gerçek metin/tarih/19:00/adres, iki harita butonu. **Statik export uyumlu**
- [ ] 7. `/api/katilim` + iki çipli form + **dilekler alanı** + `BEGIN IMMEDIATE` + tekrar kayıt akışı + KVKK satırı
- [ ] 8. `/admin/giris` + `/admin` katılım listesi (**dilekler görünür**) + CSV
- [ ] 9. `opengraph-image` JPEG + `metadataBase` + `og:locale: tr_TR`
- [ ] 10. **WhatsApp'a atılabilir JPG davetiye** — davetli listesinin yarısı bunu *davetiye olarak* kabul edecek. Her arıza modunun yedeği
- [ ] 11. Dockerfile (ffmpeg), compose (üç mount, `127.0.0.1:2608`, `TZ=Europe/Istanbul`, base64 hash), workflow (`stop`→migrate→`up`), `/healthz`
- [ ] 12. `instrumentation.ts` — günlük yedek zamanlayıcısı (`VACUUM INTO` → `/yedek`, gzip, 30 gün, `ayarlar['son_yedek']`)
- [ ] 13. **Geri yükleme tatbikatı** — `docker compose down -v`, `/yedek`'ten geri yükle, kayıtları doğrula. **Atlanamaz.**
- [ ] 14. Cloudflare: Pages projesi + Tunnel + **yol bazlı yönlendirme kuralları**. Tek hostname doğrulaması
- [ ] 15. **Gerçek 100 MB dosyayla Cloudflare üzerinden uçtan uca parçalı yükleme testi.** Faz 3'te değil, burada

## Faz 1.5 — İçerik (paralel, 15 Ağustos'tan itibaren, başkalarına bağlı)

Bunlar kod değil ama **kritik yolda** ve planda görünmüyordu.

- [ ] 16. Pixar dönüşümü için ham fotoğrafları seç ve dönüşümü başlat
- [ ] 17. Davetiye metnini bitir (final Türkçe kopya)
- [ ] 18. Davetli listesini bitir (kaç kişi bekliyoruz — kota ve salon için girdi)
- [ ] 19. Profesyonel fotoğrafçının teslim şartlarını yazılı al

## Faz 2 — Sinema (1–20 Eylül)

- [ ] 19b. **`DESIGN.md` minimal token seti** (T2) — 2 yazı tipi (Türkçe diakritik kapsamlı), 3 renk, boşluk ölçeği, koyu palet. Faz 2'nin İLK maddesi; sonraki her madde bundan okur

- [ ] 20. Zarf açılışı ≤3 sn, atlanabilir, `localStorage`, **içeriğin üstünde katman**
- [ ] 21. `Scene` bileşeni + `public/scenes/` yer tutucuları — düz `<img>`, açık boyutlar, `next/image` yok
- [ ] 22. `IntersectionObserver` açılışları, geri sayım, `prefers-reduced-motion`
- [ ] 23. Gün-modu üç durum (`oncesi`/`gun`/`sonrasi`) — **istemcide**, `?tarih=` ile test edilebilir
- [ ] 24. Konfeti *(fiş kartı: önceden yetkilendirilmiş kesinti — sadece Faz 2 erken biterse)*

## Faz 3 — Medya (21 Eylül – 10 Ekim) — UC1 sonrası ciddi sadeleşti

- [ ] 25. `/an` istemci — **8 MB parçalı yükleme** (`chunked.js` deseni: `uploadId`, sıra, iptal) + fotoğraf için **`OffscreenCanvas` özellik tespiti** (iOS 16.4 altında yok!), `convertToBlob`/`toBlob`, `imageOrientation:'from-image'`, **MIME doğrulama** (sessiz PNG tuzağı), HEIC mesajı + IndexedDB kuyruğu + otomatik devam, ✓ **yalnızca 200'de**
- [ ] 26. `/api/yukle/parca` — sıralı kapılar: `yukleme_acik` → parça sırası (409) → **rezervasyon (`BEGIN IMMEDIATE`, kota + `statfs`)**. `.part` dosyası → son parçada atomik `rename`. `FTP/src/chunked.js` portu
- [ ] 27. Fotoğraf işleme: `sharp(buf).rotate().webp()` + 400px küçük resim, **ham bayt diske yazılmaz**, `exiftool` ile GPS doğrulaması
- [ ] 28. Video: **ham sakla**, `ffprobe` süre kapısı, **poster karesi** (`ffmpeg -ss 1 -frames:v 1`, ~50ms, kuyruk yok). Kodlama YOK
- [ ] 29. `FTP/src/ratelimit.js` + `FTP/src/paths.js` + `FTP/src/audit.js` portu
- [ ] 30. Admin medya ızgarası, silme (dosya+küçük resim+kaynak unlink), cihaz bazlı toplu silme, yayın işareti, kota + boş disk, `son_yedek`
- [ ] 31. **Dilekler duvarı** (T3) — onaylanan dilekler statik davetiyeye build sırasında gömülür, isim + metin. Admin `yayinda` bayrağıyla onaylar
- [ ] 31b. Onaylanan kareler `sonrasi` modunda davetiyenin altında (T4 — ayrı `/galeri` sayfası yok)

## Faz 4 — Sahaya çıkma (11–20 Ekim)

- [ ] 32. **Salonda gerçek cihaz testi** — parçalı yükleme, üç anahtar, harita, **portre iPhone yönelimi (yeni + eski cihaz)**, gün-modu. Dondurmadan ≥1 hafta önce
- [ ] 33. WiFi/captive portal doğrula → QR + masa kartı (**WiFi şifresi kartın üstünde**)
- [ ] 34. Admin erişimini güvenilen kişiye devret + panik provası
- [ ] 35. **Ev kutusu düşme provası:** konteyneri kapat, davetiyenin Pages'ten hâlâ açıldığını doğrula
- [ ] 36. Host reboot testi

## Tampon (21–26 Ekim) — sadece düzeltme, yeni özellik yok
## 27 Ekim — repoyu dondur (runner kaldığı için zorunlu)

## Nişan sonrası (Kasım)

- [ ] 37. Video toplu kodlama betiği — 1080p, uzun kenar 1920:
      `ffmpeg -i in -vf "scale='if(gt(iw,ih),min(1920,iw),-2)':'if(gt(iw,ih),-2,min(1920,ih))'" -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 23 -preset veryfast -threads 1 -c:a aac -b:a 128k -movflags +faststart out.mp4`
      - `-pix_fmt yuv420p -profile:v high` — **olmadan** iPhone 10-bit HDR kaynağı High 10 üretir ve iOS Safari oynatmaz
      - `-movflags +faststart` — `moov` atomunu başa taşır
      - Koşullu `scale` — **uzun kenarı** sınırlar; `min(1080,ih)` dikey 4K'yı 608×1080'e çökertir
- [ ] 38. Dilekleri isim + not olarak basılabilir PDF'e dök

---

## İlk iş: saha ziyareti

Kod yazmadan önce salondan üç şey al:
1. Misafir WiFi var mı, captive portal mı?
2. Telefondan hız testi — özellikle **yükleme** hızı
3. Salonun tam koordinatları (`SALON_KOORD` — build'i kilitliyor)

---

## Bilinen açık riskler

- **Ev makinesi erişilebilirliği** — UC2 ile davetiye korundu, ama RSVP formu ve yükleme
  hâlâ ev kutusuna bağlı. Kutu düşerse davetiye görünür, form çalışmaz.
- **Cevap vermeyen davetli** — son tarih ve hatırlatma yok. Gerçek sayı yine telefonla
  ailelerden toplanacak; veritabanı onun kısmi gölgesi. CEO sesi bunu itiraz olarak
  işaretledi, karar kullanıcının.
- **Yükleme benimsenmesi** — QR ve masa kartı dışında bir mekanizma yok. Talep edilmeyen
  QR-yükleme oranları düşük olabilir.
- `restart: unless-stopped` **sağlıksız** konteyneri yeniden başlatmaz (yalnızca çıkışta).
- WhatsApp içi tarayıcıda çerez/`localStorage` kalıcılığı garanti değil.
- `createImageBitmap` options bag'i Safari 15–16.7'de kısmi destekli.
- **Runner nişan günü** yanlış bir push'la konteyneri yeniden kurabilir → 27 Ekim dondurma.

---

## TODOS'a ertelendi

- Ortak "ev iskeleti" paketi — `chunked.js`, `ratelimit.js`, `paths.js` üç proje arasında
  kopyalanıyor. Ortak bir yere çıkarmak 12 aylık ideal, ama 10 hafta ve tek atış varken
  yanlış zaman.
- ClamAV virüs taraması (`FTP/TODOS.md`'de de duruyor). Medya admin-only olduğu için değeri düşük.
- `nsfwjs` otomatik tarama.
- `/medya/[id]` için `Range`/206 — nişan gecesi oynatma olmadığı için gerekmiyor.
- `/salon` projeksiyon duvarı (SSE).
- `litestream` sürekli SQLite replikasyonu.
- `output: 'standalone'` ile imaj küçültme.

---

## Tasarım kararları (Design incelemesi, 2026-08-15) — 4/10 → 7.5/10

### İlk ekran sırası (kaydırma olmadan görünen)

```
  1. Omur & Kubranur                    (isimler, en buyuk tipografi)
  2. 29 Ekim 2026, Persembe, 19:00      (tarih ve SAAT ayni satirda)
  3. Asir Davet Balo & Kina Pendik      (salon adi)
  4. [Google Haritalar]  [Apple Haritalar]  [Takvime ekle]
  5. "Yol tarifi ve LCV asagida"        (tek satir yonlendirme)
```

Geri sayım ilk ekranda **değil**. RSVP formu **iki konumda**: sayfa ortası ve sonu —
tek CTA uzun kaydırmanın dibinde, adresi okuyup sekmeyi kapatanları kaybeder.

### Etkileşim durumları tablosu

| Özellik | Yükleniyor | Boş | Hata | Başarı | Kısmi |
|---|---|---|---|---|---|
| RSVP formu | Buton "Gönderiliyor…", kilitli | — | Türkçe, ne yapacağını söyleyen (ağ / doğrulama / 429 / 500 ayrı metin) | "Kaydınız bize ulaştı. Salon girişinde isim sormayacağız." | — |
| RSVP tekrar | — | — | — | Gönderilen bilgi görünür + **"Bilgimi düzelt"** + "Farklı bir kişiyim" | — |
| İsim reddi | — | — | "Adınızı ve soyadınızı yazabilir misiniz?" (tek kelime kabul, bkz. D9) | — | — |
| `/an` yükleme | Yüzde + dosya sayacı + "Bu ekranı kapatmayın" | "Henüz fotoğraf yüklemediniz" | Parça hatası → o parça yeniden denenir, davetli görmez | Dosya başına ✓ (yalnızca 200'de) | Kuyruk kaldığı yerden devam eder |
| `/an` kapalı | — | "Yüklemeler henüz açılmadı" (404 **değil**) | — | — | — |
| **`/an` ev kutusu düşük** | — | — | **Pages'te statik yedek: "Yükleme şu an çalışmıyor — fotoğrafları WhatsApp'tan şu numaraya gönderin: 05xx"** | — | — |
| Galeri | İskelet | "Kareler nişandan sonra burada olacak" | — | — | — |

### Görsel dil

- **Sanatsız temel:** tipografi + renk versiyonu tek başına bitmiş görünmeli. Sahneler
  **eklenti**, temel değil. **Son tarih 20 Eylül** — o gün görseller gelmezse site
  sanatsız çıkar, yeniden tasarım yapılmaz.
- **5 sahne, tek en-boy oranı 4:5 (dikey, telefon önce)**, her birinde açık `width`/`height`.
- **Tek açılış tarifi:** 16px yukarı yükselme, 400ms, ease-out, kademe yok.
- **Zarf:** altındaki içerik **zaten boyanmış** olmalı; ekranın herhangi bir yerine
  dokunmak atlar (sadece "Geç" butonu değil); `prefers-reduced-motion` veya `?` parametresi
  varsa hiç oynamaz; yavaş bağlantıda 1.5 sn'de kesilir.
- **Koyu mod YOK — bilinçli tek görünüm (kullanıcı kararı, 2026-08-15).** Tasarım
  incelemesi koyu modu kritik işaretlemişti; risk (Android WhatsApp tarayıcısı ve
  Chrome'un zorunlu-koyu çevirisi) farklı bir yolla karşılanıyor:
  `color-scheme: light` tarayıcıya sayfanın yalnızca açık desteklediğini söyler ve
  otomatik-koyu çevirisini büyük ölçüde susturur; ayrıca her yüzeye açık arka plan
  rengi verilir, hiçbir renk yalnızca bir medya sorgusu içinde tanımlanmaz.
  **Doğrulandı:** tarayıcı koyu moddayken `body` arka planı `rgb(255,248,242)` kalıyor
  ve CSS'te sıfır `prefers-color-scheme: dark` sorgusu var.
  Yine de eski bir Android cihazda zorunlu-koyu testi Faz 4'te yapılır.
- **Tipografi:** Türkçe diakritik kapsamı olan gerçek bir yazı tipi + `font-display: swap`.
  `system-ui` / `-apple-system` **birincil font olarak kullanılmaz.**
- Tüm boyutlar `rem`. Dokunma hedefi min 44px. Çipler 380px altında dikey yığılır.

### Gün-modu — her durumda ne değişir

| Durum | Görünen |
|---|---|
| `oncesi` | Geri sayım (yalnızca T-30 içinde), RSVP birincil |
| `gun` | "Bugün! 19:00", harita butonu birincil, `/an` QR bağlantısı öne çıkar, RSVP tek satıra iner |
| `sonrasi` | Teşekkür satırı, galeri/yükleme birincil, RSVP gizli. *(Faz 2'den çıkarıldı, Kasım'da yapılır)* |

### Güven

1. **Düzeltme yolu** — `proxy.ts`'in verdiği cihaz jetonuyla korunan "Bilgimi düzelt".
2. **KVKK yerine düz Türkçe** — kim görüyor (sadece çift), ne için (salon sayısı), ne zaman
   silinecek. Formal metin küçük link olarak altta.
3. **Formu imzala** — çift portresi + "Ömür & Kübranur" formun hemen üstünde, artı gerçek
   bir WhatsApp numarası: "Formu doldurmak istemiyorsanız bize yazın."
4. **Kişi sayısı etiketi net** — "Kaç kişi geleceksiniz? (kendiniz dahil)", artı/eksi
   sayaç, serbest metin değil.
5. **Ne olacağını söyle** — başarı ekranında "Salon girişinde isim sormayacağız."

### Zorunlu kopya alanları (Faz 1.5, madde 17)

Anne-baba isimleri / "kızımız–oğlumuz" satırı · iletişim telefonu (WhatsApp) ·
yemek var mı (Perşembe 19:00) · otopark · takı adeti · kapanış satırı ·
tüm hata metinleri · OG kartı metni (`og:title`, `og:description` birebir).

*Referans ton: `FTP/src/ratelimit.js` — "Çok fazla deneme. N dakika sonra tekrar deneyin."
Kısa, suçlayıcı değil, ne yapacağını söylüyor.*

### Tasarım — NOT in scope

- Tam `/design-consultation` tasarım sistemi — 10 hafta ve tek sayfa için fazla (minimal
  token seti taste kararı olarak final kapısında).
- Görsel mockup üretimi (`/design-shotgun`) — Pixar sahneleri ayrı iş kolunda üretiliyor.
- Animasyonlu sahne geçişleri — tek açılış tarifi yeterli.

### Tasarım — What already exists

`lib/config.ts` deseni (tek gerçek kaynak, `Specs`'ten) · `FTP/src/ratelimit.js` Türkçe
hata metni tonu. Aktarılabilir görsel dil **yok** — `FTP/public/` ve Cruzer panelleri
farklı ürün türü.

---

## Mühendislik kararları (Eng incelemesi, 2026-08-15)

### Mimari düzeltme: `/` elle yazılmış statik HTML

`next build` **tek projeden hem statik export hem sunucu uygulaması üretemez** —
`output: 'export'` proje geneli bir bayrak ve Server Action, `proxy.ts`, dinamik route
handler ile uyumsuz. UC2'nin yazıldığı hali build mekanizmasız kalıyordu.

**Karar:** `/` elle yazılmış tek statik HTML/CSS dosyası, `lib/config.ts`'ten üretilen bir
betikle oluşturulur ve Pages'e konur. Next uygulaması `/` ile **hiç ilgilenmez.**

Bu tek karar dört bulguyu birden çözüyor: build imkansızlığı (1.1), `/_next/*` sahiplik
çakışması (1.2 — statik sayfada `/_next` yok), JS'siz form için sunucu sayfası (1.9),
ve Pages tarafında `X-Robots-Tag` (4.9 — statik dosyaya `_headers` konur).

### Parçalı yükleme durum makinesi (yeniden tasarlandı)

```
POST /api/yukle/basla     -> MIME+boyut dogrula, kota+statfs kontrol,
                             BEGIN IMMEDIATE ile bayt rezerve et,
                             SUNUCU URETIMLI uploadId dondur (istemci uretimli DEGIL)
POST /api/yukle/parca     -> her parca icin KOSULSUZ:
                               ftruncate(part, index * CHUNK); write at offset
                             => ekleme INSA GEREGI idempotent
                             index <= sonraki -> 200
                             index >  sonraki -> 409 + beklenen index (istemci geri sarar)
                             alinan bayt != beklenen -> reddet, sonraki_parca ILERLEMEZ
POST /api/yukle/iptal     -> durum='iptal' TOMBSTONE (satir kalir).
                             aktif olmayan durumda parca yazimi reddedilir
```

**Durum SQLite'ta yaşar, bellekte değil:**
`yuklemeler(upload_id PK, cihaz_jetonu, ad, mime, beklenen_boyut, yazilan_bayt, sonraki_parca, durum, olusturma)`.
Devam pozisyonu satırdan **ve** `fs.stat(.part).size`'dan çapraz kontrol edilir;
uyuşmazlıkta yükleme iptal edilir, tahmin edilmez.

*Neden: bellekteki `Map` ile konteyner yenilenirse `.part` dosyası kalır ama kaç parça
içerdiğinin kaydı olmaz. İstemci 0'dan devam eder, sunucu üstüne ekler, `rename` başarılı
olur ve admin ızgarasında **sağlam görünen bozuk bir dosya** oluşur.*

Reaper: açılışta ve 30 dakikada bir, satırı olmayan veya 6 saatten eski `.part` dosyaları
silinir ve loglanır.

### Test diyagramı — yeni kod yolları ve kapsam

| Kod yolu / akış | Test türü | Var mı | Boşluk |
|---|---|---|---|
| `normalizeAd` Türkçe katlama | birim | ✅ tanımlı | NFD (iOS klavye `s+◌̧`) vs NFC `ş` eklenmeli |
| **Tekil indeks `ad_soyad_norm` üzerinde** | birim + entegrasyon | ✅ doğru | SQLite `lower()` **ASCII-only** — `lower(ad)` üzerine indeks `ÖMÜR`/`ömür` ikisini de geçirir. Depolanmış kolon kullanımı doğrulanmalı |
| Eşzamanlı çift RSVP | entegrasyon | ⚠️ | İkinci istek yumuşak "zaten kayıtlısınız" almalı, unique constraint 500'ü **değil** |
| **Parça tekrarı (aynı index iki kez)** | entegrasyon | ❌ | Birleştirilmiş baytlar aynı, tek medya satırı, iki kez 200 |
| **Yeniden başlatma ortasında devam** | entegrasyon | ❌ | **SHA-256 eşitliği** — "dosya var mı" değil. 2.1/2.2/2.3'ü yakalayan tek test |
| Sıra dışı parça | entegrasyon | ❌ | 409 + gövdede `beklenen: 3` |
| Kesilmiş parça gövdesi | entegrasyon | ❌ | Reddedilir, `sonraki_parca` ilerlemez |
| İptal sonrası gec parça | entegrasyon | ❌ | 409, `.part` yeniden yaratılmaz |
| **Hız sınırı anahtarı** | entegrasyon | ❌ | **`CF-Connecting-IP` + cihaz jetonu.** Socket adresi kullanılırsa tüm salon tek kovada |
| Cihaz jetonu ilk istekte | entegrasyon | ❌ | İlk POST `NOT NULL` jeton kaydetmeli |
| `/medya/[id]` yetki | entegrasyon | ❌ | `galeri_acik=0` **VE** `yayinda=0` ANDlenmiş olmalı |
| Dosya adı düşmanlığı | birim | ❌ | `../`, NUL, 300 bayt, RTL override, `.svg`, `.php`, çift uzantı |
| **Tünel üzerinden Server Action** | manuel | ❌ | localhost testi hiçbir şey kanıtlamaz |
| Gün-modu İstanbul dışı TZ | birim | ❌ | UTC epoch sabitinden hesapla; Almanya'daki davetli 28'inde "Bugün!" görmemeli |
| Yedekten geri yükleme | betik | ✅ madde 13 | Tekrarlanabilir betik olsun (26 Ekim'de yeniden koşulacak) |

### Failure Modes Registry

| Arıza | Belirti | Kritik boşluk | Karşılık |
|---|---|---|---|
| Hız sınırı socket'e anahtarlı | İlk birkaç RSVP'den sonra **tüm salon** 429 | **EVET** | E1 — `CF-Connecting-IP` |
| Parça durumu bellekte | Sessizce bozuk dosya, admin'de sağlam görünür | **EVET** | E4 + E5 + E15 |
| Server Action Origin/Host | Tüm admin mutasyonları üretimde 403 | **EVET** | E7 |
| Cihaz jetonu yok | "Bilgimi düzelt" kimse için çalışmaz | **EVET** | E6 |
| Ham video XSS | Admin oturumu ele geçirilir | **EVET** | E8 |
| Disk dolması | WAL genişleyemez → **form da ölür** | **EVET** | E20 (rezerve taban) |
| 27 Ekim sonrası arıza | Ne ileri düzeltme ne geri alma | **EVET** | E9 (rollback.sh, 26 Ekim'de test) |
| Medya tek kopya | Geri dönüşü olmayan kayıp | **EVET** | E10 (30 Ekim harici + bulut) |
| Konteyner tıkanır | Bütün akşam sessiz ölü | **EVET** | E11 (watchdog) + E12 (alarm) |
| `/an` kutu düşük | 100 kişi Cloudflare 1033 görür | **EVET** | E13 (Custom Error Page) |
| Tünel deploy'da düşer | Site erişilemez | hayır | E28 (systemd, compose'dan bağımsız) |

### Eng — NOT in scope

- Postgres'e geçiş · çoklu konteyner · Redis hız sınırı (tek süreç, bellek doğru yer)
- Sunucu tarafı video oynatma / `Range` (UC1 ile kapsam dışı)
- Otomatik ölçekleme, CDN önbellek katmanı (davetiye zaten Pages'te)

### Eng — What already exists

`FTP/src/chunked.js` (algoritma + tuzaklar) · `FTP/src/ratelimit.js` (**`TRUST_PROXY`
dersi dahil**) · `FTP/src/paths.js` · `FTP/src/audit.js` · `FTP/deploy/ftp-site.service`
(systemd deseni) · `Specs/Dockerfile` + `docker-compose.yml` + `.github/workflows/main.yml`

---

<!-- AUTONOMOUS DECISION LOG -->
## Decision Audit Trail

| # | Faz | Karar | Sınıf | İlke | Gerekçe | Reddedilen |
|---|---|---|---|---|---|---|
| 1 | CEO 0B | `FTP/src/chunked.js` yeniden kullan | Mekanik | P4 DRY | Cloudflare 100 MB sınırı tek istekli yüklemeyi imkansız kılıyor; algoritma zaten yazılmış ve hata ayıklanmış | Ham gövde akışı (YOL 1) |
| 2 | CEO 0B | `FTP/src/ratelimit.js` yeniden kullan | Mekanik | P4 | Bellek içi sabit pencere, Türkçe 429 mesajı hazır | `rate-limiter-flexible` bağımlılığı |
| 3 | CEO 0B | `FTP/src/paths.js` yeniden kullan | Mekanik | P4 | `sanitizeName`/`uniqueName` yol güvenliği çözülmüş | Elle yazmak |
| 4 | CEO 0D | `FTP/src/audit.js` admin işlemleri için | Taste | P1 | Kim neyi sildi — gece sonrası tek kayıt | Denetim kaydı yok |
| 5 | CEO 0D | Ortak ev iskeleti paketi ERTELE | Mekanik | P3 | 10 hafta + tek atış; yanlış zaman | Şimdi çıkarmak |
| 6 | CEO 0D | ClamAV ERTELE | Mekanik | P3 | Medya admin-only, değer düşük | Kapsama almak |
| 7 | CEO 0C-bis | Parçalı yükleme (YOL 2) | Mekanik | P4+P2 | YOL 1 Cloudflare arkasında fiziksel olarak çalışmıyor | YOL 1 |
| 8 | CEO 0E | Parça boyutu 8 MB | Mekanik | P3 | 600 MB = 75 istek; kopan bağlantı max 8 MB kaybettirir | 16/32 MB |
| 9 | CEO UC1 | Video kodlaması nişandan sonraya | **User Challenge** | — | Kullanıcı kabul etti. Faz 3'ten ffmpeg kuyruğu, kurtarma, duraklatma, Range çıktı | Gece kodlama |
| 10 | CEO UC2 | Davetiye Cloudflare Pages'te | **User Challenge** | — | Kullanıcı kabul etti. Ev düşse davetiye ayakta | Tek konteyner |
| 11 | CEO UC2-alt | Tek hostname, yol bazlı yönlendirme | Mekanik | P5 | Alt alan adı çerezi siteler arası yapardı, iOS'ta takılırdı | `api.` alt alan adı |
| 12 | CEO UC3 | Dilekler alanı eklendi | **User Challenge** | — | Kullanıcı kabul etti | Form kısa kalsın |
| 13 | CEO UC4 | Self-hosted runner KALIYOR | **User Challenge** | — | Kullanıcı reddetti, özgün kararı geçerli. 27 Ekim dondurma zorunlu kalır | ssh deploy |
| 14 | CEO 0A | İçerik maddeleri (Faz 1.5) eklendi | Mekanik | P1 | Kritik yolda ama planda görünmüyordu | Görünmez bırakmak |
| 15 | CEO 6 | WhatsApp JPG davetiye eklendi | Mekanik | P1+P2 | Davetli listesinin yarısı bunu davetiye olarak kabul edecek; her arıza modunun yedeği | Atlamak |
| 16 | CEO 0F | Gün-modu istemciye taşındı | Mekanik | P5 | Statik export sonucu. Premise 3 metin+form için geçerli, gün-modu için değil | Sunucu tarafı |

---

## Implementation Tasks (fazlar arası toplandı)

50 madde: 24×P1 (ship'i bloke eder), 21×P2 (aynı dalda inmeli), 5×P3 (takip TODO).
Kaynak: `~/.gstack/projects/sofineslash-specs/tasks-{design,eng}-review-*.jsonl`

- [ ] **D1 (P1, insan: ~3h / CC: ~20min) — /an fallback** — Pages'te statik /an yedegi + masa kartinda WhatsApp numarasi
  - Kaynak: design-review — Design Pass 2: QR kod ev kutusunu gosteriyor; kutu 20:30'da duserse 100 kisi tarayici hatasi gorur, kartlar basilmis
  - Dosyalar: cloudflare/pages/an-fallback.html, docs/masa-karti.md
- [ ] **D2 (P1, insan: ~2h / CC: ~15min) — opengraph-image** — OG gorseli icerigini spec'le: iki isim + 29 Ekim 2026 Persembe 19:00 + Pendik
  - Kaynak: design-review — Design Pass 1: davetlilerin %100'u goruyor, icerigi tanimsiz
  - Dosyalar: app/opengraph-image.tsx, lib/config.ts
- [ ] **D3 (P1, insan: ~4h / CC: ~25min) — tema** — Koyu mod paleti + color-scheme: light dark + acik body background
  - Kaynak: design-review — Design Pass 6: Android WhatsApp tarayicisi ve Chrome oto-koyu davetiyeyi okunmaz yapabilir
  - Dosyalar: app/globals.css
- [ ] **D4 (P1, insan: ~1g / CC: ~45min) — davetiye** — Sanatsiz temel tasarim: tipografi+renk versiyonu tek basina bitmis gorunsun, sahneler eklenti
  - Kaynak: design-review — Design Pass 5: gorseller gelmezse calisan bir tasarim yok; 20 Eylul son tarih
  - Dosyalar: app/page.tsx, app/globals.css
- [ ] **D5 (P1, insan: ~1g / CC: ~30min) — kopya** — Kopya destesi: anne-baba isimleri, iletisim telefonu, yemek, otopark, taki + tum hata metinleri
  - Kaynak: design-review — Design Pass 1: Turk aile davetiyesinin bekledigi icerik hic yok; anne-baba ismi olmayan davetiye gayriresmi okunur
  - Dosyalar: lib/config.ts, content/kopya.ts
- [ ] **D6 (P1, insan: ~4h / CC: ~20min) — katilim** — Bilgimi duzelt yolu: zaten-kayitli ekraninda gonderilen bilgi gorunsun, cihaz jetonuyla duzeltilebilsin
  - Kaynak: design-review — Design Pass 7: 4 yerine 2 yazan davetlinin geri donus yolu yok, telefon eder ve form anlamsizlasir
  - Dosyalar: app/api/katilim/route.ts, components/RsvpForm.tsx
- [ ] **D7 (P1, insan: ~3h / CC: ~15min) — davetiye** — Ilk ekran sirasi sabit: isimler > tarih/saat > salon > iki harita butonu > tek satir yonlendirme
  - Kaynak: design-review — Design Pass 1: madde 6 duz bir veri listesi, sira tanimsiz
  - Dosyalar: app/page.tsx
- [ ] **D8 (P1, insan: ~4h / CC: ~20min) — /an** — Yukleme ilerlemesi: yuzde + dosya sayaci + 'Bu ekrani kapatmayin' + dosya basina tik
  - Kaynak: design-review — Design Pass 2: 75 parca, yuzde yok, ETA yok -> davetli sekmeyi arka plana atip kaybeder
  - Dosyalar: app/an/page.tsx
- [ ] **D9 (P1, insan: ~2h / CC: ~15min) — normalizeAd** — Tek kelimeli isimleri kabul et (Fatma, Anneannem) — tekilligi atla ve isaretle, hata metni yaz
  - Kaynak: design-review — Design Pass 2: AD_MIN_KELIME=2 gercek bir buyukanneyi sert reddediyor, yazilmis hata mesaji yok
  - Dosyalar: lib/normalizeAd.ts, app/api/katilim/route.ts
- [ ] **E1 (P1, insan: ~2h / CC: ~15min) — ratelimit** — Hiz sinirini CF-Connecting-IP + cihaz jetonuna gore anahtarla, socket adresine gore ASLA
  - Kaynak: eng-review — Eng 3: cloudflared arkasinda tum davetliler tek kovayi paylasir; ilk birkac RSVP tum salonu 429'lar. Her yerel testi gecer
  - Dosyalar: lib/ratelimit.ts, proxy.ts
- [ ] **E2 (P1, insan: ~2g / CC: ~1.5h) — spike** — 16-17 Agustos spike: statik / + yol yonlendirme + 8MB parca Cloudflare/tunel uzerinden + tunel uzerinden Server Action
  - Kaynak: eng-review — Eng 6.10: madde 1'in premisi cozulmemis; herhangi bir basarisizlik topolojiyi degistirir, Agustos'ta ucuz Ekim'de yikici
  - Dosyalar: docs/spike.md
- [ ] **E3 (P1, insan: ~1g / CC: ~40min) — davetiye** — / elle yazilmis statik HTML, lib/config.ts'ten uretilen betikle. Next / ile hic ilgilenmez
  - Kaynak: eng-review — Eng 1.1: next build tek projeden hem export hem sunucu uretemez; output:export Server Action ve proxy.ts ile uyumsuz
  - Dosyalar: scripts/build-davetiye.ts, pages-static/index.html
- [ ] **E4 (P1, insan: ~4h / CC: ~25min) — chunked** — Parca durumu SQLite'ta: yuklemeler(upload_id PK, cihaz, sonraki_parca, yazilan_bayt, durum). fs.stat ile capraz kontrol, uyusmazlikta iptal
  - Kaynak: eng-review — Eng 2.1: bellekte Map, konteyner yenilenince .part kaliyor ama kac parca icerdiginin kaydi yok -> sessizce bozuk dosya
  - Dosyalar: lib/chunked.ts, db/schema.ts
- [ ] **E5 (P1, insan: ~3h / CC: ~20min) — chunked** — Idempotent parca yazimi: her parca icin kosulsuz ftruncate(index*CHUNK) sonra o offsete yaz. index<=sonraki -> 200, index>sonraki -> 409 + beklenen index
  - Kaynak: eng-review — Eng 2.2: sayacla ekleme idempotent degil; tekrar gonderim cift ekliyor ve 409 %95 tamamlanmis yuklemeyi iptal ettiriyor
  - Dosyalar: lib/chunked.ts, app/api/yukle/parca/route.ts
- [ ] **E6 (P1, insan: ~2h / CC: ~15min) — cihaz-jetonu** — proxy.ts jetonu yanita VE iletilen istege enjekte etsin (NextResponse.next request headers, x-cihaz). Handler once header sonra cerez okusun
  - Kaynak: eng-review — Eng 1.4: ilk sayfa Pages'te, ilk POST'ta cerez yok -> her davetli ilk-kez gorunur, Bilgimi duzelt kimse icin calismaz
  - Dosyalar: proxy.ts, app/api/katilim/route.ts
- [ ] **E7 (P1, insan: ~1h / CC: ~10min) — tunel** — cloudflared --http-host-header kubranur.omuroz.com.tr + serverActions.allowedOrigins. Tum admin mutasyonlari TUNEL uzerinden test
  - Kaynak: eng-review — Eng 1.7: Next Origin'i Host'a karsi dogruluyor; localhost'ta calisir uretimde 403
  - Dosyalar: deploy/cloudflared.yml, next.config.ts
- [ ] **E8 (P1, insan: ~3h / CC: ~20min) — medya-guvenlik** — Ham video XSS savunmasi: SVG reddet, uzantiyi ffprobe'dan allowlist ile turet, sabit Content-Type, nosniff, allowlist disi icin attachment, media yanitlarina CSP sandbox
  - Kaynak: eng-review — Eng 4.1: UC1 videoyu ham sakliyor, /admin ile ayni origin; polyglot yukleyen davetli admin cerezine erisir
  - Dosyalar: app/medya/[id]/route.ts
- [ ] **E9 (P1, insan: ~4h / CC: ~25min) — operasyon** — Dondurma oncesi geri donus yolu: docker save son-iyi imaj -> ./yedek, docker-compose.freeze.yml digest ile pinli, rollback.sh (git/ag/runner/build gerektirmez), 26 Ekim'de CALISTIR ve dogrula
  - Kaynak: eng-review — Eng 6.1: dondurma + tek deploy yolu runner = 28 Ekim'de ne ileri duzeltme ne geri alma
  - Dosyalar: deploy/rollback.sh, deploy/docker-compose.freeze.yml
- [ ] **E10 (P1, insan: ~2h / CC: ~15min) — yedek** — 30 Ekim gorevi: nisan-medya'yi harici diske VE bulut depolamaya kopyala. ./yedek ayni makinede, ikinci kopya sayilmaz
  - Kaynak: eng-review — Eng 6.7: irreplaceable dosyalarin tek kopyasi ev kutusunda; Kasim kodlama isi buna bagli
  - Dosyalar: docs/runbook.md
- [ ] **E11 (P1, insan: ~2h / CC: ~15min) — watchdog** — HEALTHCHECK + host cron 2 dakikada /healthz, iki ust uste basarisizlikta docker compose restart app, ./yedek/watchdog.log
  - Kaynak: eng-review — Eng 6.3: restart unless-stopped tikanmis konteyneri kurtarmiyor; plan bunu listeliyor ve hicbir sey yapmiyor
  - Dosyalar: Dockerfile, deploy/watchdog.sh
- [ ] **E12 (P1, insan: ~2h / CC: ~15min) — alarm** — Uyari: /healthz basarisiz VEYA bos alan <20GB -> Telegram/WhatsApp mesaji. Cloudflare tunel-down bildirimi
  - Kaynak: eng-review — Eng 6.4: sifir alarm; disk dolmasi en olasi gece arizasi ve bugun tamamen sessiz
  - Dosyalar: deploy/watchdog.sh
- [ ] **E13 (P1, insan: ~3h / CC: ~20min) — /an** — Kutu-dusuk yedegi mekanizmasi: Cloudflare 502/1033 icin Custom Error Page veya Worker fallback -> statik Pages rotasi
  - Kaynak: eng-review — Eng 6.5: tasarim tablosu bunu vaat ediyor, hicbir sey uygulamiyor; kutu dusukse /an Cloudflare 1033 doner
  - Dosyalar: cloudflare/error-pages/1033.html
- [ ] **E14 (P1, insan: ~3h / CC: ~20min) — yukle-basla** — POST /api/yukle/basla: MIME+boyut dogrula, kota+statfs kontrol, BEGIN IMMEDIATE ile bayt rezerve et, SUNUCU URETIMLI uploadId dondur
  - Kaynak: eng-review — Eng 2.4+2.5: dogrulama ve kota parca 0'dan sonra calisiyor; istemci uretimli uploadId yetkilendirme deligi
  - Dosyalar: app/api/yukle/basla/route.ts
- [ ] **E15 (P1, insan: ~4h / CC: ~30min) — test** — Yeniden baslatma testi: 40. parcadan sonra konteyneri oldur, devam et, birlestirilmis dosyanin SHA-256'si kaynakla ayni olsun (dosya var mi DEGIL)
  - Kaynak: eng-review — Eng 3: hash esitligi 2.1/2.2/2.3'un tamamini yakalayan tek sey; digerleri sessizce basarisiz olur
  - Dosyalar: tests/chunked.test.ts
- [ ] **D10 (P2, insan: ~1h / CC: ~10min) — katilim** — Cift dokunma korumasi: butonu 'Gonderiliyor...' ile kilitle, 3sn ikinci gonderimi engelle
  - Kaynak: design-review — Design Pass 5: DB tarafi cozulmus, UI tarafi degil
  - Dosyalar: components/RsvpForm.tsx
- [ ] **D11 (P2, insan: ~2h / CC: ~10min) — davetiye** — Takvime ekle (.ics) butonu
  - Kaynak: design-review — Design Pass 3: davetlinin gercekten yapmak istedigi eylem, planda hic yok
  - Dosyalar: app/api/ics/route.ts, app/page.tsx
- [ ] **D12 (P2, insan: ~3h / CC: ~20min) — erisim** — rem tipografi, 44px dokunma hedefi, cipler 380px alti dikey yigin, %200 zoom testi
  - Kaynak: design-review — Design Pass 6: hicbir sey boyutlandirilmamis; 320px'te %200 zoomda cipler tasar
  - Dosyalar: app/globals.css
- [ ] **D13 (P2, insan: ~1h / CC: ~10min) — davetiye** — Kapanis beat'i: formdan sonra ciftten kisa bir satir, KVKK kucuk puntoda altta
  - Kaynak: design-review — Design Pass 3: sayfanin son beat'i bir form alani ve bir KVKK satiri
  - Dosyalar: app/page.tsx
- [ ] **D14 (P2, insan: ~2h / CC: ~15min) — guven** — KVKK satirini duz Turkce ile degistir: kim goruyor, ne icin, ne zaman silinecek. Formal metin kucuk link
  - Kaynak: design-review — Design Pass 7: tek guven ogesi hukuki bir satir, kurumsal okunuyor
  - Dosyalar: components/RsvpForm.tsx
- [ ] **D15 (P2, insan: ~2h / CC: ~15min) — guven** — Formu imzala: cift portresi + isimler formun ustunde, WhatsApp numarasi 'Formu doldurmak istemiyorsaniz bize yazin'
  - Kaynak: design-review — Design Pass 7: formun yaninda kimin sordugu gorunmuyor, insan kacis kapisi yok
  - Dosyalar: components/RsvpForm.tsx
- [ ] **D17 (P2, insan: ~1h / CC: ~10min) — /an** — /an'da acik uyari: 'Videolar nisandan sonra izlenebilir olacak'
  - Kaynak: design-review — Design Pass 6: playback kapsam disi oldugu icin yukleme sonrasi tik isareti yaniltici
  - Dosyalar: app/an/page.tsx
- [ ] **E16 (P2, insan: ~2h / CC: ~15min) — chunked** — Kesilmis parca govdesi reddi: alinan bayt Content-Length ve beklenen parca boyutuyla karsilastirilsin, sonraki_parca ilerlemeden once
  - Kaynak: eng-review — Eng 2.3: kopan baglanti 8MB'dan az teslim eder, sayac ilerler, dosya sessizce bozulur
  - Dosyalar: lib/chunked.ts
- [ ] **E17 (P2, insan: ~2h / CC: ~15min) — chunked** — iptal tombstone: durum=iptal, satir kalir; aktif olmayan durumda parca yazimi reddedilir. Reaper: acilista ve 30 dakikada bir sahipsiz .part temizligi
  - Kaynak: eng-review — Eng 2.7: ucusta olan parca .part'i yeniden yaratiyor, hicbir sey onu rename veya reap etmiyor -> disk dolmasi
  - Dosyalar: lib/chunked.ts, instrumentation.ts
- [ ] **E18 (P2, insan: ~1h / CC: ~10min) — chunked** — Son parca tekrar denemesi idempotent: .part yoksa mevcut medya id'sini 200 ile dondur, sharp/ffmpeg'i tekrar calistirma
  - Kaynak: eng-review — Eng 2.8: son parcanin yaniti kaybolursa tekrar deneme 500 verir
  - Dosyalar: app/api/yukle/parca/route.ts
- [ ] **E19 (P2, insan: ~3h / CC: ~20min) — admin-guvenlik** — /admin* Cloudflare Access arkasina (email OTP). Artı jose JWT'de nesil claim'i, ayarlar[oturum_nesli] ile karsilastirilir -> tek integer artirinca tum oturumlar dusar
  - Kaynak: eng-review — Eng 4.5: tek paylasilan sifre, halka acik giris, 30 gun cerez, ucuncu kisiye veriliyor, iptal yolu yok
  - Dosyalar: proxy.ts, lib/session.ts
- [ ] **E20 (P2, insan: ~2h / CC: ~15min) — kota** — Rezerve alan tabani: bir maks yuklemeden buyuk. yukleme_acik zaman kutulu (18:30 ac, 02:00 otomatik kapa handler kontrolu ile). Cihaz basina es zamanli acik yukleme siniri
  - Kaynak: eng-review — Eng 4.2: medya ve DB ayri volume ama ayni dosya sistemi; dolunca WAL genisleyemez ve form da olur
  - Dosyalar: app/api/yukle/basla/route.ts
- [ ] **E21 (P2, insan: ~3h / CC: ~20min) — bot** — Cloudflare Turnstile: /an'da bir kez coz, kisa omurlu imzali yukleme bileti ile degistir, /api/yukle/basla bunu zorunlu kilsin
  - Kaynak: eng-review — Eng 4.3: hesap yok demek insan kaniti yok demek degil; tek savunma kanitlanmamis bir hiz sinirlayici
  - Dosyalar: app/an/page.tsx, app/api/yukle/basla/route.ts
- [ ] **E22 (P2, insan: ~1h / CC: ~10min) — sharp** — sharp(buf,{limitInputPixels:40e6, failOn:'truncated'}) + foto yolu icin sert girdi bayt tavani
  - Kaynak: eng-review — Eng 4.4: 30000x30000 PNG konteyneri OOM ile oldurur
  - Dosyalar: lib/medya.ts
- [ ] **E23 (P2, insan: ~1h / CC: ~10min) — config** — SALON_KOORD kontrolu modul yan etkisi DEGIL, CI betigi olsun
  - Kaynak: eng-review — Eng 5.8: import aninda throw etmek export build'i, birim testleri ve lint'i de kirar
  - Dosyalar: scripts/assert-config.ts
- [ ] **E24 (P2, insan: ~1h / CC: ~10min) — yedek** — instrumentation.ts tek kez calissin: modul seviyesi bayrak + acilista son_yedek bayatlik kontrolu. VACUUM INTO 04:00, yukleme_acik=1 ise atla
  - Kaynak: eng-review — Eng 5.5: runtime basina bir kez calisir -> iki zamanlayici veya sifir; 03:59 restart gunu sessizce atlar
  - Dosyalar: instrumentation.ts
- [ ] **E25 (P2, insan: ~3h / CC: ~25min) — test** — Kritik test seti: parca tekrari, sira disi 409+beklenen, kesilmis parca, iptal sonrasi gec parca, es zamanli cift RSVP, ilk-istek cihaz jetonu, galeri_acik=0 VE yayinda=0 ANDlenmis, dosya adi dusmanligi, tunel uzerinden Server Action, Istanbul disi TZ gun-modu
  - Kaynak: eng-review — Eng 3: deadline baskisi altinda atlanacak testler
  - Dosyalar: tests/
- [ ] **E26 (P2, insan: ~1h / CC: ~10min) — silme** — Silme sirasi DB-first; basarisiz unlink admin islemini dusurmesin; sahipsizleri reaper toplasin
  - Kaynak: eng-review — Eng 5.6: file-first crash'te bozuk satir birakir, DB-first dosya sizdirir
  - Dosyalar: app/admin/actions.ts
- [ ] **E27 (P2, insan: ~2h / CC: ~15min) — canvas** — iOS canvas alan tavani (~16.7M px): maks boyut on-olcekleme + bos-olmayan piksel kontrolu + sunucu tarafi yedek yol
  - Kaynak: eng-review — Eng 5.2: 48MP iPhone fotosu canvas'a cizilince bos veya sessizce kucultulmus geliyor, try/catch tetiklenmiyor
  - Dosyalar: app/an/page.tsx
- [ ] **E28 (P2, insan: ~1h / CC: ~10min) — tunel** — cloudflared host systemd unit, Restart=always, app compose projesinden bagimsiz. Token systemd env dosyasinda
  - Kaynak: eng-review — Eng 6.6: docker compose down deploy sirasinda tuneli de dusurmemeli
  - Dosyalar: deploy/cloudflared.service
- [ ] **E29 (P2, insan: ~4h / CC: ~30min) — runbook** — Kagit uzerinde runbook: gece oncesi zamanli kontrol listesi, kutuya telefondan erisim yolu, anahtarlari telefondan cevirme, kimi arayacak, sifre nerede, sabah sonrasi sirasi
  - Kaynak: eng-review — Eng 6.8: laptop'ta degil kagitta olmasi gereken her sey eksik
  - Dosyalar: docs/runbook.md
- [ ] **D16 (P3, insan: ~30min / CC: ~5min) — katilim** — maxlength=60, admin listesinde tek satir ellipsis
  - Kaynak: design-review — Design Pass 5: 47 karakterlik isim icin kural yok
  - Dosyalar: components/RsvpForm.tsx, app/admin/page.tsx
- [ ] **E30 (P3, insan: ~2h / CC: ~15min) — operasyon** — Hotfix proseduru onceden yaz + hangi ariza siniflarinin dondurmayi kirmayi hakli kildigini isimlendir
  - Kaynak: eng-review — Eng 6.2: tek satirlik Turkce yaziyi duzeltememek runner riskinden daha kotu
  - Dosyalar: docs/runbook.md
- [ ] **E31 (P3, insan: ~1h / CC: ~10min) — perf** — UV_THREADPOOL_SIZE=8, sharp/ffmpeg icin sert es zamanlilik tavani (kuyruk 2), parca eklemeleri async fs
  - Kaynak: eng-review — Eng 1.8: tek senkron surec; salonda ayni surec parca ekleme, thumbnail ve RSVP insert servis ediyor
  - Dosyalar: Dockerfile, lib/medya.ts
- [ ] **E32 (P3, insan: ~2h / CC: ~15min) — form** — /tesekkurler sunucu sayfasi; /api/katilim hem form-urlencoded (303) hem JSON kabul etsin
  - Kaynak: eng-review — Eng 1.9: JS'siz form navigasyonla gidiyor ve sunucu tarafli basari sayfasi gerekiyor, rota tablosunda yok
  - Dosyalar: app/tesekkurler/page.tsx, app/api/katilim/route.ts
- [ ] **E33 (P3, insan: ~1h / CC: ~10min) — og** — opengraph-image.jpg statik metadata dosyasi olarak, elle uretilmis
  - Kaynak: eng-review — Eng 1.10: dinamik ImageResponse yalnizca PNG uretir, plan JPEG istiyor
  - Dosyalar: app/opengraph-image.jpg

---

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 1 | ISSUES_OPEN | 7 öneri, 4 kabul, 3 ertelendi; 3 kritik |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | UNAVAILABLE | auth 401 — `codex login` gerekiyor |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | ISSUES_OPEN | 33 bulgu, 10 kritik boşluk |
| Design Review | `/plan-design-review` | UI/UX gaps | 1 | ISSUES_OPEN | 4/10 → 7.5/10, 13 karar |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | NOT_RUN | Eng incelemesi operasyonel DX yüzeyini kapsadı |

**CROSS-MODEL:** Codex dört fazda da düştü (`_CODEX_AVAILABLE=false`, auth). Tüm sesler
`[subagent-only]`, uzlaşma sayıları N/A. Buna karşın üç bulgu iki bağımsız kaynakta
örtüştü (`next build` iki çıktı imkansızlığı, kodlamayı etkinlik sonrasına alma, RSVP
son tarihi) ve bir bulgu **üç** kaynakta birden (600 MB video tavanının gerçekçi olmaması
— T1 ile 60 sn / 100 MB'a indirildi).

**VERDICT:** CEO + DESIGN + ENG tamamlandı, 50 uygulama maddesi türetildi (24×P1).
Eng Review `issues_open` — P1 maddeleri kapatılmadan ship edilmemeli. DX Review
çalıştırılmadı, gerekçesi kayıtlı. Kod yazmaya başlamak için hazır; ilk iş **E2 spike**
(16-17 Ağustos) çünkü Faz 1'in premisi ona bağlı.

**UNRESOLVED DECISIONS:**
- `Projelerimiz` reposunun `origin`'i `sofineslash/specs`'i gösteriyor ve tarihler ayrık — kullanıcı `git remote remove origin` çalıştıracak (T6, kasıtlı olarak otomatikleştirilmedi)
- DX Review (`/plan-devex-review`) çalıştırılmadı — ayrı oturumda koşulabilir
