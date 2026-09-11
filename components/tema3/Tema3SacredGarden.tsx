"use client";

import { useRef, useState } from "react";
import "./tema3.css";
import Tema3GirisOverlay from "./Tema3GirisOverlay";
import Tema3MuzikButonu from "./Tema3MuzikButonu";
import Tema3Hero from "./Tema3Hero";
import Tema3GeriSayim from "./Tema3GeriSayim";
import Tema3ProgramAkisi from "./Tema3ProgramAkisi";
import Tema3Mekan from "./Tema3Mekan";
import Tema3Notlar from "./Tema3Notlar";
import Tema3RsvpModal from "./Tema3RsvpModal";
import Tema3Kapanis from "./Tema3Kapanis";
import type { EbeveynBlok } from "@/lib/metin";
import type { AnKart } from "@/components/GaleriButonu";

export interface Tema3Props {
  gelinAd: string;
  damatAd: string;
  davetCumlesi?: string;
  tepeBaslik?: string;
  askSozu?: string;
  kiyafetKodu?: string;
  hediyeNotu?: string;
  gelin?: EbeveynBlok;
  damat?: EbeveynBlok;
  tel?: string;
  yemek?: string;
  otopark?: string;
  fotoNotu?: string;
  yuklemeAcik?: boolean;
  yuklemeMesaji?: string;
  galeriAcik?: boolean;
  ciftYolu?: string | null;
  anlar?: AnKart[];
  misafirAd?: string;
  token?: string;
  izinliKisi?: number;
  paylasimUrl?: string;
  whatsappMesaj?: string;
  muzikUrl?: string;
}

export default function Tema3SacredGarden({
  gelinAd,
  damatAd,
  davetCumlesi,
  tepeBaslik,
  askSozu,
  kiyafetKodu,
  hediyeNotu,
  gelin,
  damat,
  yemek,
  otopark,
  yuklemeAcik,
  yuklemeMesaji,
  galeriAcik,
  ciftYolu,
  anlar = [],
  misafirAd,
  token,
  izinliKisi,
  paylasimUrl,
  whatsappMesaj,
  muzikUrl,
}: Tema3Props) {
  const [acildi, setAcildi] = useState(false);
  const muzikRef = useRef<HTMLAudioElement>(null);

  const sesDosyasi = muzikUrl || "/tema3/muzik.mp3";

  return (
    <div className="tema3-govde">
      {/* GİZLİ FON MÜZİĞİ ETİKETİ */}
      <audio
        ref={muzikRef}
        loop
        preload="auto"
        src={sesDosyasi}
      />

      {/* AÇILIŞ ZARFI & VİDEO GEÇİŞ KATMANI */}
      <Tema3GirisOverlay
        misafirAd={misafirAd}
        muzikRef={muzikRef}
        onAcildi={() => setAcildi(true)}
      />

      {/* YÜZEN MÜZİK ÇALAR BUTONU (Sağ alt) */}
      <Tema3MuzikButonu muzikRef={muzikRef} gorunur={acildi} />

      {/* ANA SAYFA İÇERİKLERİ */}
      <main className="tema3-icerik-kapsayici">
        <Tema3Hero
          gelinAd={gelinAd}
          damatAd={damatAd}
          tepeBaslik={tepeBaslik}
          askSozu={askSozu}
          davetCumlesi={davetCumlesi}
        />

        <Tema3GeriSayim />

        <Tema3ProgramAkisi />

        <Tema3Mekan />

        <Tema3Notlar
          kiyafetKodu={kiyafetKodu}
          hediyeNotu={hediyeNotu}
          yemek={yemek}
          otopark={otopark}
          gelin={gelin}
          damat={damat}
        />

        <Tema3RsvpModal
          varsayilanAd={misafirAd}
          token={token}
          izinliKisi={izinliKisi}
        />

        <Tema3Kapanis
          gelinAd={gelinAd}
          damatAd={damatAd}
          ciftYolu={ciftYolu}
          paylasimUrl={paylasimUrl}
          whatsappMesaj={whatsappMesaj}
          yuklemeAcik={yuklemeAcik}
          yuklemeMesaji={yuklemeMesaji}
          galeriAcik={galeriAcik}
          anlar={anlar}
        />
      </main>
    </div>
  );
}
