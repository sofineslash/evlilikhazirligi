# Pixar sahneleri — buraya at

Site bu klasoru **sabit adlarla** okur. Dosyayi atinca site kendiliginde
guncellenir, kod degistirmek gerekmez. Dosya yoksa yer tutucu gorunur.

| Dosya adi | Nerede gorunur |
|---|---|
| `01-kapak` | Kapakta, isimlerin arkasinda |
| `02-cift` | "Nerede" bolumunun ustunde |
| `03-tarih` | "Katilim" bolumunun ustunde |
| `04-salon` | Salon karti icinde |
| `05-kapanis` | Sayfanin sonunda |

## Kurallar

- **Oran: 4:5 dikey** (ornek 1080×1350). Telefon once tasarlandi.
- **Uzanti serbest:** `.webp` tercih, ama `.jpg` `.jpeg` `.png` `.avif` de olur.
  Telefondan cikan dosyayi donusturmeden atabilirsin.
- **Boyut hedefi: dosya basina 200 KB civari.** Tikanik salon sebekesinde
  bes sahne toplam ~1 MB'i gecmemeli.
- Ad tam olarak yukaridaki gibi olmali (`01-kapak.webp` gibi), bastaki
  numara dahil.

## Ornek

```
public/scenes/01-kapak.webp
public/scenes/02-cift.jpg
```

Boyut kucultmek icin (macOS'ta ImageMagick varsa):

```bash
magick giris.jpg -resize 1080x1350^ -gravity center -extent 1080x1350 -quality 82 01-kapak.webp
```
