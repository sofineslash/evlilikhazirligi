/**
 * Google Takvim ve Apple/Outlook (.ics) etkinlik linkleri uretici.
 */
import { CFG } from "./config";

export function googleTakvimLinki(): string {
  const baslik = encodeURIComponent(`${CFG.GELIN} & ${CFG.DAMAT} — Nişan Töreni`);
  const detay = encodeURIComponent(
    `${CFG.SALON_AD}\n${CFG.SALON_ADRES}\n\nSizi aramızda görmekten onur duyarız.`
  );
  const yer = encodeURIComponent(`${CFG.SALON_AD}, ${CFG.SALON_ADRES}`);
  // 29 Ekim 2026 19:00 - 23:00 (TR saati UTC+3 oldugu icin UTC 16:00 - 20:00)
  const tarihler = "20261029T160000Z/20261029T200000Z";

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${baslik}&dates=${tarihler}&details=${detay}&location=${yer}`;
}

export function icsEtkinlikIndir(): void {
  const icsIcerik = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Kubranur ve Omur Faruk//Nisan Davetiyesi//TR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    "UID:nisan-20261029@kubranur.omuroz.com.tr",
    "DTSTAMP:20261029T000000Z",
    "DTSTART:20261029T160000Z",
    "DTEND:20261029T200000Z",
    `SUMMARY:${CFG.GELIN} & ${CFG.DAMAT} — Nişan Töreni`,
    `DESCRIPTION:${CFG.SALON_AD} - ${CFG.SALON_ADRES}`,
    `LOCATION:${CFG.SALON_AD}, ${CFG.SALON_ADRES}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([icsIcerik], { type: "text/calendar;charset=utf-8" });
  const link = document.createElement("a");
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute("download", "kubranur-omur-nisan.ics");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
