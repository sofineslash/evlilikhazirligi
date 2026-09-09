import { CFG } from "@/lib/config";

export async function GET() {
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
    `DESCRIPTION:${CFG.SALON_AD}\\n${CFG.SALON_ADRES}\\n\\nSizi aramızda görmekten mutluluk duyarız.`,
    `LOCATION:${CFG.SALON_AD}, ${CFG.SALON_ADRES}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return new Response(icsIcerik, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="kubranur-omur-nisan.ics"',
      "Cache-Control": "public, max-age=86400",
    },
  });
}
