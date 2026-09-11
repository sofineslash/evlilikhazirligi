"use client";

interface EventItem {
  saat: string;
  ad: string;
}

interface Props {
  etkinlikler?: EventItem[];
}

const VARSAYILAN_ETKINLIKLER: EventItem[] = [
  { saat: "17:00", ad: "Misafir Karşılama" },
  { saat: "18:00", ad: "Nişan & Yüzük Merasimi" },
  { saat: "19:00", ad: "Kokteyl & İkramlar" },
  { saat: "20:00", ad: "Akşam Yemeği" },
  { saat: "21:00", ad: "Müzik & Kutlama" },
];

export default function Tema3ProgramAkisi({ etkinlikler = VARSAYILAN_ETKINLIKLER }: Props) {
  return (
    <section className="tema3-bolum-kapsul">
      <div className="tema3-suslu-baslik-satiri">
        <img
          src="/tema3/left-element.png"
          alt=""
          className="tema3-dekor-element"
          aria-hidden="true"
        />
        <h3 className="tema3-bolum-baslik" style={{ margin: 0 }}>
          Schedule of Events
        </h3>
        <img
          src="/tema3/right-element.png"
          alt=""
          className="tema3-dekor-element"
          aria-hidden="true"
        />
      </div>

      <div className="tema3-program-kapsayici">
        {etkinlikler.map((item, idx) => (
          <div key={idx} className="tema3-program-kart">
            <span className="tema3-program-ad">{item.ad}</span>
            <span className="tema3-program-saat">{item.saat}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
